import { z } from 'zod'
import type { ApiBindings } from './bindings'

const apiEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']),
  ADMIN_ORIGIN: z.string().url(),
  WEB_ORIGIN: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL_SEC: z.coerce.number().int().positive(),
  REFRESH_TOKEN_TTL_SEC: z.coerce.number().int().positive(),
})

export type ApiEnv = z.infer<typeof apiEnvSchema>

export function getApiEnv(bindings: ApiBindings): ApiEnv {
  return apiEnvSchema.parse({
    APP_ENV: bindings.APP_ENV,
    ADMIN_ORIGIN: bindings.ADMIN_ORIGIN,
    WEB_ORIGIN: bindings.WEB_ORIGIN,
    JWT_ACCESS_SECRET: bindings.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: bindings.JWT_REFRESH_SECRET,
    ACCESS_TOKEN_TTL_SEC: bindings.ACCESS_TOKEN_TTL_SEC,
    REFRESH_TOKEN_TTL_SEC: bindings.REFRESH_TOKEN_TTL_SEC,
  })
}
