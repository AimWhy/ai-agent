import type {
  UserProfileResponse,
  WebLogoutRequest,
  WebPasswordLoginRequest,
  WebPasswordLoginResponse,
  WebTokenRefreshRequest,
  WebTokenRefreshResponse,
} from '@repo/contracts'
import { http } from '@/lib/http'

export function loginWithWebPassword(input: WebPasswordLoginRequest) {
  return http.post<WebPasswordLoginResponse, WebPasswordLoginRequest>('/auth/web/password/login', input)
}

export function refreshWebSession(input: WebTokenRefreshRequest) {
  return http.post<WebTokenRefreshResponse, WebTokenRefreshRequest>('/auth/web/token/refresh', input)
}

export function logoutWebSession(input: WebLogoutRequest) {
  return http.post<{ success: true }, WebLogoutRequest>('/auth/web/logout', input)
}

export function getWebUserProfile(accessToken?: string) {
  return http.get<UserProfileResponse>('/rpc/user/profile', accessToken ? {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  } : undefined)
}
