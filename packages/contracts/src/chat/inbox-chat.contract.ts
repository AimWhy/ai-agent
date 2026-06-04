import { z } from 'zod'

const InboxChatPartSchema = z.object({
  type: z.string().min(1),
}).passthrough()

export const InboxChatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant']),
  parts: z.array(InboxChatPartSchema).min(1).max(50),
})

export const InboxChatRequestSchema = z.object({
  messages: z.array(InboxChatMessageSchema).min(1).max(20),
  mail: z.object({
    subject: z.string().min(1).max(200),
    sender: z.string().min(1).max(120),
    senderEmail: z.string().email(),
    teaser: z.string().min(1).max(2000),
  }),
})

export type InboxChatMessage = z.infer<typeof InboxChatMessageSchema>
export type InboxChatRequest = z.infer<typeof InboxChatRequestSchema>
