import { NextResponse } from 'next/server'
import { buildSuccess } from '@repo/contracts'
import { createApiMeta } from '../../../../src/lib/api-meta'
import { logoutAdminSession } from '../../../../src/auth/api'
import { clearAdminSessionCookies, readAdminSessionCookies } from '../../../../src/auth/cookies'

export async function POST() {
  const cookieSession = await readAdminSessionCookies()

  if (cookieSession) {
    try {
      await logoutAdminSession({
        refreshToken: cookieSession.refreshToken,
      })
    } catch {
      // 退出时优先清理本地 cookie，让浏览器端状态尽快失效；远端撤销失败不阻塞本地登出。
    }
  }

  // logout 的本地收口点就在这里：不管远端有没有成功回包，本地 cookie 都会被清空。
  await clearAdminSessionCookies()

  return NextResponse.json(buildSuccess({ success: true }, createApiMeta()))
}
