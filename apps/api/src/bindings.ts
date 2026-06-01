export type ApiBindings = CloudflareBindings & {
  ADMIN_ORIGIN: string
  JWT_ACCESS_SECRET: string
  JWT_REFRESH_SECRET: string
  ACCESS_TOKEN_TTL_SEC: string | number
  REFRESH_TOKEN_TTL_SEC: string | number
}
