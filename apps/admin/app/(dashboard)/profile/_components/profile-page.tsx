"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, KeyRound, Mail, MoreHorizontal } from 'lucide-react'
import type { AdminAuthSession, UserProfileResponse } from '@repo/contracts'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu'
import { ProfileDetails } from './profile-details'
import { ProfileSummary } from './profile-summary'

type ProfilePageProps = {
  profile: UserProfileResponse
  session: AdminAuthSession
}

export function ProfilePage({ profile, session }: ProfilePageProps) {
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!feedback) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback(null)
    }, 2000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [feedback])

  async function copyValue(label: string, value: string) {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setFeedback(`Clipboard is unavailable for ${label.toLowerCase()}.`)
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setFeedback(`${label} copied.`)
    } catch {
      setFeedback(`Unable to copy ${label.toLowerCase()}.`)
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit">
              User profile
            </Badge>
            <div className="space-y-1">
              <CardTitle className="text-2xl md:text-3xl">{profile.name}</CardTitle>
              <CardDescription>
                {feedback ?? 'Review the account identity, access, and current session context for this workspace member.'}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="size-4" />
                Back to dashboard
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open profile actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { void copyValue('User ID', profile.id) }}>
                  <KeyRound className="size-4" />
                  Copy user ID
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { void copyValue('Email', profile.email) }}>
                  <Mail className="size-4" />
                  Copy email
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { void copyValue('Session ID', session.sessionId) }}>
                  <Copy className="size-4" />
                  Copy session ID
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      </Card>

      <ProfileSummary profile={profile} />
      <ProfileDetails profile={profile} session={session} />
    </div>
  )
}
