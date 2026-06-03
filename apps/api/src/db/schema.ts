import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  status: text('status').notNull(),
  displayName: text('display_name'),
  primaryEmailId: text('primary_email_id'),
  avatarKey: text('avatar_key'),
  createdAtMs: integer('created_at_ms').notNull(),
  updatedAtMs: integer('updated_at_ms').notNull(),
  lastLoginAtMs: integer('last_login_at_ms'),
})

export const defaultAvatarVersions = sqliteTable('default_avatar_versions', {
  id: text('id').primaryKey(),
  avatarKey: text('avatar_key').notNull(),
  fileName: text('file_name').notNull(),
  contentType: text('content_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  createdByUserId: text('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAtMs: integer('created_at_ms').notNull(),
}, (table) => [
  index('idx_default_avatar_versions_created_at_ms').on(table.createdAtMs),
])

export const userEmails = sqliteTable(
  'user_emails',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    normalizedEmail: text('normalized_email').notNull(),
    isPrimary: integer('is_primary').notNull(),
    isVerified: integer('is_verified').notNull(),
    verifiedAtMs: integer('verified_at_ms'),
    source: text('source').notNull(),
    createdAtMs: integer('created_at_ms').notNull(),
    updatedAtMs: integer('updated_at_ms').notNull(),
  },
  (table) => [
    uniqueIndex('idx_user_emails_normalized_email_unique').on(table.normalizedEmail),
    uniqueIndex('idx_user_emails_user_normalized_unique').on(table.userId, table.normalizedEmail),
    uniqueIndex('idx_user_emails_one_primary_per_user').on(table.userId).where(sql`${table.isPrimary} = 1`),
  ],
)

export const passwordCredentials = sqliteTable(
  'password_credentials',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    emailId: text('email_id')
      .notNull()
      .references(() => userEmails.id, { onDelete: 'cascade' }),
    passwordHash: text('password_hash').notNull(),
    passwordAlgo: text('password_algo').notNull(),
    passwordUpdatedAtMs: integer('password_updated_at_ms').notNull(),
    failedAttempts: integer('failed_attempts').notNull(),
    lockedUntilMs: integer('locked_until_ms'),
    mustResetPassword: integer('must_reset_password').notNull(),
    createdAtMs: integer('created_at_ms').notNull(),
    updatedAtMs: integer('updated_at_ms').notNull(),
  },
  (table) => [
    uniqueIndex('idx_password_credentials_user_unique').on(table.userId),
    uniqueIndex('idx_password_credentials_email_unique').on(table.emailId),
  ],
)

export const applications = sqliteTable(
  'applications',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    status: text('status').notNull(),
    createdAtMs: integer('created_at_ms').notNull(),
  },
  (table) => [uniqueIndex('idx_applications_code_unique').on(table.code)],
)

export const applicationAuthMethods = sqliteTable(
  'application_auth_methods',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    enabled: integer('enabled').notNull(),
    createdAtMs: integer('created_at_ms').notNull(),
    updatedAtMs: integer('updated_at_ms').notNull(),
  },
  (table) => [
    uniqueIndex('idx_application_auth_methods_unique').on(table.applicationId, table.provider),
  ],
)

export const roles = sqliteTable(
  'roles',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    status: text('status').notNull(),
    createdAtMs: integer('created_at_ms').notNull(),
    updatedAtMs: integer('updated_at_ms').notNull(),
    disabledAtMs: integer('disabled_at_ms'),
    deletedAtMs: integer('deleted_at_ms'),
  },
  (table) => [uniqueIndex('idx_roles_application_code_unique').on(table.applicationId, table.code)],
)

export const subscriptionPlans = sqliteTable('subscription_plans', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price: text('price').notNull(),
  billingPeriod: text('billing_period').notNull(),
  maxAgents: integer('max_agents').notNull(),
  supportsGroupChat: integer('supports_group_chat').notNull(),
  supportsMultiAgentLinkage: integer('supports_multi_agent_linkage').notNull(),
  supportsDiscoverSquare: integer('supports_discover_square').notNull(),
  supportsAgentTimeEvolution: integer('supports_agent_time_evolution').notNull(),
  status: text('status').notNull(),
  createdAtMs: integer('created_at_ms').notNull(),
  updatedAtMs: integer('updated_at_ms').notNull(),
  deletedAtMs: integer('deleted_at_ms'),
}, (table) => [
  uniqueIndex('idx_subscription_plans_code_unique').on(table.code),
])

export const userSubscriptionBindings = sqliteTable(
  'user_subscription_bindings',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subscriptionPlanId: text('subscription_plan_id')
      .notNull()
      .references(() => subscriptionPlans.id, { onDelete: 'restrict' }),
    status: text('status').notNull(),
    assignedAtMs: integer('assigned_at_ms').notNull(),
    assignedByUserId: text('assigned_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    revokedAtMs: integer('revoked_at_ms'),
  },
  (table) => [
    index('idx_user_subscription_bindings_user_id').on(table.userId),
    index('idx_user_subscription_bindings_plan_id').on(table.subscriptionPlanId),
    uniqueIndex('idx_user_subscription_bindings_one_active_per_user').on(table.userId).where(sql`${table.status} = 'active'`),
  ],
)

export const userRoleBindings = sqliteTable(
  'user_role_bindings',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    grantedAtMs: integer('granted_at_ms').notNull(),
    revokedAtMs: integer('revoked_at_ms'),
  },
  (table) => [uniqueIndex('idx_user_role_bindings_unique').on(table.userId, table.roleId)],
)

export const authSessions = sqliteTable(
  'auth_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    sessionType: text('session_type').notNull(),
    deviceName: text('device_name'),
    userAgent: text('user_agent'),
    ip: text('ip'),
    lastSeenAtMs: integer('last_seen_at_ms'),
    createdAtMs: integer('created_at_ms').notNull(),
    expiresAtMs: integer('expires_at_ms').notNull(),
    revokedAtMs: integer('revoked_at_ms'),
    revokeReason: text('revoke_reason'),
  },
  (table) => [
    index('idx_auth_sessions_user_id').on(table.userId),
    index('idx_auth_sessions_application_id').on(table.applicationId),
  ],
)

export const refreshTokens = sqliteTable(
  'refresh_tokens',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => authSessions.id, { onDelete: 'cascade' }),
    jtiHash: text('jti_hash').notNull(),
    parentTokenId: text('parent_token_id').references((): ReturnType<typeof text> => refreshTokens.id, {
      onDelete: 'set null',
    }),
    issuedAtMs: integer('issued_at_ms').notNull(),
    expiresAtMs: integer('expires_at_ms').notNull(),
    usedAtMs: integer('used_at_ms'),
    revokedAtMs: integer('revoked_at_ms'),
    replacedByTokenId: text('replaced_by_token_id').references((): ReturnType<typeof text> => refreshTokens.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    uniqueIndex('idx_refresh_tokens_jti_hash_unique').on(table.jtiHash),
    index('idx_refresh_tokens_session_id').on(table.sessionId),
  ],
)

export const schema = {
  users,
  userEmails,
  passwordCredentials,
  applications,
  applicationAuthMethods,
  roles,
  userRoleBindings,
  authSessions,
  refreshTokens,
  defaultAvatarVersions,
  subscriptionPlans,
  userSubscriptionBindings,
}
