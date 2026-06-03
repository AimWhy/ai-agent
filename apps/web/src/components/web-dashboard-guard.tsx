"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { UserProfileResponse, WebAuthSession } from '@repo/contracts'
import { clearClientSession, readClientSession, sessionChangedEventName } from '@/auth/client-session'
import { getWebUserProfile } from '@/auth/api'

type WebDashboardContextValue = {
  profile: UserProfileResponse
  session: WebAuthSession
  refreshProfile: () => Promise<void>
}

const WebDashboardContext = createContext<WebDashboardContextValue | null>(null)

type WebDashboardGuardProps = {
  children: React.ReactNode
}

export function WebDashboardGuard({ children }: WebDashboardGuardProps) {
  const router = useRouter()
  const [context, setContext] = useState<WebDashboardContextValue | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadProfile() {
    const storedSession = readClientSession()

    if (!storedSession) {
      setIsLoading(false)
      router.replace('/login')
      return
    }

    try {
      const nextProfile = await getWebUserProfile()
      const latestSession = readClientSession()

      if (!latestSession) {
        setIsLoading(false)
        router.replace('/login')
        return
      }

      setContext({ profile: nextProfile, session: latestSession.session, refreshProfile: loadProfile })
    } catch {
      clearClientSession()
      router.replace('/login')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    function handleSessionChanged() {
      setIsLoading(true)
      void loadProfile()
    }

    void loadProfile()
    window.addEventListener(sessionChangedEventName, handleSessionChanged)

    return () => {
      window.removeEventListener(sessionChangedEventName, handleSessionChanged)
    }
  }, [router])

  if (isLoading || !context) {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">Loading workspace…</div>
  }

  return <WebDashboardContext.Provider value={context}>{children}</WebDashboardContext.Provider>
}

export function useWebDashboardContext() {
  const context = useContext(WebDashboardContext)

  if (!context) {
    throw new Error('useWebDashboardContext must be used within WebDashboardGuard.')
  }

  return context
}
