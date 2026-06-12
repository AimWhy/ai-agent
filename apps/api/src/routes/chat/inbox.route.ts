import { zValidator } from '@hono/zod-validator'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { Hono, type Context } from 'hono'
import { z } from 'zod'
import {
  AgentConversationMessagesResponseSchema,
  AgentConversationResponseSchema,
  BizCode,
  InboxChatRequestSchema,
  buildSuccess,
} from '@repo/contracts'
import { authUnauthorizedError } from '@/auth/errors'
import { buildValidationErrorHandler } from '@/auth/http'
import { verifyAccessToken } from '@/auth/jwt'
import {
  findUserAgentCompanionOwner,
  findUserAgentCompanionPrompt,
  getOrCreateDefaultAgentConversation,
  insertAgentConversationMessage,
  insertAgentMemory,
  listActiveAgentMemories,
  listAgentConversationMessages,
  updateAgentConversationAfterMessage,
  updateUserAgentCompanionLatestAssistantMessage,
} from '@/auth/repository'
import type { ApiBindings } from '@/bindings'
import { getDb } from '@/db/client'
import { getApiEnv } from '@/env'
import { createApiMeta } from '@/lib/api-meta'
import { AppError } from '@/lib/app-error'

const inboxChatRoute = new Hono<{ Bindings: ApiBindings }>()

type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type ChatProviderConfig = {
  apiKey: string
  baseURL: string
  model: string
  wireApi: 'chat_completions' | 'responses'
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'
}

const emptyUpstreamMessage = '上游模型返回成功，但没有提供可展示的文本内容。请检查 LLM 协议、模型名与中转接口是否匹配。'
const htmlUpstreamMessage = '上游返回的是网页内容，而不是模型响应。请检查 Base URL 与 Wire API 是否匹配，当前中转通常需要选择 Responses 协议。'
const recentMessageLimit = 18
const initialHistoryLimit = 40
const memoryInjectionLimit = 12
const memoryExtractionLimit = 2

const ConversationSafetySchema = z.object({
  safetyLevel: z.enum(['safe', 'caution', 'redirect', 'block', 'crisis']),
  category: z.enum([
    'normal',
    'emotional_dependency',
    'manipulation',
    'self_harm',
    'sexual_boundary',
    'privacy',
    'illegal',
    'medical_legal_financial',
    'other',
  ]),
  boundaryAction: z.enum(['continue', 'soft_boundary', 'redirect', 'refuse', 'crisis_support']),
  reason: z.string().trim().max(300),
  responseGuidance: z.string().trim().max(600),
  allowMemoryExtraction: z.boolean(),
})

type ConversationSafety = z.infer<typeof ConversationSafetySchema>

const fallbackSafety: ConversationSafety = {
  safetyLevel: 'caution',
  category: 'other',
  boundaryAction: 'soft_boundary',
  reason: '安全边界判断暂时不可用，采用保守回复策略。',
  responseGuidance: '用温和、克制、尊重边界的方式回复；不要提供操控、伤害、违法或高风险专业建议。',
  allowMemoryExtraction: false,
}

const AgentMemoryExtractionSchema = z.object({
  memories: z.array(z.object({
    type: z.enum(['偏好', '边界', '关系目标', '对话风格', '重要事实']),
    content: z.string().trim().min(1).max(500),
    importance: z.number().int().min(1).max(5),
  })).max(memoryExtractionLimit),
})

type ExtractedAgentMemory = z.infer<typeof AgentMemoryExtractionSchema>['memories'][number]

const agentMemoryExtractionPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    [
      '你是 AI 伴侣聊天产品的长期记忆抽取器。',
      '你的任务是从本轮用户消息和 Agent 回复中提取对未来对话稳定有用的长期记忆。',
      '只记录用户明确表达或强烈暗示的稳定信息，例如偏好、边界、关系目标、对话风格、重要事实。',
      '不要记录临时寒暄、一次性问题、Agent 自己编造的信息、重复的已有记忆、没有把握的推断。',
      `最多返回 ${memoryExtractionLimit} 条记忆；如果没有值得长期保存的信息，返回空数组。`,
      'content 使用第一人称或面向用户的简洁中文事实句，不要超过 80 个汉字。',
      'importance 使用 1 到 5，边界、禁忌、长期偏好、重要事件通常更高。',
      '输出必须是可被 LangChain 结构化解析的 JSON 对象。',
    ].join('\n'),
  ],
  [
    'human',
    [
      'Agent 名称：{agentName}',
      '',
      '已有长期记忆：',
      '{existingMemories}',
      '',
      '此前会话摘要：',
      '{conversationSummary}',
      '',
      '本轮用户消息：',
      '{userText}',
      '',
      '本轮 Agent 回复：',
      '{assistantText}',
    ].join('\n'),
  ],
])

const conversationSafetyPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    [
      '你是 AI 电子伴侣聊天产品的安全边界判断器。',
      '你的任务是判断本轮用户输入是否需要安全边界处理，而不是替用户聊天。',
      '必须优先识别自伤危机、违法暴力、隐私侵犯、操控关系、性边界、高风险医疗法律财务建议、强情绪依赖。',
      '不要因为产品是陪伴/恋爱/交友场景就放松边界；也不要过度拦截普通倾诉、轻度暧昧和正常情绪表达。',
      '如果不确定，使用 caution + soft_boundary，而不是 safe。',
      '输出必须是可被 LangChain 结构化解析的 JSON 对象。',
    ].join('\n'),
  ],
  [
    'human',
    [
      'Agent 名称：{agentName}',
      '',
      'Agent 自定义边界规则：',
      '{agentGuardrails}',
      '',
      '长期记忆：',
      '{activeMemories}',
      '',
      '最近对话：',
      '{recentMessages}',
      '',
      '本轮用户输入：',
      '{userText}',
    ].join('\n'),
  ],
])

async function requireWebAccessToken(c: Context<{ Bindings: ApiBindings }>) {
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
    return await verifyAccessToken({
      token,
      secret: env.JWT_ACCESS_SECRET,
      expectedApp: 'web',
    })
  } catch {
    throw authUnauthorizedError('Access token is invalid')
  }
}

function resolveChatProviderConfig(params: {
  payload: {
    llmConfig?: {
      apiKey: string
      baseURL: string
      model: string
      wireApi?: 'chat_completions' | 'responses'
      reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'
    }
  }
  env: ReturnType<typeof getApiEnv>
}): ChatProviderConfig {
  const localConfig = params.payload.llmConfig

  if (localConfig) {
    return {
      apiKey: localConfig.apiKey,
      baseURL: localConfig.baseURL,
      model: localConfig.model,
      wireApi: localConfig.wireApi === 'responses' ? 'responses' : 'chat_completions',
      reasoningEffort: localConfig.reasoningEffort,
    }
  }

  if (!params.env.DEEPSEEK_API_KEY) {
    throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, 'LLM API key is not configured', 500)
  }

  return {
    apiKey: params.env.DEEPSEEK_API_KEY,
    baseURL: params.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1',
    model: params.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
    wireApi: 'chat_completions',
  }
}

function joinProviderUrl(baseURL: string, path: string) {
  return `${baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

function buildChatCompletionsRequestBody(providerConfig: ChatProviderConfig, messages: ChatCompletionMessage[]) {
  return {
    model: providerConfig.model,
    messages,
    stream: true,
  }
}

function buildResponsesRequestBody(providerConfig: ChatProviderConfig, messages: ChatCompletionMessage[]) {
  const instructions = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n')
  const input = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))

  return {
    model: providerConfig.model,
    ...(instructions ? { instructions } : {}),
    input,
    stream: true,
    store: false,
    ...(providerConfig.reasoningEffort ? { reasoning: { effort: providerConfig.reasoningEffort } } : {}),
  }
}

function getUpstreamChatRequest(providerConfig: ChatProviderConfig, messages: ChatCompletionMessage[]) {
  if (providerConfig.wireApi === 'responses') {
    return {
      url: joinProviderUrl(providerConfig.baseURL, '/responses'),
      body: buildResponsesRequestBody(providerConfig, messages),
    }
  }

  return {
    url: joinProviderUrl(providerConfig.baseURL, '/chat/completions'),
    body: buildChatCompletionsRequestBody(providerConfig, messages),
  }
}

function looksLikeHtmlPayload(text: string) {
  const trimmed = text.trim().toLowerCase()

  return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html') || trimmed.includes('<title>')
}

async function fetchUpstreamChat(params: {
  providerConfig: ChatProviderConfig
  messages: ChatCompletionMessage[]
  signal: AbortSignal
}) {
  const request = getUpstreamChatRequest(params.providerConfig, params.messages)
  const upstream = await fetch(request.url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${params.providerConfig.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(request.body),
    signal: params.signal,
  })

  const contentType = upstream.headers.get('content-type') ?? ''
  const shouldRetryWithResponses =
    params.providerConfig.wireApi === 'chat_completions' &&
    (upstream.status === 404 || (upstream.ok && contentType.includes('text/html')))

  if (!shouldRetryWithResponses) {
    return {
      upstream,
      wireApi: params.providerConfig.wireApi,
      retriedFromWireApi: null,
    }
  }

  await upstream.body?.cancel()

  const fallbackProviderConfig: ChatProviderConfig = {
    ...params.providerConfig,
    wireApi: 'responses',
  }
  const fallbackRequest = getUpstreamChatRequest(fallbackProviderConfig, params.messages)
  const fallbackUpstream = await fetch(fallbackRequest.url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${fallbackProviderConfig.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(fallbackRequest.body),
    signal: params.signal,
  })

  return {
    upstream: fallbackUpstream,
    wireApi: fallbackProviderConfig.wireApi,
    retriedFromWireApi: params.providerConfig.wireApi,
  }
}

function extractText(message: { parts: Array<{ type: string; text?: unknown }> }) {
  return message.parts
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n')
    .trim()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function collectTextValue(value: unknown, pieces: string[]) {
  if (typeof value === 'string') {
    pieces.push(value)
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectTextValue(item, pieces)
    }
    return
  }

  if (!isRecord(value)) {
    return
  }

  collectTextValue(value.text, pieces)
  collectTextValue(value.value, pieces)
  collectTextValue(value.content, pieces)
}

function extractTextFromJsonPayload(payload: unknown, options: { stream: boolean; allowCompletedPayload?: boolean }) {
  const pieces: string[] = []

  if (!isRecord(payload)) {
    return ''
  }

  const type = payload.type

  if (
    options.stream &&
    typeof type === 'string' &&
    (type.endsWith('.done') || type.endsWith('.completed') || type === 'response.completed')
  ) {
    if (options.allowCompletedPayload) {
      const completedPayload = isRecord(payload.response) ? payload.response : payload

      return extractTextFromJsonPayload(completedPayload, { stream: false })
    }

    return ''
  }

  if (!options.stream) {
    const primaryTextPieces: string[] = []

    collectTextValue(payload.output_text, primaryTextPieces)

    if (isRecord(payload.response)) {
      collectTextValue(payload.response.output_text, primaryTextPieces)
    }

    if (primaryTextPieces.length > 0) {
      return primaryTextPieces.join('')
    }
  }

  const choices = payload.choices

  if (Array.isArray(choices)) {
    for (const choice of choices) {
      if (!isRecord(choice)) {
        continue
      }

      if (isRecord(choice.delta)) {
        collectTextValue(choice.delta.content, pieces)
        collectTextValue(choice.delta.text, pieces)
        collectTextValue(choice.delta.output_text, pieces)
      }

      if (isRecord(choice.message)) {
        collectTextValue(choice.message.content, pieces)
      }

      collectTextValue(choice.text, pieces)
    }
  }

  if (isRecord(payload.delta)) {
    collectTextValue(payload.delta.text, pieces)
    collectTextValue(payload.delta.content, pieces)
  } else {
    collectTextValue(payload.delta, pieces)
  }

  collectTextValue(payload.output_text, pieces)
  collectTextValue(payload.text, pieces)
  collectTextValue(payload.content, pieces)

  if (isRecord(payload.message)) {
    collectTextValue(payload.message.content, pieces)
  }

  if (isRecord(payload.response)) {
    collectTextValue(payload.response.output_text, pieces)
    collectTextValue(payload.response.text, pieces)
    collectTextValue(payload.response.content, pieces)

    if (Array.isArray(payload.response.output)) {
      for (const outputItem of payload.response.output) {
        if (isRecord(outputItem)) {
          collectTextValue(outputItem.content, pieces)
        }
      }
    }
  }

  if (isRecord(payload.item)) {
    collectTextValue(payload.item.content, pieces)
  }

  if (isRecord(payload.output_item)) {
    collectTextValue(payload.output_item.content, pieces)
  }

  if (Array.isArray(payload.output)) {
    for (const outputItem of payload.output) {
      if (isRecord(outputItem)) {
        collectTextValue(outputItem.content, pieces)
      }
    }
  }

  return pieces.join('')
}

function extractTextFromRawPayload(rawPayload: string) {
  const text = rawPayload.trim()

  if (!text) {
    return ''
  }

  if (text.startsWith('data:') || text.includes('\ndata:')) {
    let hasContent = false

    return text
      .split('\n')
      .map((line) => {
        const result = extractTextFromStreamLine(line, { allowCompletedPayload: !hasContent })

        if (result.text) {
          hasContent = true
        }

        return result.text
      })
      .join('')
  }

  try {
    return extractTextFromJsonPayload(JSON.parse(text), { stream: false })
  } catch {
    return text.startsWith('{') || text.startsWith('[') ? '' : text
  }
}

function extractTextFromStreamLine(
  line: string,
  options: { allowCompletedPayload?: boolean } = {},
): { done: boolean; text: string } {
  const trimmed = line.trim()

  if (!trimmed || trimmed.startsWith(':') || trimmed.startsWith('event:')) {
    return { done: false, text: '' }
  }

  const data = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed

  if (!data) {
    return { done: false, text: '' }
  }

  if (data === '[DONE]') {
    return { done: true, text: '' }
  }

  try {
    return {
      done: false,
      text: extractTextFromJsonPayload(JSON.parse(data), {
        stream: true,
        allowCompletedPayload: options.allowCompletedPayload,
      }),
    }
  } catch {
    return {
      done: false,
      text: trimmed.startsWith('data:') ? '' : data,
    }
  }
}

function buildTextStreamResponse(textStream: ReadableStream<Uint8Array>) {
  return new Response(textStream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-cache',
      'x-accel-buffering': 'no',
    },
  })
}

function normalizeLatestAssistantMessage(text: string) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 2000)
}

function normalizeStoredMessage(text: string) {
  return text.replace(/\s+\n/g, '\n').trim().slice(0, 8000)
}

function toConversationMessageResponse(message: {
  id: string
  conversationId: string
  agentId: string
  role: 'user' | 'assistant'
  content: string
  status: 'completed' | 'failed'
  createdAtMs: number
}) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    agentId: message.agentId,
    role: message.role,
    content: message.content,
    status: message.status,
    createdAtMs: message.createdAtMs,
  }
}

function getOldestMessageCursor(messages: Array<{ createdAtMs: number }>, requestedLimit: number) {
  if (messages.length < requestedLimit || messages.length === 0) {
    return null
  }

  return String(messages[0]!.createdAtMs)
}

function buildConversationSummary(params: {
  previousSummary: string | null
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  userText: string
  assistantText: string
}) {
  const sourceLines = [
    params.previousSummary ? `既有摘要：${params.previousSummary}` : '',
    ...params.recentMessages.slice(-8).map((message) => `${message.role === 'user' ? '用户' : 'Agent'}：${message.content}`),
    `用户：${params.userText}`,
    `Agent：${params.assistantText}`,
  ].filter(Boolean)

  return sourceLines
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(-1600)
}

type StoredAgentMemory = {
  type: string
  content: string
  importance: number
}

function formatExistingMemories(memories: StoredAgentMemory[]) {
  if (memories.length === 0) {
    return '暂无'
  }

  return memories
    .slice(0, 50)
    .map((memory, index) => `${index + 1}. [${memory.type} / 重要度 ${memory.importance}] ${memory.content}`)
    .join('\n')
}

function formatRecentMessages(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
  if (messages.length === 0) {
    return '暂无'
  }

  return messages
    .slice(-8)
    .map((message) => `${message.role === 'user' ? '用户' : 'Agent'}：${normalizeStoredMessage(message.content).slice(0, 1000)}`)
    .join('\n')
}

function normalizeMemoryContent(content: string) {
  return content.replace(/\s+/g, ' ').trim().slice(0, 500)
}

function normalizeMemoryImportance(importance: number) {
  if (!Number.isFinite(importance)) {
    return 3
  }

  return Math.min(5, Math.max(1, Math.round(importance)))
}

function buildLangChainChatModel(providerConfig: ChatProviderConfig) {
  return new ChatOpenAI({
    model: providerConfig.model,
    apiKey: providerConfig.apiKey,
    temperature: 0,
    useResponsesApi: providerConfig.wireApi === 'responses',
    configuration: {
      baseURL: providerConfig.baseURL.replace(/\/$/, ''),
    },
    ...(providerConfig.reasoningEffort ? { reasoning: { effort: providerConfig.reasoningEffort } } : {}),
    ...(providerConfig.wireApi === 'responses' ? { zdrEnabled: true } : {}),
  })
}

function getStructuredOutputMethods(providerConfig: ChatProviderConfig) {
  return providerConfig.wireApi === 'responses'
    ? ['jsonSchema', 'functionCalling', 'jsonMode'] as const
    : ['functionCalling', 'jsonSchema', 'jsonMode'] as const
}

type LangChainStructuredOutputMethod = ReturnType<typeof getStructuredOutputMethods>[number]

async function invokeLangChainMemoryExtraction(params: {
  method: LangChainStructuredOutputMethod
  providerConfig: ChatProviderConfig
  agentName: string
  existingMemories: StoredAgentMemory[]
  conversationSummary: string | null
  userText: string
  assistantText: string
  signal?: AbortSignal
}) {
  const model = buildLangChainChatModel(params.providerConfig)
  const structuredModel = model.withStructuredOutput(AgentMemoryExtractionSchema, {
    name: 'agent_memory_extraction',
    method: params.method,
  })
  const chain = agentMemoryExtractionPrompt.pipe(structuredModel)

  const result = await chain.invoke({
    agentName: params.agentName || '未命名 Agent',
    existingMemories: formatExistingMemories(params.existingMemories),
    conversationSummary: params.conversationSummary || '暂无',
    userText: params.userText,
    assistantText: params.assistantText.slice(0, 4000),
  }, params.signal ? { signal: params.signal } : undefined)

  return AgentMemoryExtractionSchema.parse(result).memories
}

async function extractAgentMemoriesWithLangChain(params: {
  providerConfig: ChatProviderConfig
  agentName: string
  existingMemories: StoredAgentMemory[]
  conversationSummary: string | null
  userText: string
  assistantText: string
  signal?: AbortSignal
}): Promise<ExtractedAgentMemory[]> {
  const userText = normalizeStoredMessage(params.userText)
  const assistantText = normalizeStoredMessage(params.assistantText)

  if (!userText || !assistantText) {
    return []
  }

  const methods = getStructuredOutputMethods(params.providerConfig)
  let lastError: unknown = null

  for (const method of methods) {
    try {
      return await invokeLangChainMemoryExtraction({
        ...params,
        method,
        userText,
        assistantText,
      })
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}

async function invokeConversationSafetyAnalysis(params: {
  method: LangChainStructuredOutputMethod
  providerConfig: ChatProviderConfig
  agentName: string
  agentGuardrails: string | null
  activeMemories: StoredAgentMemory[]
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  userText: string
  signal: AbortSignal
}) {
  const model = buildLangChainChatModel(params.providerConfig)
  const structuredModel = model.withStructuredOutput(ConversationSafetySchema, {
    name: 'conversation_safety_analysis',
    method: params.method,
  })
  const chain = conversationSafetyPrompt.pipe(structuredModel)
  const result = await chain.invoke({
    agentName: params.agentName || '未命名 Agent',
    agentGuardrails: params.agentGuardrails || '暂无',
    activeMemories: formatExistingMemories(params.activeMemories),
    recentMessages: formatRecentMessages(params.recentMessages),
    userText: params.userText,
  }, { signal: params.signal })

  return normalizeConversationSafety(ConversationSafetySchema.parse(result))
}

function normalizeConversationSafety(safety: ConversationSafety): ConversationSafety {
  const next = { ...safety }

  if (next.safetyLevel === 'crisis') {
    next.boundaryAction = 'crisis_support'
    next.allowMemoryExtraction = false
  }

  if (next.safetyLevel === 'block' && next.boundaryAction !== 'crisis_support') {
    next.boundaryAction = 'refuse'
    next.allowMemoryExtraction = false
  }

  if (next.boundaryAction === 'refuse' || next.boundaryAction === 'crisis_support') {
    next.allowMemoryExtraction = false
  }

  if (next.boundaryAction === 'continue' && next.safetyLevel !== 'safe') {
    next.boundaryAction = 'soft_boundary'
  }

  if (!next.responseGuidance) {
    next.responseGuidance = '用温和、克制、尊重边界的方式回复。'
  }

  return next
}

async function analyzeConversationSafety(params: {
  providerConfig: ChatProviderConfig
  agentName: string
  agentGuardrails: string | null
  activeMemories: StoredAgentMemory[]
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  userText: string
  signal: AbortSignal
}): Promise<ConversationSafety> {
  const userText = normalizeStoredMessage(params.userText)

  if (!userText) {
    return normalizeConversationSafety({
      safetyLevel: 'safe',
      category: 'normal',
      boundaryAction: 'continue',
      reason: '没有可分析的用户输入。',
      responseGuidance: '正常回复。',
      allowMemoryExtraction: true,
    })
  }

  let lastError: unknown = null

  for (const method of getStructuredOutputMethods(params.providerConfig)) {
    try {
      return await invokeConversationSafetyAnalysis({
        ...params,
        method,
        userText,
      })
    } catch (error) {
      lastError = error
    }
  }

  console.warn('LangChain conversation safety analysis failed', lastError)
  return normalizeConversationSafety(fallbackSafety)
}

function toSafetyMetadata(safety: ConversationSafety) {
  return JSON.stringify({
    analysisVersion: 'conversation-safety-v1',
    safety,
  })
}

function getSafetySystemInstruction(safety: ConversationSafety) {
  if (safety.boundaryAction === 'continue') {
    return ''
  }

  return [
    '本轮安全边界判断：',
    `- 等级：${safety.safetyLevel}`,
    `- 分类：${safety.category}`,
    `- 动作：${safety.boundaryAction}`,
    `- 回复策略：${safety.responseGuidance}`,
    '请严格遵守该策略，优先保护用户与他人的现实安全、隐私和关系边界。',
  ].join('\n')
}

function buildBoundaryResponse(safety: ConversationSafety) {
  if (safety.boundaryAction === 'crisis_support') {
    return [
      '我听到你现在可能很难受。先别一个人硬扛，尽量把手边可能伤害自己的东西移远一点，去到更安全、有人能看见你的地方。',
      '如果你有立即伤害自己的可能，请现在联系当地紧急电话或身边可信的人，让他们陪你。你也可以告诉我：你现在是否安全、身边有没有人可以马上联系。',
    ].join('\n\n')
  }

  if (safety.boundaryAction === 'refuse') {
    return [
      '这个请求我不能直接帮你完成，因为它可能会伤害他人、侵犯隐私，或越过必要的安全边界。',
      safety.responseGuidance || '我可以换一种更安全、尊重边界的方式，帮你梳理真实需求和可行表达。',
    ].join('\n\n')
  }

  return ''
}

async function persistAgentMemoriesFromTurn(params: {
  db: ReturnType<typeof getDb>
  userId: string
  agentId: string
  agentName: string
  providerConfig: ChatProviderConfig
  previousSummary: string | null
  userText: string
  assistantText: string
  sourceMessageId: string
  signal?: AbortSignal
}) {
  const existingMemories = await listActiveAgentMemories({
    db: params.db,
    userId: params.userId,
    agentId: params.agentId,
    limit: 50,
  })
  const candidateMemories = await extractAgentMemoriesWithLangChain({
    providerConfig: params.providerConfig,
    agentName: params.agentName,
    existingMemories,
    conversationSummary: params.previousSummary,
    userText: params.userText,
    assistantText: params.assistantText,
    signal: params.signal,
  })
  const existingMemoryContents = new Set(
    existingMemories.map((memory) => normalizeMemoryContent(memory.content)),
  )

  for (const memory of candidateMemories.slice(0, memoryExtractionLimit)) {
    const content = normalizeMemoryContent(memory.content)

    if (!content || existingMemoryContents.has(content)) {
      continue
    }

    await insertAgentMemory({
      db: params.db,
      id: crypto.randomUUID(),
      userId: params.userId,
      agentId: params.agentId,
      type: memory.type,
      content,
      importance: normalizeMemoryImportance(memory.importance),
      sourceMessageId: params.sourceMessageId,
      nowMs: Date.now(),
    })
    existingMemoryContents.add(content)
  }
}

function scheduleAgentMemoryExtraction(params: Parameters<typeof persistAgentMemoriesFromTurn>[0] & {
  c: Context<{ Bindings: ApiBindings }>
}) {
  const task = persistAgentMemoriesFromTurn(params).catch((error) => {
    console.warn('LangChain agent memory extraction failed', error)
  })

  try {
    params.c.executionCtx.waitUntil(task)
  } catch {
    return task
  }

  return Promise.resolve()
}

async function requireOwnedAgentConversation(params: {
  c: Context<{ Bindings: ApiBindings }>
  userId: string
  agentId: string
}) {
  const db = getDb(params.c.env.DB)
  const agent = await findUserAgentCompanionOwner(db, {
    userId: params.userId,
    agentId: params.agentId,
  })

  if (!agent) {
    throw authUnauthorizedError('Agent is not available')
  }

  const conversation = await getOrCreateDefaultAgentConversation({
    db,
    id: crypto.randomUUID(),
    userId: params.userId,
    agentId: params.agentId,
    title: agent.name,
    nowMs: Date.now(),
  })

  return {
    agent,
    conversation,
  }
}

async function saveLatestAssistantMessage(params: {
  c: Context<{ Bindings: ApiBindings }>
  userId: string
  agentId: string | undefined
  text: string
}) {
  const message = normalizeLatestAssistantMessage(params.text)

  if (!params.agentId || !message) {
    return
  }

  await updateUserAgentCompanionLatestAssistantMessage({
    db: getDb(params.c.env.DB),
    userId: params.userId,
    agentId: params.agentId,
    message,
    nowMs: Date.now(),
  })
}

async function saveAssistantTurn(params: {
  c: Context<{ Bindings: ApiBindings }>
  userId: string
  agentId: string | undefined
  agentName: string
  conversationId: string | undefined
  sourceUserMessageId: string | null
  userText: string
  assistantText: string
  providerConfig: ChatProviderConfig
  allowMemoryExtraction: boolean
  previousSummary: string | null
  previousMessageCount: number
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
}) {
  const message = normalizeStoredMessage(params.assistantText)

  if (!params.agentId || !params.conversationId || !message) {
    await saveLatestAssistantMessage({
      c: params.c,
      userId: params.userId,
      agentId: params.agentId,
      text: params.assistantText,
    })
    return
  }

  const db = getDb(params.c.env.DB)
  const nowMs = Date.now()
  const assistantMessageId = crypto.randomUUID()
  await insertAgentConversationMessage({
    db,
    id: assistantMessageId,
    conversationId: params.conversationId,
    userId: params.userId,
    agentId: params.agentId,
    role: 'assistant',
    content: message,
    status: 'completed',
    nowMs,
  })
  const nextSummary = buildConversationSummary({
    previousSummary: params.previousSummary,
    recentMessages: params.recentMessages,
    userText: params.userText,
    assistantText: message,
  })
  await updateAgentConversationAfterMessage({
    db,
    userId: params.userId,
    agentId: params.agentId,
    conversationId: params.conversationId,
    summary: nextSummary,
    messageCount: params.previousMessageCount + (params.sourceUserMessageId ? 2 : 1),
    lastMessageAtMs: nowMs,
    nowMs,
  })
  await saveLatestAssistantMessage({
    c: params.c,
    userId: params.userId,
    agentId: params.agentId,
    text: message,
  })

  if (!params.allowMemoryExtraction) {
    return
  }

  await scheduleAgentMemoryExtraction({
    c: params.c,
    db,
    userId: params.userId,
    agentId: params.agentId,
    agentName: params.agentName,
    providerConfig: params.providerConfig,
    previousSummary: params.previousSummary,
    userText: params.userText,
    assistantText: message,
    sourceMessageId: params.sourceUserMessageId ?? assistantMessageId,
  })
}

inboxChatRoute.get('/:agentId/conversation', async (c) => {
  const claims = await requireWebAccessToken(c)
  const agentId = c.req.param('agentId')?.trim()

  if (!agentId) {
    throw new AppError(BizCode.COMMON_INVALID_REQUEST, 'Agent id is required', 400)
  }

  const { agent, conversation } = await requireOwnedAgentConversation({
    c,
    userId: claims.sub,
    agentId,
  })
  const messages = await listAgentConversationMessages({
    db: getDb(c.env.DB),
    userId: claims.sub,
    agentId,
    conversationId: conversation.id,
    limit: initialHistoryLimit,
  })
  const res = AgentConversationResponseSchema.parse({
    conversationId: conversation.id,
    agentId,
    title: conversation.title,
    summary: conversation.summary,
    messageCount: conversation.messageCount,
    openingMessage: agent.openingMessage,
    messages: messages.map(toConversationMessageResponse),
    nextCursor: getOldestMessageCursor(messages, initialHistoryLimit),
  })

  return c.json(buildSuccess(res, createApiMeta()))
})

inboxChatRoute.get('/:agentId/messages', async (c) => {
  const claims = await requireWebAccessToken(c)
  const agentId = c.req.param('agentId')?.trim()
  const cursor = c.req.query('cursor')?.trim()
  const beforeMs = cursor ? Number(cursor) : undefined

  if (!agentId) {
    throw new AppError(BizCode.COMMON_INVALID_REQUEST, 'Agent id is required', 400)
  }

  if (cursor && (!Number.isFinite(beforeMs) || beforeMs! <= 0)) {
    throw new AppError(BizCode.COMMON_INVALID_REQUEST, 'Invalid cursor', 400)
  }

  const { conversation } = await requireOwnedAgentConversation({
    c,
    userId: claims.sub,
    agentId,
  })
  const messages = await listAgentConversationMessages({
    db: getDb(c.env.DB),
    userId: claims.sub,
    agentId,
    conversationId: conversation.id,
    beforeMs,
    limit: initialHistoryLimit,
  })
  const res = AgentConversationMessagesResponseSchema.parse({
    messages: messages.map(toConversationMessageResponse),
    nextCursor: getOldestMessageCursor(messages, initialHistoryLimit),
  })

  return c.json(buildSuccess(res, createApiMeta()))
})

inboxChatRoute.post(
  '/',
  zValidator(
    'json',
    InboxChatRequestSchema,
    buildValidationErrorHandler('Invalid chat payload'),
  ),
  async (c) => {
    const claims = await requireWebAccessToken(c)

    const env = getApiEnv(c.env)
    const payload = c.req.valid('json')
    const providerConfig = resolveChatProviderConfig({ payload, env })
    const agentId = payload.conversation.id
    const db = getDb(c.env.DB)
    const ownedConversation = agentId
      ? await requireOwnedAgentConversation({
          c,
          userId: claims.sub,
          agentId,
        })
      : null
    const conversationId = ownedConversation?.conversation.id ?? payload.conversationId
    const agentPrompt = agentId
      ? await findUserAgentCompanionPrompt(db, {
          userId: claims.sub,
          agentId,
        })
      : null
    const storedRecentMessages = agentId && conversationId
      ? await listAgentConversationMessages({
          db,
          userId: claims.sub,
          agentId,
          conversationId,
          limit: recentMessageLimit,
        })
      : []
    const activeMemories = agentId
      ? await listActiveAgentMemories({
          db,
          userId: claims.sub,
          agentId,
          limit: memoryInjectionLimit,
        })
      : []
    const latestPayloadUserMessage = [...payload.messages]
      .reverse()
      .find((message) => message.role === 'user' && extractText(message))
    const latestUserText = latestPayloadUserMessage ? normalizeStoredMessage(extractText(latestPayloadUserMessage)) : ''
    const safety = await analyzeConversationSafety({
      providerConfig,
      agentName: payload.conversation.name,
      agentGuardrails: agentPrompt?.guardrailsPrompt ?? null,
      activeMemories,
      recentMessages: storedRecentMessages,
      userText: latestUserText,
      signal: c.req.raw.signal,
    })
    let sourceUserMessageId: string | null = null

    if (agentId && conversationId && latestUserText) {
      sourceUserMessageId = crypto.randomUUID()
      const userMessageNowMs = Date.now()

      await insertAgentConversationMessage({
        db,
        id: sourceUserMessageId,
        conversationId,
        userId: claims.sub,
        agentId,
        role: 'user',
        content: latestUserText,
        status: 'completed',
        metadataJson: toSafetyMetadata(safety),
        nowMs: userMessageNowMs,
      })
      await updateAgentConversationAfterMessage({
        db,
        userId: claims.sub,
        agentId,
        conversationId,
        summary: ownedConversation?.conversation.summary ?? null,
        messageCount: (ownedConversation?.conversation.messageCount ?? 0) + 1,
        lastMessageAtMs: userMessageNowMs,
        nowMs: userMessageNowMs,
      })
    }

    const boundaryResponse = buildBoundaryResponse(safety)

    if (boundaryResponse) {
      await saveAssistantTurn({
        c,
        userId: claims.sub,
        agentId,
        agentName: payload.conversation.name,
        conversationId,
        sourceUserMessageId,
        userText: latestUserText,
        assistantText: boundaryResponse,
        providerConfig,
        allowMemoryExtraction: safety.allowMemoryExtraction,
        previousSummary: ownedConversation?.conversation.summary ?? null,
        previousMessageCount: ownedConversation?.conversation.messageCount ?? 0,
        recentMessages: storedRecentMessages,
      })

      return buildTextStreamResponse(new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(boundaryResponse))
          controller.close()
        },
      }))
    }

    const messages: ChatCompletionMessage[] = [
      {
        role: 'system',
        content: [
          agentPrompt?.defaultPrompt || '你是 AI Agent Web 控制台里的聊天陪伴助手。',
          '请基于当前聊天对象、关系氛围和用户意图，用简洁、自然的中文回答用户。',
          '如果用户要求起草回复，请直接给出可发送的聊天内容，避免正式公文格式和职场汇报语气。',
          '你的建议应尊重双方边界，避免操控式话术、制造焦虑或诱导过度解读。',
          getSafetySystemInstruction(safety),
          activeMemories.length > 0
            ? [
                '以下是用户与该 Agent 的长期记忆，请优先尊重：',
                ...activeMemories.map((memory) => `- [${memory.type} / 重要度 ${memory.importance}] ${memory.content}`),
              ].join('\n')
            : '',
          ownedConversation?.conversation.summary
            ? `此前对话摘要：${ownedConversation.conversation.summary}`
            : '',
        ].join('\n'),
      },
      {
        role: 'user',
        content: [
          `聊天对象：${payload.conversation.name}（${payload.conversation.handle}）`,
          `对象状态：${payload.conversation.status}，${payload.conversation.lastActive}`,
          `关系阶段：${payload.conversation.relationship}`,
          `聊天主题：${payload.conversation.headline}`,
          `共同点：${payload.conversation.topic}`,
          `心动值：${payload.conversation.chemistryLabel} ${payload.conversation.chemistry}`,
          `互动节奏：${payload.conversation.rhythm}`,
          `对象备注：${payload.conversation.profileNote}`,
        ].join('\n'),
      },
    ]

    const promptHistory = storedRecentMessages.length > 0
      ? storedRecentMessages
      : payload.messages.map((message) => ({
          role: message.role,
          content: extractText(message),
        }))

    for (const message of promptHistory) {
      const text = normalizeStoredMessage(message.content)

      if (!text) {
        continue
      }

      messages.push({ role: message.role, content: text })
    }

    if (storedRecentMessages.length > 0 && latestUserText) {
      messages.push({ role: 'user', content: latestUserText })
    }

    const upstreamResult = await fetchUpstreamChat({
      providerConfig,
      messages,
      signal: c.req.raw.signal,
    })
    const upstream = upstreamResult.upstream
    const effectiveProviderConfig: ChatProviderConfig = {
      ...providerConfig,
      wireApi: upstreamResult.wireApi,
    }

    if (!upstream.ok) {
      console.warn('Chat stream failed', {
        status: upstream.status,
        wireApi: upstreamResult.wireApi,
        retriedFromWireApi: upstreamResult.retriedFromWireApi,
      })

      throw new AppError(
        BizCode.SYSTEM_INTERNAL_ERROR,
        'Chat stream failed',
        500,
      )
    }

    const upstreamContentType = upstream.headers.get('content-type') ?? ''

    if (!upstreamContentType.includes('text/event-stream')) {
      const upstreamText = await upstream.text()
      const responseText = looksLikeHtmlPayload(upstreamText)
        ? htmlUpstreamMessage
        : extractTextFromRawPayload(upstreamText) || emptyUpstreamMessage

      await saveAssistantTurn({
        c,
        userId: claims.sub,
        agentId,
        agentName: payload.conversation.name,
        conversationId,
        sourceUserMessageId,
        userText: latestUserText,
        assistantText: responseText,
        providerConfig: effectiveProviderConfig,
        allowMemoryExtraction: safety.allowMemoryExtraction,
        previousSummary: ownedConversation?.conversation.summary ?? null,
        previousMessageCount: ownedConversation?.conversation.messageCount ?? 0,
        recentMessages: storedRecentMessages,
      })

      return buildTextStreamResponse(new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(responseText))
          controller.close()
        },
      }))
    }

    const textStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder()
        const decoder = new TextDecoder()
        const reader = upstream.body?.getReader()
        let buffer = ''
        let closed = false
        let hasContent = false
        let assistantMessageText = ''

        if (!reader) {
          controller.enqueue(encoder.encode(emptyUpstreamMessage))
          await saveAssistantTurn({
            c,
            userId: claims.sub,
            agentId,
            agentName: payload.conversation.name,
            conversationId,
            sourceUserMessageId,
            userText: latestUserText,
            assistantText: emptyUpstreamMessage,
            providerConfig: effectiveProviderConfig,
            allowMemoryExtraction: safety.allowMemoryExtraction,
            previousSummary: ownedConversation?.conversation.summary ?? null,
            previousMessageCount: ownedConversation?.conversation.messageCount ?? 0,
            recentMessages: storedRecentMessages,
          })
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              buffer += decoder.decode()
              break
            }

            buffer += decoder.decode(value, { stream: true })

            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              const result = extractTextFromStreamLine(line, { allowCompletedPayload: !hasContent })

              if (result.done) {
                if (!hasContent) {
                  controller.enqueue(encoder.encode(emptyUpstreamMessage))
                  assistantMessageText += emptyUpstreamMessage
                }

                await saveAssistantTurn({
                  c,
                  userId: claims.sub,
                  agentId,
                  agentName: payload.conversation.name,
                  conversationId,
                  sourceUserMessageId,
                  userText: latestUserText,
                  assistantText: assistantMessageText,
                  providerConfig: effectiveProviderConfig,
                  allowMemoryExtraction: safety.allowMemoryExtraction,
                  previousSummary: ownedConversation?.conversation.summary ?? null,
                  previousMessageCount: ownedConversation?.conversation.messageCount ?? 0,
                  recentMessages: storedRecentMessages,
                })
                closed = true
                controller.close()
                break
              }

              if (result.text) {
                hasContent = true
                assistantMessageText += result.text
                controller.enqueue(encoder.encode(result.text))
              }
            }

            if (closed) {
              break
            }
          }

          if (!closed && buffer.trim()) {
            const result = extractTextFromStreamLine(buffer, { allowCompletedPayload: !hasContent })

            if (result.text) {
              hasContent = true
              assistantMessageText += result.text
              controller.enqueue(encoder.encode(result.text))
            }
          }

          if (!closed) {
            if (!hasContent) {
              controller.enqueue(encoder.encode(emptyUpstreamMessage))
              assistantMessageText += emptyUpstreamMessage
            }

            await saveAssistantTurn({
              c,
              userId: claims.sub,
              agentId,
              agentName: payload.conversation.name,
              conversationId,
              sourceUserMessageId,
              userText: latestUserText,
              assistantText: assistantMessageText,
              providerConfig: effectiveProviderConfig,
              allowMemoryExtraction: safety.allowMemoryExtraction,
              previousSummary: ownedConversation?.conversation.summary ?? null,
              previousMessageCount: ownedConversation?.conversation.messageCount ?? 0,
              recentMessages: storedRecentMessages,
            })
            controller.close()
          }
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return buildTextStreamResponse(textStream)
  },
)

export default inboxChatRoute
