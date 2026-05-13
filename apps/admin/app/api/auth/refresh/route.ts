import { NextResponse } from 'next/server'
import { BizCode, buildFailure, buildSuccess } from '@repo/contracts'
import { createApiMeta } from '../../../../src/lib/api-meta'
import { refreshAdminSession } from '../../../../src/auth/api'
import { readAdminSessionCookies, saveAdminSessionCookies } from '../../../../src/auth/cookies'

export async function POST() {
  const cookieSession = await readAdminSessionCookies()

  if (!cookieSession) {
    return NextResponse.json(
      buildFailure(
        {
          code: BizCode.AUTH_UNAUTHORIZED,
          message: 'Not signed in',
        },
        createApiMeta(),
      ),
      { status: 401 },
    )
  }

  try {
    const refreshed = await refreshAdminSession({
      refreshToken: cookieSession.refreshToken,
    })

    // 刷新成功后必须覆盖本地 cookie，否则浏览器还会继续带着上一轮的 refresh token。
    await saveAdminSessionCookies({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      session: refreshed.session,
    })

    return NextResponse.json(buildSuccess({ session: refreshed.session }, createApiMeta()))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refresh failed'

    return NextResponse.json(
      buildFailure(
        {
          code: BizCode.AUTH_UNAUTHORIZED,
          message,
        },
        createApiMeta(),
      ),
      { status: 401 },
    )
  }
}
