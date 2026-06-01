"use client"

import type { UserListItem } from '@repo/contracts'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { UsersList } from './users-list'

type UsersPageProps = {
  users: UserListItem[]
  page: number
  total: number
  totalPages: number
  canPrev: boolean
  canNext: boolean
  onPrevPage: () => void
  onNextPage: () => void
  isLoading: boolean
  isError: boolean
  errorMessage: string
  onRetry: () => void
}

export function UsersPage({ users, page, total, totalPages, canPrev, canNext, onPrevPage, onNextPage, isLoading, isError, errorMessage, onRetry }: UsersPageProps) {
  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>展示当前可访问的用户信息。</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Loaded from the authenticated user list endpoint.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading users...</div>
          ) : isError ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <div>
                <Button type="button" variant="outline" onClick={onRetry}>
                  重试
                </Button>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-sm text-muted-foreground">暂无可展示用户。</div>
          ) : (
            <div className="space-y-4">
              <UsersList users={users} />
              <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="flex-1 text-muted-foreground">
                  共 {total} 条 · 第 {page} / {Math.max(totalPages, 1)} 页
                </p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={onPrevPage} disabled={!canPrev}>
                    上一页
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={onNextPage} disabled={!canNext}>
                    下一页
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
