import type {
  AgentConversationMessagesResponse,
  AgentConversationResponse,
  CreateMyAgentCompanionRequest,
  CreateMyAgentCompanionResponse,
  MyAgentMemoriesResponse,
  MyAgentCompanionDetailResponse,
  MyAgentInboxResponse,
  UpdateAgentMemoryRequest,
  UpdateAgentMemoryResponse,
  UpdateMyAgentCompanionRequest,
  UpdateMyAgentCompanionResponse,
  UploadMyAgentCompanionImageResponse,
  UserProfileResponse,
  MyAgentSummaryResponse,
  WebGithubAuthUrlResponse,
  WebGithubTicketLoginRequest,
  WebGithubTicketLoginResponse,
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

export function getWebGithubAuthUrl() {
  return http.get<WebGithubAuthUrlResponse>('/auth/web/github/authorize')
}

export function loginWithWebGithubTicket(input: WebGithubTicketLoginRequest) {
  return http.post<WebGithubTicketLoginResponse, WebGithubTicketLoginRequest>('/auth/web/github/ticket/login', input)
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

export function getMyAgentSummary() {
  return http.get<MyAgentSummaryResponse>('/rpc/agent/my/summary')
}

export function getMyAgentInbox() {
  return http.get<MyAgentInboxResponse>('/rpc/agent/my/inbox')
}

export function getAgentConversation(agentId: string) {
  return http.get<AgentConversationResponse>(`/rpc/chat/inbox/${agentId}/conversation`)
}

export function getAgentConversationMessages(agentId: string, cursor: string) {
  return http.get<AgentConversationMessagesResponse>(`/rpc/chat/inbox/${agentId}/messages?cursor=${encodeURIComponent(cursor)}`)
}

export function createMyAgentCompanion(input: CreateMyAgentCompanionRequest) {
  return http.post<CreateMyAgentCompanionResponse, CreateMyAgentCompanionRequest>('/rpc/agent/my/create', input)
}

export function getMyAgentCompanionDetail(agentId: string) {
  return http.get<MyAgentCompanionDetailResponse>(`/rpc/agent/my/${agentId}`)
}

export function getMyAgentMemories(agentId: string) {
  return http.get<MyAgentMemoriesResponse>(`/rpc/agent/my/${agentId}/memories`)
}

export function updateMyAgentMemory(agentId: string, memoryId: string, input: UpdateAgentMemoryRequest) {
  return http.patch<UpdateAgentMemoryResponse, UpdateAgentMemoryRequest>(`/rpc/agent/my/${agentId}/memories/${memoryId}`, input)
}

export function deleteMyAgentMemory(agentId: string, memoryId: string) {
  return http.delete<{ success: true }>(`/rpc/agent/my/${agentId}/memories/${memoryId}`)
}

export function updateMyAgentCompanion(agentId: string, input: UpdateMyAgentCompanionRequest) {
  return http.patch<UpdateMyAgentCompanionResponse, UpdateMyAgentCompanionRequest>(`/rpc/agent/my/${agentId}`, input)
}

export function uploadMyAgentCompanionImage(file: File) {
  const formData = new FormData()
  formData.set('file', file)

  return http.post<UploadMyAgentCompanionImageResponse, FormData>('/rpc/agent/my/image/upload', formData)
}
