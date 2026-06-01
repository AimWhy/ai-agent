import { Hono } from 'hono'
import { UserListQuerySchema, UserListResponseSchema, UserProfileResponseSchema, buildSuccess } from '@repo/contracts'
import { authUnauthorizedError } from '@/auth/errors'
import { verifyAccessToken } from '@/auth/jwt'
import { findUserList, findUserProfileById } from '@/auth/repository'
import type { ApiBindings } from '@/bindings'
import { getDb } from '@/db/client'
import { getApiEnv } from '@/env'
import { createApiMeta } from '@/lib/api-meta'

const userRoute = new Hono<{ Bindings: ApiBindings }>()

userRoute.get('/profile', async (c) => {
  const authorization = c.req.header('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    throw authUnauthorizedError('Access token is required')
  }

  const token = authorization.slice('Bearer '.length).trim()

  if (!token) {
    throw authUnauthorizedError('Access token is required')
  }

  const env = getApiEnv(c.env)
  let claims

  try {
    claims = await verifyAccessToken({
      token,
      secret: env.JWT_ACCESS_SECRET,
    })
  } catch {
    throw authUnauthorizedError('Access token is invalid')
  }
  const profile = await findUserProfileById(getDb(c.env.DB), claims.sub)

  if (!profile) {
    throw authUnauthorizedError('Profile is unavailable')
  }

  const res = UserProfileResponseSchema.parse(profile)

  return c.json(buildSuccess(res, createApiMeta()))
})

userRoute.get('/list', async (c) => {
  const authorization = c.req.header('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    throw authUnauthorizedError('Access token is required')
  }

  const token = authorization.slice('Bearer '.length).trim()

  if (!token) {
    throw authUnauthorizedError('Access token is required')
  }

  const env = getApiEnv(c.env)

  try {
    await verifyAccessToken({
      token,
      secret: env.JWT_ACCESS_SECRET,
    })
  } catch {
    throw authUnauthorizedError('Access token is invalid')
  }

  const query = UserListQuerySchema.parse({
    page: c.req.query('page') ?? 1,
    pageSize: c.req.query('pageSize') ?? 10,
  })

  const offset = (query.page - 1) * query.pageSize
  const { items, total } = await findUserList(getDb(c.env.DB), {
    offset,
    limit: query.pageSize,
  })
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.pageSize)
  const res = UserListResponseSchema.parse({
    items,
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages,
  })

  return c.json(buildSuccess(res, createApiMeta()))
})

export default userRoute
