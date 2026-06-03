import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  WebLogoutRequestSchema,
  WebPasswordLoginRequestSchema,
  WebTokenRefreshRequestSchema,
  buildSuccess,
} from '@repo/contracts'
import type { ApiBindings } from '@/bindings'
import { buildValidationErrorHandler } from '@/auth/http'
import { handleWebLogout } from '@/auth/services/web-logout'
import { handleWebPasswordLogin } from '@/auth/services/web-password-login'
import { handleWebTokenRefresh } from '@/auth/services/web-token-refresh'
import { createApiMeta } from '@/lib/api-meta'

const webAuthRoute = new Hono<{ Bindings: ApiBindings }>()

webAuthRoute.post(
  '/password/login',
  zValidator(
    'json',
    WebPasswordLoginRequestSchema,
    buildValidationErrorHandler('Invalid web login payload'),
  ),
  async (c) => {
    const payload = c.req.valid('json')
    const res = await handleWebPasswordLogin({ c, payload })

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

webAuthRoute.post(
  '/token/refresh',
  zValidator(
    'json',
    WebTokenRefreshRequestSchema,
    buildValidationErrorHandler('Invalid web refresh payload'),
  ),
  async (c) => {
    const payload = c.req.valid('json')
    const res = await handleWebTokenRefresh({ c, payload })

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

webAuthRoute.post(
  '/logout',
  zValidator(
    'json',
    WebLogoutRequestSchema,
    buildValidationErrorHandler('Invalid web logout payload'),
  ),
  async (c) => {
    const payload = c.req.valid('json')
    const res = await handleWebLogout({ c, payload })

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

export default webAuthRoute
