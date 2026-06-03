import type { WebPasswordLoginResponse } from '@repo/contracts'
import { saveClientSession } from '@/auth/client-session'
import { http } from '@/lib/http'

export type WebLoginInput = {
  email: string
  password: string
}

export async function loginByApi(input: WebLoginInput) {
  const response = await http.post<WebPasswordLoginResponse, WebLoginInput>('/auth/web/password/login', input)
  saveClientSession(response)
}
