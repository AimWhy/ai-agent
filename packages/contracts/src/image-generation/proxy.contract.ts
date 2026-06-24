import { z } from 'zod'

export const ImageGenerationProviderApiSchema = z.enum(['images_generations', 'responses'])

export const ImageGenerationProxyConfigSchema = z.object({
  providerName: z.string().trim().min(1).max(80).optional(),
  baseURL: z.string().trim().url().max(300),
  apiKey: z.string().trim().min(1).max(400),
  model: z.string().trim().min(1).max(120),
  providerApi: ImageGenerationProviderApiSchema,
  size: z.string().trim().min(1).max(40),
  quality: z.string().trim().min(1).max(40),
  background: z.string().trim().min(1).max(40),
  outputFormat: z.string().trim().min(1).max(20),
})

export const ImageGenerationProxyRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  config: ImageGenerationProxyConfigSchema,
})

export const ImageGenerationProxyResponseSchema = z.object({
  image: z.string().min(1),
  mimeType: z.string().min(1),
})

export type ImageGenerationProviderApi = z.infer<typeof ImageGenerationProviderApiSchema>
export type ImageGenerationProxyConfig = z.infer<typeof ImageGenerationProxyConfigSchema>
export type ImageGenerationProxyRequest = z.infer<typeof ImageGenerationProxyRequestSchema>
export type ImageGenerationProxyResponse = z.infer<typeof ImageGenerationProxyResponseSchema>
