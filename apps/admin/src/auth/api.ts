import type {
  AdminLogoutRequest,
  AdminPasswordLoginRequest,
  AdminPasswordLoginResponse,
  AdminTokenRefreshRequest,
  AdminTokenRefreshResponse,
  ApiResponse,
} from '@repo/contracts'
import { getAdminServerEnv } from '../env.server'

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>

  if (!payload.ok) {
    throw new Error(payload.error.message)
  }

  return payload.data
}

// 这些函数只在 admin 的服务端层调用，让浏览器不必直接碰 API 的原始 token 响应。
export async function loginWithAdminPassword(
  input: AdminPasswordLoginRequest,
): Promise<AdminPasswordLoginResponse> {
  const env = getAdminServerEnv()
  const response = await fetch(`${env.API_BASE_URL}/auth/admin/password/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  })

  return parseApiResponse<AdminPasswordLoginResponse>(response)
}

export async function refreshAdminSession(
  input: AdminTokenRefreshRequest,
): Promise<AdminTokenRefreshResponse> {
  const env = getAdminServerEnv()
  const response = await fetch(`${env.API_BASE_URL}/auth/admin/token/refresh`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  })

  return parseApiResponse<AdminTokenRefreshResponse>(response)
}

export async function logoutAdminSession(
  input: AdminLogoutRequest,
): Promise<void> {
  const env = getAdminServerEnv()
  const response = await fetch(`${env.API_BASE_URL}/auth/admin/logout`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  })

  await parseApiResponse<{ success: true }>(response)
}
