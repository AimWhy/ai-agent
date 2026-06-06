import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  BizCode,
  InboxChatRequestSchema,
} from '@repo/contracts'
import { buildValidationErrorHandler } from '@/auth/http'
import type { ApiBindings } from '@/bindings'
import { getApiEnv } from '@/env'
import { AppError } from '@/lib/app-error'

const inboxChatRoute = new Hono<{ Bindings: ApiBindings }>()

type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function extractText(message: { parts: Array<{ type: string; text?: unknown }> }) {
  return message.parts
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n')
    .trim()
}

inboxChatRoute.post(
  '/',
  zValidator(
    'json',
    InboxChatRequestSchema,
    buildValidationErrorHandler('Invalid chat payload'),
  ),
  async (c) => {
    const env = getApiEnv(c.env)

    if (!env.DEEPSEEK_API_KEY) {
      throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, 'DeepSeek API key is not configured', 500)
    }

    const payload = c.req.valid('json')
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

    const baseURL = env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1'
    const upstream = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: env.DEEPSEEK_MODEL ?? 'deepseek-chat',
        messages,
        stream: true,
      }),
      signal: c.req.raw.signal,
    })

    if (!upstream.ok) {
      const details = await upstream.text()

      throw new AppError(
        BizCode.SYSTEM_INTERNAL_ERROR,
        'Chat completion stream failed',
        500,
        details,
      )
    }

    const textStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder()
        const decoder = new TextDecoder()
        const reader = upstream.body?.getReader()
        let buffer = ''
        let closed = false

        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done || closed) {
              break
            }

            buffer += decoder.decode(value, { stream: true })

            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              const trimmed = line.trim()

              if (!trimmed.startsWith('data:')) {
                continue
              }

              const data = trimmed.slice(5).trim()

              if (!data) {
                continue
              }

              if (data === '[DONE]') {
                closed = true
                controller.close()
                break
              }

              const parsed = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: unknown } }>
              }
              const content = parsed.choices?.[0]?.delta?.content

              if (typeof content === 'string' && content) {
                controller.enqueue(encoder.encode(content))
              }
            }

            if (closed) {
              break
            }
          }

          if (!closed) {
            controller.close()
          }
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(textStream, {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-cache',
        'x-accel-buffering': 'no',
      },
    })
  },
)

export default inboxChatRoute
