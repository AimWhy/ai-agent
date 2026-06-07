import { zValidator } from '@hono/zod-validator'
import { Hono, type Context } from 'hono'
import {
  BizCode,
  InboxChatRequestSchema,
} from '@repo/contracts'
import { authUnauthorizedError } from '@/auth/errors'
import { buildValidationErrorHandler } from '@/auth/http'
import { verifyAccessToken } from '@/auth/jwt'
import type { ApiBindings } from '@/bindings'
import { getApiEnv } from '@/env'
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

inboxChatRoute.post(
  '/',
  zValidator(
    'json',
    InboxChatRequestSchema,
    buildValidationErrorHandler('Invalid chat payload'),
  ),
  async (c) => {
    await requireWebAccessToken(c)

    const env = getApiEnv(c.env)
    const payload = c.req.valid('json')
    const providerConfig = resolveChatProviderConfig({ payload, env })
    const messages: ChatCompletionMessage[] = [
      {
        role: 'system',
        content: [
          '你是 AI Agent Web 控制台里的聊天陪伴助手。',
          '请基于当前聊天对象、关系氛围和用户意图，用简洁、自然的中文回答用户。',
          '如果用户要求起草回复，请直接给出可发送的聊天内容，避免正式公文格式和职场汇报语气。',
          '你的建议应尊重双方边界，避免操控式话术、制造焦虑或诱导过度解读。',
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

    for (const message of payload.messages) {
      const text = extractText(message)

      if (!text) {
        continue
      }

      messages.push({ role: message.role, content: text })
    }

    const upstreamResult = await fetchUpstreamChat({
      providerConfig,
      messages,
      signal: c.req.raw.signal,
    })
    const upstream = upstreamResult.upstream

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

        if (!reader) {
          controller.enqueue(encoder.encode(emptyUpstreamMessage))
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
                }

                closed = true
                controller.close()
                break
              }

              if (result.text) {
                hasContent = true
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
              controller.enqueue(encoder.encode(result.text))
            }
          }

          if (!closed) {
            if (!hasContent) {
              controller.enqueue(encoder.encode(emptyUpstreamMessage))
            }

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
