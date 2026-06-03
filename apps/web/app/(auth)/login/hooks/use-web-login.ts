"use client"

import type { WebPasswordLoginRequest } from '@repo/contracts'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { loginByApi } from '@/auth/login-client'

export const seededWebAccount: WebPasswordLoginRequest = {
  email: 'user01@example.com',
  password: 'Admin123456!',
}

export function useWebLogin() {
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: (input: WebPasswordLoginRequest) => loginByApi(input),
    onSuccess: () => {
      router.replace('/')
    },
  })

  async function submit(input: WebPasswordLoginRequest) {
    mutation.reset()

    try {
      await mutation.mutateAsync(input)
      return true
    } catch {
      return false
    }
  }

  return {
    seededWebAccount,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    isSubmitting: mutation.isPending,
    submit,
  }
}
