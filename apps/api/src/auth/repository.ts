import { uuidv7 } from 'uuidv7'
import type {
  LoginUserRecord,
  RefreshTokenRecord,
  SessionContext,
} from './types'

export async function isPasswordLoginEnabledForAdmin(db: D1Database): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT application_auth_methods.enabled AS enabled
       FROM application_auth_methods
       INNER JOIN applications
         ON applications.id = application_auth_methods.application_id
       WHERE applications.code = ?
         AND applications.status = 'active'
         AND application_auth_methods.provider = ?
       LIMIT 1`,
    )
    .bind('admin', 'password')
    .first<{ enabled: number }>()

  return row?.enabled === 1
}

export async function findLoginUserByNormalizedEmail(
  db: D1Database,
  normalizedEmail: string,
): Promise<LoginUserRecord | null> {
  // 邮箱先映射到 user 和 credential，再做密码校验，登录入口和用户主体才不会耦死。
  return db
    .prepare(
      `SELECT
         users.id AS userId,
         user_emails.id AS emailId,
         user_emails.email AS email,
         users.status AS userStatus,
         password_credentials.password_hash AS passwordHash,
         password_credentials.password_algo AS passwordAlgo
       FROM user_emails
       INNER JOIN users ON users.id = user_emails.user_id
       INNER JOIN password_credentials
         ON password_credentials.user_id = users.id
        AND password_credentials.email_id = user_emails.id
       WHERE user_emails.normalized_email = ?
       LIMIT 1`,
    )
    .bind(normalizedEmail)
    .first<LoginUserRecord>()
}

export async function getAdminRolesForUser(
  db: D1Database,
  userId: string,
): Promise<string[]> {
  // 这里故意只返回 code 列表，因为后续签 access token 和做 admin 门禁只关心角色代码本身。
  const result = await db
    .prepare(
      `SELECT roles.code AS code
       FROM user_role_bindings
       INNER JOIN roles ON roles.id = user_role_bindings.role_id
       INNER JOIN applications ON applications.id = roles.application_id
       WHERE user_role_bindings.user_id = ?
         AND user_role_bindings.status = 'active'
         AND applications.code = 'admin'`,
    )
    .bind(userId)
    .all<{ code: string }>()

  return result.results.map((row) => row.code)
}

export async function getAdminApplicationId(db: D1Database): Promise<string> {
  const row = await db
    .prepare(`SELECT id FROM applications WHERE code = 'admin' LIMIT 1`)
    .first<{ id: string }>()

  if (!row) {
    throw new Error('Admin application is missing')
  }

  return row.id
}

export async function createAdminSession(params: {
  db: D1Database
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
    params.db
      .prepare(
        `INSERT INTO auth_sessions (
           id,
           user_id,
           application_id,
           session_type,
           device_name,
           user_agent,
           ip,
           last_seen_at_ms,
           created_at_ms,
           expires_at_ms,
           revoked_at_ms,
           revoke_reason
         ) VALUES (?, ?, ?, 'admin', NULL, ?, ?, ?, ?, ?, NULL, NULL)`,
      )
      .bind(
        sessionId,
        params.userId,
        params.applicationId,
        params.userAgent,
        params.ip,
        params.nowMs,
        params.nowMs,
        params.expiresAtMs,
      ),
    params.db
      .prepare(
        `UPDATE users
         SET last_login_at_ms = ?, updated_at_ms = ?
         WHERE id = ?`,
      )
      .bind(params.nowMs, params.nowMs, params.userId),
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
  db: D1Database
  tokenId: string
  sessionId: string
  jtiHash: string
  parentTokenId: string | null
  issuedAtMs: number
  expiresAtMs: number
}): Promise<void> {
  // parent_token_id 把 refresh token rotation 串成一条链，后面排查重放和替换关系会容易很多。
  await params.db
    .prepare(
      `INSERT INTO refresh_tokens (
         id,
         session_id,
         jti_hash,
         parent_token_id,
         issued_at_ms,
         expires_at_ms,
         used_at_ms,
         revoked_at_ms,
         replaced_by_token_id
       ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL)`,
    )
    .bind(
      params.tokenId,
      params.sessionId,
      params.jtiHash,
      params.parentTokenId,
      params.issuedAtMs,
      params.expiresAtMs,
    )
    .run()
}

export async function findRefreshTokenForSession(params: {
  db: D1Database
  jtiHash: string
  sessionId: string
}): Promise<RefreshTokenRecord | null> {
  // 这里把 session 撤销状态一并查出来，refresh route 就不用再二次查询 auth_sessions。
  return params.db
    .prepare(
      `SELECT
         refresh_tokens.id AS tokenId,
         refresh_tokens.session_id AS sessionId,
         auth_sessions.user_id AS userId,
         applications.code AS applicationCode,
         refresh_tokens.expires_at_ms AS expiresAtMs,
         refresh_tokens.used_at_ms AS usedAtMs,
         refresh_tokens.revoked_at_ms AS revokedAtMs,
         auth_sessions.revoked_at_ms AS sessionRevokedAtMs
       FROM refresh_tokens
       INNER JOIN auth_sessions ON auth_sessions.id = refresh_tokens.session_id
       INNER JOIN applications ON applications.id = auth_sessions.application_id
       WHERE refresh_tokens.jti_hash = ?
         AND refresh_tokens.session_id = ?
       LIMIT 1`,
    )
    .bind(params.jtiHash, params.sessionId)
    .first<RefreshTokenRecord>()
}

export async function markRefreshTokenUsed(params: {
  db: D1Database
  tokenId: string
  usedAtMs: number
}): Promise<boolean> {
  // 条件更新只会让第一个成功刷新的请求拿到 changes=1，后续并发请求会直接落到 replay 分支。
  const result = await params.db
    .prepare(
      `UPDATE refresh_tokens
       SET used_at_ms = ?
       WHERE id = ?
         AND used_at_ms IS NULL
         AND revoked_at_ms IS NULL`,
    )
    .bind(params.usedAtMs, params.tokenId)
    .run()

  return (result.meta.changes ?? 0) === 1
}

export async function updateRefreshRotation(params: {
  db: D1Database
  oldTokenId: string
  newTokenId: string
  sessionId: string
  lastSeenAtMs: number
}): Promise<void> {
  // 旧 token 指向新 token，加上 session 的 last_seen 更新时间，方便后续排查一条 refresh 链的演进过程。
  await params.db.batch([
    params.db
      .prepare(
        `UPDATE refresh_tokens
         SET replaced_by_token_id = ?
         WHERE id = ?`,
      )
      .bind(params.newTokenId, params.oldTokenId),
    params.db
      .prepare(
        `UPDATE auth_sessions
         SET last_seen_at_ms = ?
         WHERE id = ?`,
      )
      .bind(params.lastSeenAtMs, params.sessionId),
  ])
}

export async function revokeSession(params: {
  db: D1Database
  sessionId: string
  revokedAtMs: number
  reason: string
}): Promise<void> {
  // 发现 refresh token 重放时直接撤销整个 session，比只封掉单个 token 更容易收住风险面。
  await params.db.batch([
    params.db
      .prepare(
        `UPDATE auth_sessions
         SET revoked_at_ms = COALESCE(revoked_at_ms, ?),
             revoke_reason = COALESCE(revoke_reason, ?)
         WHERE id = ?`,
      )
      .bind(params.revokedAtMs, params.reason, params.sessionId),
    params.db
      .prepare(
        `UPDATE refresh_tokens
         SET revoked_at_ms = COALESCE(revoked_at_ms, ?)
         WHERE session_id = ?
           AND revoked_at_ms IS NULL`,
      )
      .bind(params.revokedAtMs, params.sessionId),
  ])
}
