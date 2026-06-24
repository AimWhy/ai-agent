import { Hono, type Context } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  BizCode,
  ImageGenerationProxyRequestSchema,
  ImageGenerationProxyResponseSchema,
  buildSuccess,
  type ImageGenerationProxyRequest,
} from '@repo/contracts'
import { authUnauthorizedError } from '@/auth/errors'
import { buildValidationErrorHandler } from '@/auth/http'
import { verifyAccessToken } from '@/auth/jwt'
import type { ApiBindings } from '@/bindings'
import { getApiEnv } from '@/env'
import { createApiMeta } from '@/lib/api-meta'
import { AppError } from '@/lib/app-error'

type GeneratedImage = {
  image: string
  mimeType: string
}

const imageGenerationProxyRoute = new Hono<{ Bindings: ApiBindings }>()

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

function buildImageGenerationEndpoint(config: ImageGenerationProxyRequest['config']) {
  const url = new URL(config.baseURL)

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new AppError(BizCode.COMMON_INVALID_REQUEST, 'Image generation Base URL is invalid', 400)
  }

  const baseURL = config.baseURL.replace(/\/$/, '')

  if (config.providerApi === 'responses') {
    return baseURL.endsWith('/responses') ? baseURL : `${baseURL}/responses`
  }

  if (baseURL.endsWith('/images/generations')) {
    return baseURL
  }

  return `${baseURL}/images/generations`
}

function buildUpstreamRequestBody(payload: ImageGenerationProxyRequest) {
  const { config, prompt } = payload

  if (config.providerApi === 'responses') {
    return {
      model: config.model,
      input: prompt,
      tools: [
        {
          type: 'image_generation',
          size: config.size,
          quality: config.quality,
          background: config.background,
          output_format: config.outputFormat,
        },
      ],
    }
  }

  return {
    model: config.model,
    prompt,
    n: 1,
    size: config.size === 'auto' ? '1024x1024' : config.size,
    quality: config.quality,
    background: config.background,
    output_format: config.outputFormat,
    response_format: 'b64_json',
  }
}

function getMimeTypeFromOutputFormat(outputFormat: string) {
  if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
    return 'image/jpeg'
  }

  if (outputFormat === 'webp') {
    return 'image/webp'
  }

  return 'image/png'
}

function findGeneratedImage(input: unknown, fallbackMimeType = 'image/png'): GeneratedImage | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const response = input as {
    data?: Array<{ b64_json?: string; url?: string; mime_type?: string; mimeType?: string }>
    output?: Array<Record<string, unknown>>
  }
  const firstImage = response.data?.find((item) => item.b64_json || item.url)

  if (firstImage?.b64_json) {
    return {
      image: firstImage.b64_json,
      mimeType: firstImage.mime_type ?? firstImage.mimeType ?? fallbackMimeType,
    }
  }

  if (firstImage?.url) {
    return {
      image: firstImage.url,
      mimeType: firstImage.mime_type ?? firstImage.mimeType ?? fallbackMimeType,
    }
  }

  for (const outputItem of response.output ?? []) {
    if (outputItem.type === 'image_generation_call') {
      const result = typeof outputItem.result === 'string' ? outputItem.result : ''

      if (result) {
        return {
          image: result,
          mimeType: getOutputItemMimeType(outputItem, fallbackMimeType),
        }
      }
    }

    const content = Array.isArray(outputItem.content) ? outputItem.content : []

    for (const part of content) {
      if (!part || typeof part !== 'object') {
        continue
      }

      const candidate = part as Record<string, unknown>
      const imageUrl = typeof candidate.image_url === 'string'
        ? candidate.image_url
        : typeof candidate.url === 'string'
          ? candidate.url
          : ''
      const base64 = typeof candidate.b64_json === 'string'
        ? candidate.b64_json
        : typeof candidate.data === 'string'
          ? candidate.data
          : ''

      if (imageUrl) {
        return {
          image: imageUrl,
          mimeType: getOutputItemMimeType(candidate, fallbackMimeType),
        }
      }

      if (base64) {
        return {
          image: base64,
          mimeType: getOutputItemMimeType(candidate, fallbackMimeType),
        }
      }
    }
  }

  return null
}

function getOutputItemMimeType(item: Record<string, unknown>, fallbackMimeType: string) {
  const mimeType = typeof item.mime_type === 'string'
    ? item.mime_type
    : typeof item.mimeType === 'string'
      ? item.mimeType
      : ''
  const outputFormat = typeof item.output_format === 'string'
    ? item.output_format
    : typeof item.outputFormat === 'string'
      ? item.outputFormat
      : ''

  if (mimeType) {
    return mimeType
  }

  if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
    return 'image/jpeg'
  }

  if (outputFormat === 'webp') {
    return 'image/webp'
  }

  return fallbackMimeType
}

function extractUpstreamErrorMessage(responseBody: unknown) {
  if (!responseBody || typeof responseBody !== 'object') {
    return null
  }

  const body = responseBody as {
    error?: { message?: string }
    message?: string
  }

  return body.error?.message ?? body.message ?? null
}

imageGenerationProxyRoute.post(
  '/generate',
  zValidator('json', ImageGenerationProxyRequestSchema, buildValidationErrorHandler('Invalid image generation payload')),
  async (c) => {
    await requireWebAccessToken(c)

    const payload = c.req.valid('json')
    const response = await fetch(buildImageGenerationEndpoint(payload.config), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${payload.config.apiKey}`,
      },
      body: JSON.stringify(buildUpstreamRequestBody(payload)),
    }).catch((error) => {
      throw new AppError(
        BizCode.SYSTEM_UPSTREAM_TIMEOUT,
        error instanceof Error ? error.message : 'Image generation upstream request failed',
        504,
      )
    })
    const responseBody = await response.json().catch(() => null)

    if (!response.ok) {
      throw new AppError(
        BizCode.SYSTEM_UPSTREAM_TIMEOUT,
        extractUpstreamErrorMessage(responseBody) ?? `Image generation upstream failed, HTTP ${response.status}`,
        504,
      )
    }

    const generatedImage = findGeneratedImage(responseBody, getMimeTypeFromOutputFormat(payload.config.outputFormat))

    if (!generatedImage) {
      throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, 'Image generation response does not include an image', 500)
    }

    const res = ImageGenerationProxyResponseSchema.parse(generatedImage)

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

export default imageGenerationProxyRoute
