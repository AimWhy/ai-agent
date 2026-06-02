import { z } from 'zod'

export const CreateUserRequestSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['admin_owner', 'admin_operator']),
})

export const CreateUserResponseSchema = z.object({
  id: z.string(),
  avatarKey: z.string().nullable(),
})

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>
