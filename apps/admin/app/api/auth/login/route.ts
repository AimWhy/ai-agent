import { NextResponse } from 'next/server'
import { BizCode, type AdminPasswordLoginRequest, buildFailure, buildSuccess } from '@repo/contracts'
import { createApiMeta } from '../../../../src/lib/api-meta'
import { loginWithAdminPassword } from '../../../../src/auth/api'
import { saveAdminSessionCookies } from '../../../../src/auth/cookies'

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AdminPasswordLoginRequest
    const login = await loginWithAdminPassword(payload)

    // 这里由 admin 自己的 BFF 写 HttpOnly cookie，浏览器脚本拿不到 refresh token，跨域部署时也不依赖 API 域名 cookie。
    await saveAdminSessionCookies({
      accessToken: login.accessToken,
      refreshToken: login.refreshToken,
      session: login.session,
    })

    return NextResponse.json(buildSuccess({ session: login.session }, createApiMeta()))
  } catch (error) {
    // BFF 这里把 API 错误统一折叠成登录失败响应，前端表单只关心“是否能显示错误并停留在当前页”。
    const message = error instanceof Error ? error.message : 'Login failed'

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
