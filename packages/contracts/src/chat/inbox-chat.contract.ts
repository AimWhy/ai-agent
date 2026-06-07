import { z } from 'zod'

const InboxChatPartSchema = z.object({
  type: z.string().min(1),
}).passthrough()

export const InboxChatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant']),
  parts: z.array(InboxChatPartSchema).min(1).max(50),
})

export const InboxChatLlmWireApiSchema = z.enum(['chat_completions', 'responses'])

export const InboxChatLlmReasoningEffortSchema = z.enum(['minimal', 'low', 'medium', 'high'])

export const InboxChatLlmConfigSchema = z.object({
  providerName: z.string().trim().min(1).max(80).optional(),
  baseURL: z.string().trim().url().max(300),
  apiKey: z.string().trim().min(1).max(400),
  model: z.string().trim().min(1).max(120),
  wireApi: InboxChatLlmWireApiSchema.optional(),
  reasoningEffort: InboxChatLlmReasoningEffortSchema.optional(),
})

export const InboxChatRequestSchema = z.object({
  messages: z.array(InboxChatMessageSchema).min(1).max(20),
  llmConfig: InboxChatLlmConfigSchema.optional(),
  conversation: z.object({
    name: z.string().min(1).max(120),
    handle: z.string().min(1).max(120),
    headline: z.string().min(1).max(200),
    lastActive: z.string().min(1).max(80),
    status: z.string().min(1).max(80),
    relationship: z.string().min(1).max(120),
    topic: z.string().min(1).max(120),
    chemistry: z.string().min(1).max(80),
    chemistryLabel: z.string().min(1).max(80),
    rhythm: z.string().min(1).max(80),
    profileNote: z.string().min(1).max(2000),
  }),
})

export type InboxChatMessage = z.infer<typeof InboxChatMessageSchema>
export type InboxChatLlmWireApi = z.infer<typeof InboxChatLlmWireApiSchema>
export type InboxChatLlmReasoningEffort = z.infer<typeof InboxChatLlmReasoningEffortSchema>
export type InboxChatLlmConfig = z.infer<typeof InboxChatLlmConfigSchema>
export type InboxChatRequest = z.infer<typeof InboxChatRequestSchema>
