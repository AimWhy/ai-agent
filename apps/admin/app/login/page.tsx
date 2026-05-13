import { redirect } from 'next/navigation'
import { AdminLoginForm } from '../../src/components/admin-login-form'
import { readAdminSessionCookies } from '../../src/auth/cookies'

export default async function LoginPage() {
  const session = await readAdminSessionCookies()

  // 已登录用户不需要再留在登录页，直接回到受保护首页。
  if (session) {
    redirect('/')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <AdminLoginForm />
    </main>
  )
}
