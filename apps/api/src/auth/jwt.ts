import { SignJWT, jwtVerify } from 'jose'
import { uuidv7 } from 'uuidv7'
import type {
  AccessTokenClaims,
  RefreshTokenClaims,
  SessionContext,
} from './types'

const encoder = new TextEncoder()

function toSecret(secret: string): Uint8Array {
  return encoder.encode(secret)
}

export async function signAccessToken(params: {
  claims: AccessTokenClaims
  secret: string
  ttlSec: number
}): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000)

  // access token 只带请求链路真正需要的最小身份信息，避免把会话状态塞进无状态令牌里。
  return new SignJWT({
    sid: params.claims.sid,
    app: params.claims.app,
    roles: params.claims.roles,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(params.claims.sub)
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + params.ttlSec)
    .sign(toSecret(params.secret))
}

export async function signRefreshToken(params: {
  claims: Omit<RefreshTokenClaims, 'jti'>
  secret: string
  ttlSec: number
}): Promise<{
  token: string
  jti: string
}> {
  const nowSec = Math.floor(Date.now() / 1000)
  const jti = uuidv7()

  // refresh token 额外携带 jti，是为了把每一次续签都变成可追踪、可撤销的一条状态记录。
  const token = await new SignJWT({
    sid: params.claims.sid,
    app: params.claims.app,
    jti,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(params.claims.sub)
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + params.ttlSec)
    .sign(toSecret(params.secret))

  return { token, jti }
}

export async function verifyAccessToken(params: {
  token: string
  secret: string
}): Promise<AccessTokenClaims> {
  const { payload } = await jwtVerify(params.token, toSecret(params.secret), {
    algorithms: ['HS256'],
  })

  const sid = payload.sid
  const app = payload.app
  const roles = payload.roles
  const sub = payload.sub

  if (
    typeof sid !== 'string' ||
    typeof app !== 'string' ||
    typeof sub !== 'string' ||
    app !== 'admin' ||
    !Array.isArray(roles) ||
    roles.some((role) => typeof role !== 'string')
  ) {
    throw new Error('Invalid access token claims')
  }

  return {
    sid,
    app: 'admin',
    roles,
    sub,
  }
}

export async function verifyRefreshToken(params: {
  token: string
  secret: string
}): Promise<RefreshTokenClaims> {
  const { payload } = await jwtVerify(params.token, toSecret(params.secret), {
    algorithms: ['HS256'],
  })

  const sid = payload.sid
  const app = payload.app
  const jti = payload.jti
  const sub = payload.sub

  if (
    typeof sid !== 'string' ||
    typeof app !== 'string' ||
    typeof jti !== 'string' ||
    typeof sub !== 'string' ||
    app !== 'admin'
  ) {
    throw new Error('Invalid refresh token claims')
  }

  return {
    sid,
    app: 'admin',
    jti,
    sub,
  }
}

export async function issueAdminTokenPair(params: {
  session: SessionContext
  accessSecret: string
  refreshSecret: string
  accessTtlSec: number
  refreshTtlSec: number
}): Promise<{
  accessToken: string
  refreshToken: string
  refreshJti: string
}> {
  const accessToken = await signAccessToken({
    claims: {
      sub: params.session.userId,
      sid: params.session.sessionId,
      app: params.session.app,
      roles: params.session.roles,
    },
    secret: params.accessSecret,
    ttlSec: params.accessTtlSec,
  })

  const refresh = await signRefreshToken({
    claims: {
      sub: params.session.userId,
      sid: params.session.sessionId,
      app: params.session.app,
    },
    secret: params.refreshSecret,
    ttlSec: params.refreshTtlSec,
  })

  return {
    accessToken,
    refreshToken: refresh.token,
    refreshJti: refresh.jti,
  }
}
