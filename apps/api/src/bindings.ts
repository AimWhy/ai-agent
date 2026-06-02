export type ApiBindings = CloudflareBindings & {
  DB: D1Database
  AVATAR_BUCKET: R2Bucket
  ADMIN_ORIGIN: string
  JWT_ACCESS_SECRET: string
  JWT_REFRESH_SECRET: string
  ACCESS_TOKEN_TTL_SEC: string | number
  REFRESH_TOKEN_TTL_SEC: string | number
}
