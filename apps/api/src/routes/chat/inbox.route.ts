import { zValidator } from '@hono/zod-validator'
import { HumanMessage, SystemMessage, AIMessage, type BaseMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
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
    const model = new ChatOpenAI({
      apiKey: env.DEEPSEEK_API_KEY,
      model: env.DEEPSEEK_MODEL ?? 'deepseek-chat',
      configuration: {
        baseURL: env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1',
      },
    })
    const messages: BaseMessage[] = [
      new SystemMessage([
        '你是 AI Agent Web 控制台里的邮件助手。',
        '请基于当前邮件上下文，用简洁、自然的中文回答用户。',
        '如果用户要求起草回复，请直接给出可发送的回复内容。',
      ].join('\n')),
      new HumanMessage([
        `邮件主题：${payload.mail.subject}`,
        `发件人：${payload.mail.sender} <${payload.mail.senderEmail}>`,
        `邮件摘要：${payload.mail.teaser}`,
      ].join('\n')),
    ]

    for (const message of payload.messages) {
      const text = extractText(message)

      if (!text) {
        continue
      }

      messages.push(message.role === 'user' ? new HumanMessage(text) : new AIMessage(text))
    }

    const stream = await model.stream(messages)
    const textStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          for await (const chunk of stream) {
            const content = typeof chunk.content === 'string'
              ? chunk.content
              : chunk.content.map((part) => {
                if (typeof part === 'string') {
                  return part
                }

                if ('text' in part && typeof part.text === 'string') {
                  return part.text
                }

                return ''
              }).join('')

            if (content) {
              controller.enqueue(encoder.encode(content))
            }
          }

          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(textStream, {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-cache',
      },
    })
  },
)

export default inboxChatRoute
