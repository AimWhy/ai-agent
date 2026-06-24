"use client"

const storageKey = "web:local-image-generation-config"
const localImageGenerationConfigChangedEventName = "web-local-image-generation-config-changed"

export type ImageGenerationProviderApi = "images_generations" | "responses"

export type LocalImageGenerationConfig = {
  enabled: boolean
  providerName: string
  baseURL: string
  model: string
  apiKey: string
  providerApi: ImageGenerationProviderApi
  size: string
  quality: string
  background: string
  outputFormat: string
  updatedAtMs: number
}

function canUseStorage() {
  return typeof window !== "undefined"
}

function notifyLocalImageGenerationConfigChanged() {
  if (canUseStorage()) {
    window.dispatchEvent(new Event(localImageGenerationConfigChangedEventName))
  }
}

function normalizeProviderApi(value: string | undefined): ImageGenerationProviderApi {
  return value === "responses" ? "responses" : "images_generations"
}

function normalizeConfig(input: LocalImageGenerationConfig): LocalImageGenerationConfig {
  return {
    enabled: Boolean(input.enabled),
    providerName: input.providerName?.trim() || "GPT 5.5 中转",
    baseURL: input.baseURL?.trim().replace(/\/$/, "") || "",
    model: input.model?.trim() || "gpt-5.5",
    apiKey: input.apiKey?.trim() || "",
    providerApi: normalizeProviderApi(input.providerApi),
    size: input.size?.trim() || "1024x1024",
    quality: input.quality?.trim() || "auto",
    background: input.background?.trim() || "auto",
    outputFormat: input.outputFormat?.trim() || "png",
    updatedAtMs: input.updatedAtMs || Date.now(),
  }
}

export function createDefaultImageGenerationConfig(): LocalImageGenerationConfig {
  return {
    enabled: true,
    providerName: "GPT 5.5 中转",
    baseURL: "",
    model: "gpt-5.5",
    apiKey: "",
    providerApi: "responses",
    size: "1024x1024",
    quality: "auto",
    background: "auto",
    outputFormat: "png",
    updatedAtMs: Date.now(),
  }
}

export function readLocalImageGenerationConfig(): LocalImageGenerationConfig {
  if (!canUseStorage()) {
    return createDefaultImageGenerationConfig()
  }

  const rawValue = window.localStorage.getItem(storageKey)

  if (!rawValue) {
    return createDefaultImageGenerationConfig()
  }

  try {
    return normalizeConfig(JSON.parse(rawValue) as LocalImageGenerationConfig)
  } catch {
    window.localStorage.removeItem(storageKey)
    return createDefaultImageGenerationConfig()
  }
}

export function saveLocalImageGenerationConfig(input: LocalImageGenerationConfig) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(normalizeConfig({
    ...input,
    updatedAtMs: Date.now(),
  })))
  notifyLocalImageGenerationConfigChanged()
}

export function clearLocalImageGenerationConfig() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(storageKey)
  notifyLocalImageGenerationConfigChanged()
}

export { localImageGenerationConfigChangedEventName }
