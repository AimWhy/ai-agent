import { Hono } from 'hono'
import { UserProfileResponseSchema, buildSuccess } from '@repo/contracts'
import type { ApiBindings } from '@/bindings'
import { createApiMeta } from '@/lib/api-meta'

const userRoute = new Hono<{ Bindings: ApiBindings }>()

userRoute.get('/profile', (c) => {
  const res = UserProfileResponseSchema.parse({
    id: 'user-demo',
    name: 'Demo User',
    role: 'designer',
  })

  return c.json(buildSuccess(res, createApiMeta()))
})

export default userRoute
