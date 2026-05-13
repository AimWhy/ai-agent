import type { AdminLogoutRequest } from '@repo/contracts'
import type { Context } from 'hono'
import type { ApiBindings } from '../../bindings'
import { getApiEnv } from '../../env'
import { refreshTokenInvalidError } from '../errors'
import { verifyRefreshToken } from '../jwt'
import { findRefreshTokenForSession, revokeSession } from '../repository'
import { hashTokenJti } from '../token-hash'

// logout service 最短，读法也最直接：
// 1. 验 refresh token
// 2. 找到它归属的 session
// 3. 撤销整条 session
export async function handleAdminLogout(params: {
  c: Context<{ Bindings: ApiBindings }>
  payload: AdminLogoutRequest
}) {
  const { c, payload } = params
  const env = getApiEnv(c.env)

  let claims

  try {
    claims = await verifyRefreshToken({
      token: payload.refreshToken,
      secret: env.JWT_REFRESH_SECRET,
    })
  } catch {
    throw refreshTokenInvalidError()
  }

  const currentToken = await findRefreshTokenForSession({
    db: c.env.DB,
    jtiHash: await hashTokenJti(claims.jti),
    sessionId: claims.sid,
  })

  if (!currentToken) {
    throw refreshTokenInvalidError()
  }

  // logout 的目标不是“删掉 JWT 字符串”，而是把这条 session 以及它下面所有 refresh token 一次性撤销。
  await revokeSession({
    db: c.env.DB,
    sessionId: currentToken.sessionId,
    revokedAtMs: Date.now(),
    reason: 'logout',
  })

  return {
    success: true as const,
  }
}
