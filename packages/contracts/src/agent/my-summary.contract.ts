import { z } from 'zod'

export const CreateMyAgentCompanionRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  headline: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(1200),
  storyBackground: z.string().trim().min(1).max(2400),
  personalityPrompt: z.string().trim().min(1).max(1600),
  tonePrompt: z.string().trim().min(1).max(1200),
  guardrailsPrompt: z.string().trim().min(1).max(1200),
  openingMessage: z.string().trim().min(1).max(800),
  imageKey: z.string().trim().min(1).max(300).nullable().optional(),
  visibility: z.enum(['private', 'public']).default('private'),
  status: z.enum(['draft', 'published']).default('draft'),
})

export const CreateMyAgentCompanionResponseSchema = z.object({
  id: z.string().min(1),
  defaultPrompt: z.string().min(1),
})

export const UpdateMyAgentCompanionRequestSchema = CreateMyAgentCompanionRequestSchema

export const UploadMyAgentCompanionImageResponseSchema = z.object({
  key: z.string().min(1),
  updatedAtMs: z.number().int().nonnegative(),
})

export const MyAgentCompanionDetailResponseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  headline: z.string().max(200).nullable(),
  description: z.string().max(1200).nullable(),
  storyBackground: z.string().max(2400).nullable(),
  personalityPrompt: z.string().max(1600).nullable(),
  tonePrompt: z.string().max(1200).nullable(),
  guardrailsPrompt: z.string().max(1200).nullable(),
  openingMessage: z.string().max(800).nullable(),
  defaultPrompt: z.string().nullable(),
  imageKey: z.string().max(300).nullable(),
  visibility: z.enum(['private', 'public']).nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  lastAssistantMessage: z.string().nullable(),
  lastAssistantMessageAtMs: z.number().int().nonnegative().nullable(),
  createdAtMs: z.number().int().nonnegative(),
  updatedAtMs: z.number().int().nonnegative(),
  publishedAtMs: z.number().int().nonnegative().nullable(),
  archivedAtMs: z.number().int().nonnegative().nullable(),
})

export const UpdateMyAgentCompanionResponseSchema = MyAgentCompanionDetailResponseSchema

export const MyAgentInboxItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  handle: z.string().min(1).max(120),
  headline: z.string().min(1).max(200),
  lastActive: z.string().min(1).max(80),
  status: z.string().min(1).max(80),
  agentStatus: z.enum(['draft', 'published', 'archived']),
  relationship: z.string().min(1).max(120),
  topic: z.string().min(1).max(120),
  chemistry: z.string().min(1).max(80),
  chemistryLabel: z.string().min(1).max(80),
  chemistryLevel: z.enum(['High', 'Normal', 'Low']),
  rhythm: z.string().min(1).max(80),
  profileNote: z.string().min(1).max(2000),
  lastAssistantMessage: z.string().nullable(),
  lastAssistantMessageAtMs: z.number().int().nonnegative().nullable(),
  unread: z.boolean(),
  pinned: z.boolean(),
  imageKey: z.string().nullable(),
  updatedAtMs: z.number().int().nonnegative(),
})

export const MyAgentSummaryResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  published: z.number().int().nonnegative(),
  draft: z.number().int().nonnegative(),
})

export const MyAgentInboxResponseSchema = MyAgentSummaryResponseSchema.extend({
  items: z.array(MyAgentInboxItemSchema),
})

export const AgentMemorySchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
  type: z.string().min(1).max(80),
  content: z.string().min(1).max(2000),
  importance: z.number().int().min(1).max(5),
  status: z.enum(['active', 'disabled', 'deleted']),
  sourceMessageId: z.string().nullable(),
  sourceMessage: z.object({
    id: z.string().min(1),
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    createdAtMs: z.number().int().nonnegative(),
  }).nullable(),
  createdAtMs: z.number().int().nonnegative(),
  updatedAtMs: z.number().int().nonnegative(),
})

export const MyAgentMemoriesResponseSchema = z.object({
  items: z.array(AgentMemorySchema),
})

export const UpdateAgentMemoryRequestSchema = z.object({
  type: z.string().trim().min(1).max(80).optional(),
  content: z.string().trim().min(1).max(2000).optional(),
  importance: z.number().int().min(1).max(5).optional(),
  status: z.enum(['active', 'disabled']).optional(),
})

export const UpdateAgentMemoryResponseSchema = AgentMemorySchema

export type MyAgentInboxItem = z.infer<typeof MyAgentInboxItemSchema>
export type MyAgentCompanionDetailResponse = z.infer<typeof MyAgentCompanionDetailResponseSchema>
export type MyAgentSummaryResponse = z.infer<typeof MyAgentSummaryResponseSchema>
export type MyAgentInboxResponse = z.infer<typeof MyAgentInboxResponseSchema>
export type AgentMemory = z.infer<typeof AgentMemorySchema>
export type MyAgentMemoriesResponse = z.infer<typeof MyAgentMemoriesResponseSchema>
export type UpdateAgentMemoryRequest = z.infer<typeof UpdateAgentMemoryRequestSchema>
export type UpdateAgentMemoryResponse = z.infer<typeof UpdateAgentMemoryResponseSchema>
export type CreateMyAgentCompanionRequest = z.infer<typeof CreateMyAgentCompanionRequestSchema>
export type CreateMyAgentCompanionResponse = z.infer<typeof CreateMyAgentCompanionResponseSchema>
export type UpdateMyAgentCompanionRequest = z.infer<typeof UpdateMyAgentCompanionRequestSchema>
export type UpdateMyAgentCompanionResponse = z.infer<typeof UpdateMyAgentCompanionResponseSchema>
export type UploadMyAgentCompanionImageResponse = z.infer<typeof UploadMyAgentCompanionImageResponseSchema>
