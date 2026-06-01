import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import type { ApiDb } from '@/db/client'
import {
  applicationAuthMethods,
  applications,
  authSessions,
  passwordCredentials,
  refreshTokens,
  roles,
  userEmails,
  userRoleBindings,
  users,
} from '@/db/schema'
import type {
  LoginUserRecord,
  RefreshTokenRecord,
  SessionContext,
  UserListItemRecord,
  UserProfileRecord,
} from './types'

export async function isPasswordLoginEnabledForAdmin(db: ApiDb): Promise<boolean> {
  const row = await db
    .select({ enabled: applicationAuthMethods.enabled })
    .from(applicationAuthMethods)
    .innerJoin(applications, eq(applications.id, applicationAuthMethods.applicationId))
    .where(
      and(
        eq(applications.code, 'admin'),
        eq(applications.status, 'active'),
        eq(applicationAuthMethods.provider, 'password'),
      ),
    )
    .limit(1)
    .get()

  return row?.enabled === 1
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

export async function getAdminRolesForUser(
  db: ApiDb,
  userId: string,
): Promise<string[]> {
  // 这里故意只返回 code 列表，因为后续签 access token 和做 admin 门禁只关心角色代码本身。
  const rows = await db
    .select({ code: roles.code })
    .from(userRoleBindings)
    .innerJoin(roles, eq(roles.id, userRoleBindings.roleId))
    .innerJoin(applications, eq(applications.id, roles.applicationId))
    .where(
      and(
        eq(userRoleBindings.userId, userId),
        eq(userRoleBindings.status, 'active'),
        eq(applications.code, 'admin'),
      ),
    )

  return rows.map((row) => row.code)
}

export async function getAdminApplicationId(db: ApiDb): Promise<string> {
  const row = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.code, 'admin'))
    .limit(1)
    .get()

  if (!row) {
    throw new Error('Admin application is missing')
  }

  return row.id
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
  const sessionId = uuidv7()

  // 登录成功时同时写 session 和 users.last_login_at_ms，让“会话状态”和“用户最近登录时间”保持同一时刻更新。
  await params.db.batch([
    params.db.insert(authSessions).values({
      id: sessionId,
      userId: params.userId,
      applicationId: params.applicationId,
      sessionType: 'admin',
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
    app: 'admin',
    roles: params.roles,
    expiresAtMs: params.expiresAtMs,
  }
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
      ),
    )

  return {
    ...profile,
    status: profile.status as UserProfileRecord['status'],
    roles: rolesResult.map((row) => row.code),
  }
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
