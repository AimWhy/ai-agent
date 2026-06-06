import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import type { ApiDb } from '@/db/client'
import {
  applicationAuthMethods,
  applications,
  authSessions,
  defaultAvatarVersions,
  oauthAccounts,
  oauthLoginTickets,
  passwordCredentials,
  refreshTokens,
  roles,
  subscriptionPlans,
  userEmails,
  userRoleBindings,
  userSubscriptionBindings,
  users,
} from '@/db/schema'
import type {
  LoginUserRecord,
  RefreshTokenRecord,
  SessionContext,
  UserListItemRecord,
  UserProfileRecord,
} from './types'

export async function isPasswordLoginEnabledForApp(db: ApiDb, appCode: 'admin' | 'web'): Promise<boolean> {
  return isAuthMethodEnabledForApp(db, appCode, 'password')
}

export async function isAuthMethodEnabledForApp(
  db: ApiDb,
  appCode: 'admin' | 'web',
  provider: 'password' | 'github' | 'google',
): Promise<boolean> {
  const row = await db
    .select({ enabled: applicationAuthMethods.enabled })
    .from(applicationAuthMethods)
    .innerJoin(applications, eq(applications.id, applicationAuthMethods.applicationId))
    .where(
      and(
        eq(applications.code, appCode),
        eq(applications.status, 'active'),
        eq(applicationAuthMethods.provider, provider),
      ),
    )
    .limit(1)
    .get()

  return row?.enabled === 1
}

export async function isGithubLoginEnabledForWeb(db: ApiDb): Promise<boolean> {
  return isAuthMethodEnabledForApp(db, 'web', 'github')
}

export async function isPasswordLoginEnabledForAdmin(db: ApiDb): Promise<boolean> {
  return isPasswordLoginEnabledForApp(db, 'admin')
}

export async function isPasswordLoginEnabledForWeb(db: ApiDb): Promise<boolean> {
  return isPasswordLoginEnabledForApp(db, 'web')
}

export async function findLoginUserByNormalizedEmail(
  db: ApiDb,
  normalizedEmail: string,
): Promise<LoginUserRecord | null> {
  // 邮箱先映射到 user 和 credential，再做密码校验，登录入口和用户主体才不会耦死。
  const row = await db
    .select({
      userId: users.id,
      emailId: userEmails.id,
      email: userEmails.email,
      userStatus: users.status,
      passwordHash: passwordCredentials.passwordHash,
      passwordAlgo: passwordCredentials.passwordAlgo,
    })
    .from(userEmails)
    .innerJoin(users, eq(users.id, userEmails.userId))
    .innerJoin(
      passwordCredentials,
      and(
        eq(passwordCredentials.userId, users.id),
        eq(passwordCredentials.emailId, userEmails.id),
      ),
    )
    .where(eq(userEmails.normalizedEmail, normalizedEmail))
    .limit(1)
    .get()

  return row
    ? {
        ...row,
        userStatus: row.userStatus as LoginUserRecord['userStatus'],
        passwordAlgo: row.passwordAlgo as LoginUserRecord['passwordAlgo'],
      }
    : null
}

export async function getRolesForUserByApp(
  db: ApiDb,
  userId: string,
  appCode: 'admin' | 'web',
): Promise<string[]> {
  const rows = await db
    .select({ code: roles.code })
    .from(userRoleBindings)
    .innerJoin(roles, eq(roles.id, userRoleBindings.roleId))
    .innerJoin(applications, eq(applications.id, roles.applicationId))
    .where(
      and(
        eq(userRoleBindings.userId, userId),
        eq(userRoleBindings.status, 'active'),
        eq(roles.status, 'active'),
        eq(applications.code, appCode),
      ),
    )

  return rows.map((row) => row.code)
}

export async function getAdminRolesForUser(
  db: ApiDb,
  userId: string,
): Promise<string[]> {
  return getRolesForUserByApp(db, userId, 'admin')
}

export async function getWebRolesForUser(
  db: ApiDb,
  userId: string,
): Promise<string[]> {
  return getRolesForUserByApp(db, userId, 'web')
}

export async function findWebUserByGithubAccount(
  db: ApiDb,
  providerUserId: string,
): Promise<{
  userId: string
  userStatus: 'active' | 'suspended' | 'deleted'
} | null> {
  const row = await db
    .select({
      userId: users.id,
      userStatus: users.status,
    })
    .from(oauthAccounts)
    .innerJoin(users, eq(users.id, oauthAccounts.userId))
    .where(
      and(
        eq(oauthAccounts.provider, 'github'),
        eq(oauthAccounts.providerUserId, providerUserId),
      ),
    )
    .limit(1)
    .get()

  return row
    ? {
        ...row,
        userStatus: row.userStatus as 'active' | 'suspended' | 'deleted',
      }
    : null
}

export async function findUserByNormalizedEmail(
  db: ApiDb,
  normalizedEmail: string,
): Promise<{
  userId: string
  emailId: string
  userStatus: 'active' | 'suspended' | 'deleted'
} | null> {
  const row = await db
    .select({
      userId: users.id,
      emailId: userEmails.id,
      userStatus: users.status,
    })
    .from(userEmails)
    .innerJoin(users, eq(users.id, userEmails.userId))
    .where(eq(userEmails.normalizedEmail, normalizedEmail))
    .limit(1)
    .get()

  return row
    ? {
        ...row,
        userStatus: row.userStatus as 'active' | 'suspended' | 'deleted',
      }
    : null
}

export async function findPrimaryEmailIdByUserId(
  db: ApiDb,
  userId: string,
): Promise<string | null> {
  const row = await db
    .select({ id: userEmails.id })
    .from(userEmails)
    .where(
      and(
        eq(userEmails.userId, userId),
        eq(userEmails.isPrimary, 1),
      ),
    )
    .limit(1)
    .get()

  return row?.id ?? null
}

export async function createGithubWebUser(params: {
  db: ApiDb
  userId: string
  emailId: string
  oauthAccountId: string
  roleBindingId: string
  webRoleId: string
  email: string
  normalizedEmail: string
  displayName: string
  providerUserId: string
  providerLogin: string | null
  nowMs: number
}): Promise<void> {
  await params.db.batch([
    params.db.insert(users).values({
      id: params.userId,
      status: 'active',
      displayName: params.displayName,
      primaryEmailId: params.emailId,
      avatarKey: null,
      createdAtMs: params.nowMs,
      updatedAtMs: params.nowMs,
      lastLoginAtMs: null,
    }),
    params.db.insert(userEmails).values({
      id: params.emailId,
      userId: params.userId,
      email: params.email,
      normalizedEmail: params.normalizedEmail,
      isPrimary: 1,
      isVerified: 1,
      verifiedAtMs: params.nowMs,
      source: 'github',
      createdAtMs: params.nowMs,
      updatedAtMs: params.nowMs,
    }),
    params.db.insert(oauthAccounts).values({
      id: params.oauthAccountId,
      userId: params.userId,
      provider: 'github',
      providerUserId: params.providerUserId,
      providerLogin: params.providerLogin,
      emailId: params.emailId,
      createdAtMs: params.nowMs,
      updatedAtMs: params.nowMs,
    }),
    params.db.insert(userRoleBindings).values({
      id: params.roleBindingId,
      userId: params.userId,
      roleId: params.webRoleId,
      status: 'active',
      grantedAtMs: params.nowMs,
      revokedAtMs: null,
    }),
  ])
}

export async function linkGithubAccountToUser(params: {
  db: ApiDb
  oauthAccountId: string
  userId: string
  emailId: string | null
  providerUserId: string
  providerLogin: string | null
  nowMs: number
}): Promise<void> {
  await params.db.insert(oauthAccounts).values({
    id: params.oauthAccountId,
    userId: params.userId,
    provider: 'github',
    providerUserId: params.providerUserId,
    providerLogin: params.providerLogin,
    emailId: params.emailId,
    createdAtMs: params.nowMs,
    updatedAtMs: params.nowMs,
  })
}

export async function ensureUserHasRole(params: {
  db: ApiDb
  bindingId: string
  userId: string
  roleId: string
  nowMs: number
}): Promise<void> {
  await params.db.insert(userRoleBindings).values({
    id: params.bindingId,
    userId: params.userId,
    roleId: params.roleId,
    status: 'active',
    grantedAtMs: params.nowMs,
    revokedAtMs: null,
  }).onConflictDoUpdate({
    target: [userRoleBindings.userId, userRoleBindings.roleId],
    set: {
      status: 'active',
      revokedAtMs: null,
    },
  })
}

export async function insertOauthLoginTicket(params: {
  db: ApiDb
  id: string
  ticketHash: string
  userId: string
  applicationId: string
  provider: 'github' | 'google'
  createdAtMs: number
  expiresAtMs: number
}): Promise<void> {
  await params.db.insert(oauthLoginTickets).values({
    id: params.id,
    ticketHash: params.ticketHash,
    userId: params.userId,
    applicationId: params.applicationId,
    provider: params.provider,
    createdAtMs: params.createdAtMs,
    expiresAtMs: params.expiresAtMs,
    usedAtMs: null,
  })
}

export async function consumeOauthLoginTicket(params: {
  db: ApiDb
  ticketHash: string
  provider: 'github' | 'google'
  nowMs: number
}): Promise<{
  ticketId: string
  userId: string
  applicationId: string
  expiresAtMs: number
} | null> {
  const row = await params.db
    .update(oauthLoginTickets)
    .set({ usedAtMs: params.nowMs })
    .where(
      and(
        eq(oauthLoginTickets.ticketHash, params.ticketHash),
        eq(oauthLoginTickets.provider, params.provider),
        isNull(oauthLoginTickets.usedAtMs),
        sql`${oauthLoginTickets.expiresAtMs} > ${params.nowMs}`,
      ),
    )
    .returning({
      ticketId: oauthLoginTickets.id,
      userId: oauthLoginTickets.userId,
      applicationId: oauthLoginTickets.applicationId,
      expiresAtMs: oauthLoginTickets.expiresAtMs,
    })

  return row[0] ?? null
}

export async function getApplicationIdByCode(db: ApiDb, appCode: 'admin' | 'web'): Promise<string> {
  const row = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.code, appCode))
    .limit(1)
    .get()

  if (!row) {
    throw new Error(`${appCode} application is missing`)
  }

  return row.id
}

export async function getAdminApplicationId(db: ApiDb): Promise<string> {
  return getApplicationIdByCode(db, 'admin')
}

export async function getWebApplicationId(db: ApiDb): Promise<string> {
  return getApplicationIdByCode(db, 'web')
}

export async function createAuthSession(params: {
  db: ApiDb
  userId: string
  applicationId: string
  app: 'admin' | 'web'
  sessionType: 'admin' | 'web'
  userAgent: string | null
  ip: string | null
  nowMs: number
  expiresAtMs: number
  roles: string[]
}): Promise<SessionContext> {
  const sessionId = uuidv7()

  // 登录成功时同时写 session 和 users.last_login_at_ms，让“会话状态”和“用户最近登录时间”保持同一时刻更新。
  await params.db.batch([
    params.db.insert(authSessions).values({
      id: sessionId,
      userId: params.userId,
      applicationId: params.applicationId,
      sessionType: params.sessionType,
      deviceName: null,
      userAgent: params.userAgent,
      ip: params.ip,
      lastSeenAtMs: params.nowMs,
      createdAtMs: params.nowMs,
      expiresAtMs: params.expiresAtMs,
      revokedAtMs: null,
      revokeReason: null,
    }),
    params.db
      .update(users)
      .set({
        lastLoginAtMs: params.nowMs,
        updatedAtMs: params.nowMs,
      })
      .where(eq(users.id, params.userId)),
  ])

  return {
    sessionId,
    userId: params.userId,
    app: params.app,
    roles: params.roles,
    expiresAtMs: params.expiresAtMs,
  }
}

export async function createAdminSession(params: {
  db: ApiDb
  userId: string
  applicationId: string
  userAgent: string | null
  ip: string | null
  nowMs: number
  expiresAtMs: number
  roles: string[]
}): Promise<SessionContext> {
  return createAuthSession({
    ...params,
    app: 'admin',
    sessionType: 'admin',
  })
}

export async function createWebSession(params: {
  db: ApiDb
  userId: string
  applicationId: string
  userAgent: string | null
  ip: string | null
  nowMs: number
  expiresAtMs: number
  roles: string[]
}): Promise<SessionContext> {
  return createAuthSession({
    ...params,
    app: 'web',
    sessionType: 'web',
  })
}

export async function insertRefreshToken(params: {
  db: ApiDb
  tokenId: string
  sessionId: string
  jtiHash: string
  parentTokenId: string | null
  issuedAtMs: number
  expiresAtMs: number
}): Promise<void> {
  // parent_token_id 把 refresh token rotation 串成一条链，后面排查重放和替换关系会容易很多。
  await params.db.insert(refreshTokens).values({
    id: params.tokenId,
    sessionId: params.sessionId,
    jtiHash: params.jtiHash,
    parentTokenId: params.parentTokenId,
    issuedAtMs: params.issuedAtMs,
    expiresAtMs: params.expiresAtMs,
    usedAtMs: null,
    revokedAtMs: null,
    replacedByTokenId: null,
  })
}

export async function findRefreshTokenForSession(params: {
  db: ApiDb
  jtiHash: string
  sessionId: string
}): Promise<RefreshTokenRecord | null> {
  // 这里把 session 撤销状态一并查出来，refresh route 就不用再二次查询 auth_sessions。
  const row = await params.db
    .select({
      tokenId: refreshTokens.id,
      sessionId: refreshTokens.sessionId,
      userId: authSessions.userId,
      applicationCode: applications.code,
      expiresAtMs: refreshTokens.expiresAtMs,
      usedAtMs: refreshTokens.usedAtMs,
      revokedAtMs: refreshTokens.revokedAtMs,
      sessionRevokedAtMs: authSessions.revokedAtMs,
    })
    .from(refreshTokens)
    .innerJoin(authSessions, eq(authSessions.id, refreshTokens.sessionId))
    .innerJoin(applications, eq(applications.id, authSessions.applicationId))
    .where(
      and(
        eq(refreshTokens.jtiHash, params.jtiHash),
        eq(refreshTokens.sessionId, params.sessionId),
      ),
    )
    .limit(1)
    .get()

  return row ?? null
}

export async function markRefreshTokenUsed(params: {
  db: ApiDb
  tokenId: string
  usedAtMs: number
}): Promise<boolean> {
  // 条件更新只会让第一个成功刷新的请求拿到 changes=1，后续并发请求会直接落到 replay 分支。
  const updated = await params.db
    .update(refreshTokens)
    .set({ usedAtMs: params.usedAtMs })
    .where(
      and(
        eq(refreshTokens.id, params.tokenId),
        isNull(refreshTokens.usedAtMs),
        isNull(refreshTokens.revokedAtMs),
      ),
    )
    .returning({ id: refreshTokens.id })

  return updated.length === 1
}

export async function updateRefreshRotation(params: {
  db: ApiDb
  oldTokenId: string
  newTokenId: string
  sessionId: string
  lastSeenAtMs: number
}): Promise<void> {
  // 旧 token 指向新 token，加上 session 的 last_seen 更新时间，方便后续排查一条 refresh 链的演进过程。
  await params.db.batch([
    params.db
      .update(refreshTokens)
      .set({ replacedByTokenId: params.newTokenId })
      .where(eq(refreshTokens.id, params.oldTokenId)),
    params.db
      .update(authSessions)
      .set({ lastSeenAtMs: params.lastSeenAtMs })
      .where(eq(authSessions.id, params.sessionId)),
  ])
}

export async function revokeSession(params: {
  db: ApiDb
  sessionId: string
  revokedAtMs: number
  reason: string
}): Promise<void> {
  // 发现 refresh token 重放时直接撤销整个 session，比只封掉单个 token 更容易收住风险面。
  await params.db.batch([
    params.db
      .update(authSessions)
      .set({
        revokedAtMs: sql`COALESCE(${authSessions.revokedAtMs}, ${params.revokedAtMs})`,
        revokeReason: sql`COALESCE(${authSessions.revokeReason}, ${params.reason})`,
      })
      .where(eq(authSessions.id, params.sessionId)),
    params.db
      .update(refreshTokens)
      .set({
        revokedAtMs: sql`COALESCE(${refreshTokens.revokedAtMs}, ${params.revokedAtMs})`,
      })
      .where(
        and(
          eq(refreshTokens.sessionId, params.sessionId),
          isNull(refreshTokens.revokedAtMs),
        ),
      ),
  ])
}

export async function findUserProfileById(
  db: ApiDb,
  userId: string,
): Promise<UserProfileRecord | null> {
  const profile = await db
    .select({
      id: users.id,
      name: sql<string>`COALESCE(${users.displayName}, ${userEmails.email})`,
      email: userEmails.email,
      avatarKey: users.avatarKey,
      status: users.status,
      createdAtMs: users.createdAtMs,
      updatedAtMs: users.updatedAtMs,
      lastLoginAtMs: users.lastLoginAtMs,
    })
    .from(users)
    .innerJoin(userEmails, eq(userEmails.id, users.primaryEmailId))
    .where(eq(users.id, userId))
    .limit(1)
    .get()

  if (!profile) {
    return null
  }

  const rolesResult = await db
    .select({ code: roles.code })
    .from(userRoleBindings)
    .innerJoin(roles, eq(roles.id, userRoleBindings.roleId))
    .where(
      and(
        eq(userRoleBindings.userId, userId),
        eq(userRoleBindings.status, 'active'),
        eq(roles.status, 'active'),
      ),
    )

  return {
    ...profile,
    status: profile.status as UserProfileRecord['status'],
    roles: rolesResult.map((row) => row.code),
  }
}

export async function findLatestDefaultAvatarVersion(db: ApiDb): Promise<{
  key: string
  updatedAtMs: number
} | null> {
  const row = await db
    .select({
      key: defaultAvatarVersions.avatarKey,
      updatedAtMs: defaultAvatarVersions.createdAtMs,
    })
    .from(defaultAvatarVersions)
    .orderBy(sql`${defaultAvatarVersions.createdAtMs} desc, ${defaultAvatarVersions.id} desc`)
    .limit(1)
    .get()

  return row ?? null
}

export async function insertDefaultAvatarVersion(params: {
  db: ApiDb
  id: string
  key: string
  fileName: string
  contentType: string
  sizeBytes: number
  createdByUserId: string
  createdAtMs: number
}): Promise<void> {
  await params.db.insert(defaultAvatarVersions).values({
    id: params.id,
    avatarKey: params.key,
    fileName: params.fileName,
    contentType: params.contentType,
    sizeBytes: params.sizeBytes,
    createdByUserId: params.createdByUserId,
    createdAtMs: params.createdAtMs,
  })
}

export async function findDefaultAvatarHistory(db: ApiDb): Promise<Array<{
  id: string
  key: string
  fileName: string
  contentType: string
  sizeBytes: number
  createdByUserId: string | null
  createdAtMs: number
}>> {
  const rows = await db
    .select({
      id: defaultAvatarVersions.id,
      key: defaultAvatarVersions.avatarKey,
      fileName: defaultAvatarVersions.fileName,
      contentType: defaultAvatarVersions.contentType,
      sizeBytes: defaultAvatarVersions.sizeBytes,
      createdByUserId: defaultAvatarVersions.createdByUserId,
      createdAtMs: defaultAvatarVersions.createdAtMs,
    })
    .from(defaultAvatarVersions)
    .orderBy(sql`${defaultAvatarVersions.createdAtMs} desc, ${defaultAvatarVersions.id} desc`)

  const latestRowByKey = new Map<string, (typeof rows)[number]>()

  for (const row of rows) {
    if (!latestRowByKey.has(row.key)) {
      latestRowByKey.set(row.key, row)
    }
  }

  return [...latestRowByKey.values()]
}

export async function findRoleIdByCode(
  db: ApiDb,
  code: string,
): Promise<string | null> {
  const row = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(eq(roles.code, code), eq(roles.status, 'active')))
    .limit(1)
    .get()

  return row?.id ?? null
}

export async function findRoleList(db: ApiDb): Promise<Array<{
  id: string
  applicationCode: string
  code: string
  name: string
  status: 'active' | 'disabled' | 'deleted'
  createdAtMs: number
  updatedAtMs: number
  disabledAtMs: number | null
  deletedAtMs: number | null
}>> {
  const rows = await db
    .select({
      id: roles.id,
      applicationCode: applications.code,
      code: roles.code,
      name: roles.name,
      status: roles.status,
      createdAtMs: roles.createdAtMs,
      updatedAtMs: roles.updatedAtMs,
      disabledAtMs: roles.disabledAtMs,
      deletedAtMs: roles.deletedAtMs,
    })
    .from(roles)
    .innerJoin(applications, eq(applications.id, roles.applicationId))
    .where(sql`${roles.status} != 'deleted'`)
    .orderBy(sql`${applications.code} asc, ${roles.createdAtMs} desc, ${roles.id} desc`)

  return rows.map((row) => ({
    ...row,
    status: row.status as 'active' | 'disabled' | 'deleted',
  }))
}

export async function createRole(params: {
  db: ApiDb
  id: string
  applicationId: string
  code: string
  name: string
  nowMs: number
}): Promise<void> {
  await params.db.insert(roles).values({
    id: params.id,
    applicationId: params.applicationId,
    code: params.code,
    name: params.name,
    status: 'active',
    createdAtMs: params.nowMs,
    updatedAtMs: params.nowMs,
    disabledAtMs: null,
    deletedAtMs: null,
  })
}

export async function findRoleById(
  db: ApiDb,
  roleId: string,
): Promise<{
  id: string
  applicationCode: string
  code: string
  name: string
  status: 'active' | 'disabled' | 'deleted'
} | null> {
  const row = await db
    .select({
      id: roles.id,
      applicationCode: applications.code,
      code: roles.code,
      name: roles.name,
      status: roles.status,
    })
    .from(roles)
    .innerJoin(applications, eq(applications.id, roles.applicationId))
    .where(eq(roles.id, roleId))
    .limit(1)
    .get()

  return row
    ? {
        ...row,
        status: row.status as 'active' | 'disabled' | 'deleted',
      }
    : null
}

export async function disableRole(params: {
  db: ApiDb
  roleId: string
  nowMs: number
}): Promise<void> {
  await params.db
    .update(roles)
    .set({
      status: 'disabled',
      updatedAtMs: params.nowMs,
      disabledAtMs: params.nowMs,
    })
    .where(eq(roles.id, params.roleId))
}

export async function deleteRole(params: {
  db: ApiDb
  roleId: string
  nowMs: number
}): Promise<void> {
  await params.db
    .update(roles)
    .set({
      status: 'deleted',
      updatedAtMs: params.nowMs,
      deletedAtMs: params.nowMs,
    })
    .where(eq(roles.id, params.roleId))
}

export async function listSubscriptionPlans(db: ApiDb): Promise<Array<{
  id: string
  code: string
  name: string
  description: string | null
  price: string
  billingPeriod: 'month' | 'year' | 'one_time'
  maxAgents: number
  supportsGroupChat: boolean
  supportsMultiAgentLinkage: boolean
  supportsDiscoverSquare: boolean
  supportsAgentTimeEvolution: boolean
  status: 'active' | 'disabled' | 'deleted'
  createdAtMs: number
  updatedAtMs: number
  deletedAtMs: number | null
}>> {
  const rows = await db
    .select({
      id: subscriptionPlans.id,
      code: subscriptionPlans.code,
      name: subscriptionPlans.name,
      description: subscriptionPlans.description,
      price: subscriptionPlans.price,
      billingPeriod: subscriptionPlans.billingPeriod,
      maxAgents: subscriptionPlans.maxAgents,
      supportsGroupChat: subscriptionPlans.supportsGroupChat,
      supportsMultiAgentLinkage: subscriptionPlans.supportsMultiAgentLinkage,
      supportsDiscoverSquare: subscriptionPlans.supportsDiscoverSquare,
      supportsAgentTimeEvolution: subscriptionPlans.supportsAgentTimeEvolution,
      status: subscriptionPlans.status,
      createdAtMs: subscriptionPlans.createdAtMs,
      updatedAtMs: subscriptionPlans.updatedAtMs,
      deletedAtMs: subscriptionPlans.deletedAtMs,
    })
    .from(subscriptionPlans)
    .where(sql`${subscriptionPlans.status} != 'deleted'`)
    .orderBy(sql`${subscriptionPlans.createdAtMs} desc, ${subscriptionPlans.id} desc`)

  return rows.map((row) => ({
    ...row,
    billingPeriod: row.billingPeriod as 'month' | 'year' | 'one_time',
    supportsGroupChat: row.supportsGroupChat === 1,
    supportsMultiAgentLinkage: row.supportsMultiAgentLinkage === 1,
    supportsDiscoverSquare: row.supportsDiscoverSquare === 1,
    supportsAgentTimeEvolution: row.supportsAgentTimeEvolution === 1,
    status: row.status as 'active' | 'disabled' | 'deleted',
  }))
}

export async function createSubscriptionPlan(params: {
  db: ApiDb
  id: string
  code: string
  name: string
  description: string | null
  price: string
  billingPeriod: 'month' | 'year' | 'one_time'
  maxAgents: number
  supportsGroupChat: boolean
  supportsMultiAgentLinkage: boolean
  supportsDiscoverSquare: boolean
  supportsAgentTimeEvolution: boolean
  nowMs: number
}): Promise<void> {
  await params.db.insert(subscriptionPlans).values({
    id: params.id,
    code: params.code,
    name: params.name,
    description: params.description,
    price: params.price,
    billingPeriod: params.billingPeriod,
    maxAgents: params.maxAgents,
    supportsGroupChat: params.supportsGroupChat ? 1 : 0,
    supportsMultiAgentLinkage: params.supportsMultiAgentLinkage ? 1 : 0,
    supportsDiscoverSquare: params.supportsDiscoverSquare ? 1 : 0,
    supportsAgentTimeEvolution: params.supportsAgentTimeEvolution ? 1 : 0,
    status: 'active',
    createdAtMs: params.nowMs,
    updatedAtMs: params.nowMs,
    deletedAtMs: null,
  })
}

export async function updateSubscriptionPlan(params: {
  db: ApiDb
  planId: string
  name: string
  description: string | null
  price: string
  billingPeriod: 'month' | 'year' | 'one_time'
  maxAgents: number
  supportsGroupChat: boolean
  supportsMultiAgentLinkage: boolean
  supportsDiscoverSquare: boolean
  supportsAgentTimeEvolution: boolean
  nowMs: number
}): Promise<void> {
  await params.db
    .update(subscriptionPlans)
    .set({
      name: params.name,
      description: params.description,
      price: params.price,
      billingPeriod: params.billingPeriod,
      maxAgents: params.maxAgents,
      supportsGroupChat: params.supportsGroupChat ? 1 : 0,
      supportsMultiAgentLinkage: params.supportsMultiAgentLinkage ? 1 : 0,
      supportsDiscoverSquare: params.supportsDiscoverSquare ? 1 : 0,
      supportsAgentTimeEvolution: params.supportsAgentTimeEvolution ? 1 : 0,
      updatedAtMs: params.nowMs,
    })
    .where(eq(subscriptionPlans.id, params.planId))
}

export async function disableSubscriptionPlan(params: {
  db: ApiDb
  planId: string
  nowMs: number
}): Promise<void> {
  await params.db
    .update(subscriptionPlans)
    .set({
      status: 'disabled',
      updatedAtMs: params.nowMs,
    })
    .where(eq(subscriptionPlans.id, params.planId))
}

export async function deleteSubscriptionPlan(params: {
  db: ApiDb
  planId: string
  nowMs: number
}): Promise<void> {
  await params.db
    .update(subscriptionPlans)
    .set({
      status: 'deleted',
      updatedAtMs: params.nowMs,
      deletedAtMs: params.nowMs,
    })
    .where(eq(subscriptionPlans.id, params.planId))
}

export async function findSubscriptionUserList(
  db: ApiDb,
  params: {
    offset: number
    limit: number
  },
): Promise<{
  items: Array<{
    id: string
    userId: string
    userName: string
    userEmail: string
    userStatus: 'active' | 'suspended' | 'deleted'
    planId: string
    planCode: string
    planName: string
    planPrice: string
    planBillingPeriod: 'month' | 'year' | 'one_time'
    assignedAtMs: number
    assignedByUserId: string | null
  }>
  total: number
}> {
  const totalRow = await db
    .select({ total: sql<number>`count(*)` })
    .from(userSubscriptionBindings)
    .where(eq(userSubscriptionBindings.status, 'active'))
    .get()

  const total = Number(totalRow?.total ?? 0)

  const rows = await db
    .select({
      id: userSubscriptionBindings.id,
      userId: users.id,
      userName: sql<string>`COALESCE(${users.displayName}, ${userEmails.email})`,
      userEmail: userEmails.email,
      userStatus: users.status,
      planId: subscriptionPlans.id,
      planCode: subscriptionPlans.code,
      planName: subscriptionPlans.name,
      planPrice: subscriptionPlans.price,
      planBillingPeriod: subscriptionPlans.billingPeriod,
      assignedAtMs: userSubscriptionBindings.assignedAtMs,
      assignedByUserId: userSubscriptionBindings.assignedByUserId,
    })
    .from(userSubscriptionBindings)
    .innerJoin(users, eq(users.id, userSubscriptionBindings.userId))
    .innerJoin(userEmails, eq(userEmails.id, users.primaryEmailId))
    .innerJoin(subscriptionPlans, eq(subscriptionPlans.id, userSubscriptionBindings.subscriptionPlanId))
    .where(eq(userSubscriptionBindings.status, 'active'))
    .orderBy(sql`${userSubscriptionBindings.assignedAtMs} desc, ${userSubscriptionBindings.id} desc`)
    .limit(params.limit)
    .offset(params.offset)

  return {
    total,
    items: rows.map((row) => ({
      ...row,
      userStatus: row.userStatus as 'active' | 'suspended' | 'deleted',
      planBillingPeriod: row.planBillingPeriod as 'month' | 'year' | 'one_time',
    })),
  }
}

export async function findActiveUserById(
  db: ApiDb,
  userId: string,
): Promise<{ id: string } | null> {
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.status, 'active')))
    .limit(1)
    .get()

  return row ?? null
}

export async function findActiveSubscriptionPlanById(
  db: ApiDb,
  planId: string,
): Promise<{ id: string } | null> {
  const row = await db
    .select({ id: subscriptionPlans.id })
    .from(subscriptionPlans)
    .where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.status, 'active')))
    .limit(1)
    .get()

  return row ?? null
}

export async function assignUserSubscriptionPlan(params: {
  db: ApiDb
  bindingId: string
  userId: string
  planId: string
  assignedByUserId: string
  nowMs: number
}): Promise<void> {
  const currentBinding = await params.db
    .select({ id: userSubscriptionBindings.id, planId: userSubscriptionBindings.subscriptionPlanId })
    .from(userSubscriptionBindings)
    .where(and(eq(userSubscriptionBindings.userId, params.userId), eq(userSubscriptionBindings.status, 'active')))
    .limit(1)
    .get()

  if (currentBinding?.planId === params.planId) {
    return
  }

  await params.db.batch([
    params.db
      .update(userSubscriptionBindings)
      .set({
        status: 'revoked',
        revokedAtMs: params.nowMs,
      })
      .where(and(eq(userSubscriptionBindings.userId, params.userId), eq(userSubscriptionBindings.status, 'active'))),
    params.db.insert(userSubscriptionBindings).values({
      id: params.bindingId,
      userId: params.userId,
      subscriptionPlanId: params.planId,
      status: 'active',
      assignedAtMs: params.nowMs,
      assignedByUserId: params.assignedByUserId,
      revokedAtMs: null,
    }),
  ])
}

export async function updateUserAvatarKey(params: {
  db: ApiDb
  userId: string
  avatarKey: string
  updatedAtMs: number
}): Promise<void> {
  await params.db
    .update(users)
    .set({
      avatarKey: params.avatarKey,
      updatedAtMs: params.updatedAtMs,
    })
    .where(eq(users.id, params.userId))
}

export async function createUserWithPassword(params: {
  db: ApiDb
  userId: string
  emailId: string
  credentialId: string
  roleBindingId: string
  roleId: string
  displayName: string
  email: string
  normalizedEmail: string
  passwordHash: string
  passwordAlgo: 'bcrypt'
  avatarKey: string | null
  nowMs: number
}): Promise<void> {
  await params.db.batch([
    params.db.insert(users).values({
      id: params.userId,
      status: 'active',
      displayName: params.displayName,
      primaryEmailId: params.emailId,
      avatarKey: params.avatarKey,
      createdAtMs: params.nowMs,
      updatedAtMs: params.nowMs,
      lastLoginAtMs: null,
    }),
    params.db.insert(userEmails).values({
      id: params.emailId,
      userId: params.userId,
      email: params.email,
      normalizedEmail: params.normalizedEmail,
      isPrimary: 1,
      isVerified: 1,
      verifiedAtMs: params.nowMs,
      source: 'password',
      createdAtMs: params.nowMs,
      updatedAtMs: params.nowMs,
    }),
    params.db.insert(passwordCredentials).values({
      id: params.credentialId,
      userId: params.userId,
      emailId: params.emailId,
      passwordHash: params.passwordHash,
      passwordAlgo: params.passwordAlgo,
      passwordUpdatedAtMs: params.nowMs,
      failedAttempts: 0,
      lockedUntilMs: null,
      mustResetPassword: 0,
      createdAtMs: params.nowMs,
      updatedAtMs: params.nowMs,
    }),
    params.db.insert(userRoleBindings).values({
      id: params.roleBindingId,
      userId: params.userId,
      roleId: params.roleId,
      status: 'active',
      grantedAtMs: params.nowMs,
      revokedAtMs: null,
    }),
  ])
}

export async function findUserList(
  db: ApiDb,
  params: {
    offset: number
    limit: number
  },
): Promise<{ items: UserListItemRecord[]; total: number }> {
  const totalRow = await db
    .select({ total: sql<number>`count(*)` })
    .from(users)
    .get()

  const total = Number(totalRow?.total ?? 0)

  const userList = await db
    .select({
      id: users.id,
      name: sql<string>`COALESCE(${users.displayName}, ${userEmails.email})`,
      email: userEmails.email,
      avatarKey: users.avatarKey,
      status: users.status,
      createdAtMs: users.createdAtMs,
      updatedAtMs: users.updatedAtMs,
      lastLoginAtMs: users.lastLoginAtMs,
    })
    .from(users)
    .innerJoin(userEmails, eq(userEmails.id, users.primaryEmailId))
    .orderBy(sql`${users.createdAtMs} desc, ${users.id} desc`)
    .limit(params.limit)
    .offset(params.offset)

  if (userList.length === 0) {
    return { items: [], total }
  }

  const userIds = userList.map((user) => user.id)
  const roleRows = await db
    .select({
      userId: userRoleBindings.userId,
      code: roles.code,
    })
    .from(userRoleBindings)
    .innerJoin(roles, eq(roles.id, userRoleBindings.roleId))
    .where(
      and(
        inArray(userRoleBindings.userId, userIds),
        eq(userRoleBindings.status, 'active'),
        eq(roles.status, 'active'),
      ),
    )

  const rolesByUserId = new Map<string, string[]>()

  for (const row of roleRows) {
    const currentRoles = rolesByUserId.get(row.userId) ?? []
    currentRoles.push(row.code)
    rolesByUserId.set(row.userId, currentRoles)
  }

  return {
    total,
    items: userList.map((user) => ({
      ...user,
      status: user.status as UserListItemRecord['status'],
      roles: rolesByUserId.get(user.id) ?? [],
    })),
  }
}
