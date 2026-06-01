import type { UserListResponse } from '@repo/contracts'
import { http } from '@/lib/http'

type GetUsersForPageInput = {
  page: number
  pageSize: number
}

export async function getUsersForPage({ page, pageSize }: GetUsersForPageInput) {
  const response = await http.get<UserListResponse>(`/rpc/user/list?page=${page}&pageSize=${pageSize}`)

  return response
}
