"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminAuthSession } from '@repo/contracts'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'

export function AdminSessionCard({ session }: { session: AdminAuthSession }) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function refreshSession() {
    setIsRefreshing(true)
    setMessage(null)

    try {
      // 刷新也走 admin 自己的路由，这样浏览器不会直接持有 refresh token。
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      })

      const payload = (await response.json()) as {
        ok: boolean
        error?: { message: string }
      }

      if (!response.ok || !payload.ok) {
        setMessage(payload.error?.message ?? 'Refresh failed')
        return
      }

      setMessage('Session refreshed')
      router.refresh()
    } catch {
      setMessage('Refresh failed')
    } finally {
      setIsRefreshing(false)
    }
  }

  async function logout() {
    setIsLoggingOut(true)
    setMessage(null)

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } finally {
      router.replace('/login')
      router.refresh()
      setIsLoggingOut(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Admin session</CardTitle>
        <CardDescription>
          This page reads the protected session from server cookies instead of browser storage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[var(--radius-surface)] border border-border bg-background px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">User ID</p>
            <p className="mt-2 break-all text-sm text-foreground">{session.userId}</p>
          </div>
          <div className="rounded-[var(--radius-surface)] border border-border bg-background px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Session ID</p>
            <p className="mt-2 break-all text-sm text-foreground">{session.sessionId}</p>
          </div>
          <div className="rounded-[var(--radius-surface)] border border-border bg-background px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Roles</p>
            <p className="mt-2 text-sm text-foreground">{session.roles.join(', ')}</p>
          </div>
          <div className="rounded-[var(--radius-surface)] border border-border bg-background px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Expires</p>
            <p className="mt-2 text-sm text-foreground">{new Date(session.expiresAtMs).toLocaleString()}</p>
          </div>
        </div>

        {message ? (
          <div className="rounded-[var(--radius-surface)] border border-border bg-muted px-3 py-2 text-sm text-foreground">
            {message}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={refreshSession} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing...' : 'Refresh session'}
          </Button>
          <Button type="button" variant="outline" onClick={logout} disabled={isLoggingOut}>
            {isLoggingOut ? 'Signing out...' : 'Sign out'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
