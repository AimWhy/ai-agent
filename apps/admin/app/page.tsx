import { redirect } from 'next/navigation'
import { Button } from '@repo/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/card'
import { AdminEnvBadge } from '../src/admin-env-badge'
import { readAdminSessionCookies } from '../src/auth/cookies'
import { AdminSessionCard } from '../src/components/admin-session-card'
import { getAdminServerEnv } from '../src/env.server'

export default async function Home() {
  const env = getAdminServerEnv()
  const cookieSession = await readAdminSessionCookies()

  // 首页本身就是受保护页面，没有 cookie 就直接送回登录页。
  if (!cookieSession) {
    redirect('/login')
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12 md:px-10 lg:px-12">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <span className="inline-flex items-center rounded-[var(--radius-control)] border border-border bg-muted px-3.5 py-1 text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
            admin console
          </span>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Admin password login is now wired end to end.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
              The protected shell reads session state from server-side cookies and uses the API refresh flow through the admin app proxy.
            </p>
          </div>
        </div>
        <AdminEnvBadge />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <AdminSessionCard session={cookieSession.session} />

        <Card>
          <CardHeader>
            <CardTitle>Runtime overview</CardTitle>
            <CardDescription>
              These values come from the server environment and help verify the current deployment target.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[var(--radius-surface)] border border-border bg-background px-4 py-3 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                APP_ENV
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">{env.APP_ENV}</p>
            </div>
            <div className="rounded-[var(--radius-surface)] border border-border bg-background px-4 py-3 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                API_BASE_URL
              </p>
              <p className="mt-2 break-all text-sm font-medium text-foreground">{env.API_BASE_URL}</p>
            </div>
            <div className="rounded-[var(--radius-surface)] border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">
              <p>
                Local seeded credentials:
              </p>
              <p className="mt-2 font-medium text-foreground">admin@example.com / Admin123456!</p>
            </div>
            <Button asChild variant="outline">
              <a href="/login">Open login page</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
