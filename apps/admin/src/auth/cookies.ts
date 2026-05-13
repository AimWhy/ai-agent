import { cookies } from 'next/headers'
import type { AdminAuthSession } from '@repo/contracts'

const ACCESS_TOKEN_COOKIE = 'admin_access_token'
const REFRESH_TOKEN_COOKIE = 'admin_refresh_token'
const SESSION_COOKIE = 'admin_session'

export type AdminCookieSession = {
  accessToken: string
  refreshToken: string
  session: AdminAuthSession
}

function buildCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: false,
    path: '/',
    maxAge,
  }
}

export async function saveAdminSessionCookies(input: AdminCookieSession): Promise<void> {
  const cookieStore = await cookies()

  // admin 和 API 分开部署时，前端自己的 HttpOnly cookie 能把 refresh token 留在服务端边界内。
  cookieStore.set(ACCESS_TOKEN_COOKIE, input.accessToken, buildCookieOptions(60 * 15))
  cookieStore.set(REFRESH_TOKEN_COOKIE, input.refreshToken, buildCookieOptions(60 * 60 * 24 * 30))
  // 单独再存一份 session 摘要，是为了让页面渲染时不用解 token 就能拿到用户和角色信息。
  cookieStore.set(SESSION_COOKIE, JSON.stringify(input.session), buildCookieOptions(60 * 60 * 24 * 30))
}

export async function clearAdminSessionCookies(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)
  cookieStore.delete(SESSION_COOKIE)
}

export async function readAdminSessionCookies(): Promise<AdminCookieSession | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value

  if (!accessToken || !refreshToken || !sessionCookie) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie) as AdminAuthSession

    return {
      accessToken,
      refreshToken,
      session,
    }
  } catch {
    // cookie 结构损坏时直接按未登录处理，避免页面继续消费一份不可信的会话快照。
    return null
  }
}
