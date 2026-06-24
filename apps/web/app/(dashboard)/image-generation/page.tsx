"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import {
  Brush,
  CheckCircle2,
  Download,
  Eraser,
  ImageIcon,
  KeyRound,
  Loader2,
  MessageSquareText,
  RadioTower,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import type {
  ImageGenerationProxyRequest,
  ImageGenerationProxyResponse,
} from "@repo/contracts"

import {
  createDefaultImageGenerationConfig,
  localImageGenerationConfigChangedEventName,
  readLocalImageGenerationConfig,
  saveLocalImageGenerationConfig,
  type LocalImageGenerationConfig,
} from "@/auth/local-image-generation-config"
import { http } from "@/lib/http"
import { DashboardShell } from "../_components/dashboard-shell"

type ImageGenerationMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  imageUrl?: string
  imageMimeType?: string
  createdAtMs: number
}

const quickPrompts = [
  "赛博朋克风格的雨夜街角，霓虹灯反射在湿漉漉的路面",
  "温暖自然光下的产品摄影，一只极简白色智能音箱",
  "中国水墨风山海场景，云雾、远山、孤舟",
  "一张适合作为 App 首页的插画，主题是 AI 个人助手",
]

const imageSizes = ["1024x1024", "1024x1536", "1536x1024", "auto"]
const imageQualities = ["auto", "low", "medium", "high"]
const imageBackgrounds = ["auto", "transparent", "opaque"]
const imageOutputFormats = ["png", "jpeg", "webp"]

function createMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `image-message-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatDateTime(value: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value)).replaceAll("/", ".")
}

function maskApiKey(value: string) {
  if (!value) {
    return "未配置"
  }

  if (value.length <= 10) {
    return "••••••"
  }

  return `${value.slice(0, 4)}••••••${value.slice(-4)}`
}

function buildImageUrl(value: string, mimeType = "image/png") {
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) {
    return value
  }

  return `data:${mimeType};base64,${value}`
}

async function generateImage(config: LocalImageGenerationConfig, prompt: string) {
  const proxyConfig: ImageGenerationProxyRequest["config"] = {
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    model: config.model,
    providerApi: config.providerApi,
    size: config.size,
    quality: config.quality,
    background: config.background,
    outputFormat: config.outputFormat,
    ...(config.providerName ? { providerName: config.providerName } : {}),
  }
  const response = await http.post<ImageGenerationProxyResponse, ImageGenerationProxyRequest>("/rpc/image-generation/generate", {
    prompt,
    config: proxyConfig,
  })

  if (!response.image) {
    throw new Error("未能从 API 代理响应中解析到图片结果。")
  }

  return {
    url: buildImageUrl(response.image, response.mimeType),
    mimeType: response.mimeType,
  }
}

function getLatestImageMessage(messages: ImageGenerationMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]

    if (message?.role === "assistant" && message.imageUrl) {
      return message
    }
  }

  return null
}

function getImageFileExtension(mimeType: string | undefined) {
  if (mimeType === "image/jpeg") {
    return "jpg"
  }

  if (mimeType === "image/webp") {
    return "webp"
  }

  return "png"
}

function ConfigField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

export default function ImageGenerationPage() {
  const [config, setConfig] = useState<LocalImageGenerationConfig>(() => createDefaultImageGenerationConfig())
  const [draftPrompt, setDraftPrompt] = useState("")
  const [notice, setNotice] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [messages, setMessages] = useState<ImageGenerationMessage[]>([])
  const latestImageMessage = useMemo(
    () => getLatestImageMessage(messages),
    [messages],
  )

  useEffect(() => {
    setConfig(readLocalImageGenerationConfig())

    function handleChanged() {
      setConfig(readLocalImageGenerationConfig())
    }

    window.addEventListener(localImageGenerationConfigChangedEventName, handleChanged)

    return () => {
      window.removeEventListener(localImageGenerationConfigChangedEventName, handleChanged)
    }
  }, [])

  function handleSaveConfig() {
    const nextConfig = {
      ...config,
      providerName: config.providerName.trim(),
      baseURL: config.baseURL.trim(),
      model: config.model.trim(),
      apiKey: config.apiKey.trim(),
    }

    if (!nextConfig.providerName || !nextConfig.baseURL || !nextConfig.model || !nextConfig.apiKey) {
      setNotice("请完整填写 Provider、Base URL、Model 和 API Key。")
      return
    }

    saveLocalImageGenerationConfig(nextConfig)
    setConfig(readLocalImageGenerationConfig())
    setNotice("图片生成配置已保存到当前浏览器。")
    setErrorMessage("")
  }

  function handleResetConfig() {
    setConfig(createDefaultImageGenerationConfig())
    setNotice("已恢复默认配置，保存后生效。")
    setErrorMessage("")
  }

  async function handleGenerate() {
    const prompt = draftPrompt.trim()
    const activeConfig: LocalImageGenerationConfig = {
      ...config,
      providerName: config.providerName.trim(),
      baseURL: config.baseURL.trim(),
      model: config.model.trim(),
      apiKey: config.apiKey.trim(),
    }

    if (!prompt) {
      setErrorMessage("请输入图片提示词。")
      return
    }

    if (!activeConfig.enabled || !activeConfig.baseURL || !activeConfig.model || !activeConfig.apiKey) {
      setErrorMessage("请先保存并启用完整的图片生成 LLM 配置。")
      return
    }

    saveLocalImageGenerationConfig(activeConfig)
    setConfig(readLocalImageGenerationConfig())

    const userMessage: ImageGenerationMessage = {
      id: createMessageId(),
      role: "user",
      content: prompt,
      createdAtMs: Date.now(),
    }

    setMessages((current) => [...current, userMessage])
    setDraftPrompt("")
    setIsGenerating(true)
    setErrorMessage("")
    setNotice("")

    try {
      const image = await generateImage(activeConfig, prompt)
      const assistantMessage: ImageGenerationMessage = {
        id: createMessageId(),
        role: "assistant",
        content: "图片已生成",
        imageUrl: image.url,
        imageMimeType: image.mimeType,
        createdAtMs: Date.now(),
      }

      setMessages((current) => [...current, assistantMessage])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "图片生成失败，请检查配置。")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <DashboardShell title="图片生成">
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
        <section className="border-b border-slate-200 bg-white px-5 py-5 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
            <div className="flex min-w-0 gap-4">
              <span className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 sm:flex">
                <ImageIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                  <span>图片生成</span>
                  <span className="h-px w-8 bg-slate-200" />
                  <span>GPT 5.5 relay</span>
                </div>
                <h1 className="mt-2 text-xl font-semibold tracking-normal text-slate-950">本机 LLM 生图工作台</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  在当前浏览器保存三方中转的 Base URL、模型和 API Key。提交提示词后经由 API 代理转发生图请求，配置不会写入用户资料或 D1。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 border-t border-slate-200 pt-3 lg:border-t-0 lg:pt-0">
              {[
                { label: "状态", value: config.enabled ? "启用" : "停用", icon: CheckCircle2 },
                { label: "模型", value: config.model || "未配置", icon: Sparkles },
                { label: "Key", value: maskApiKey(config.apiKey), icon: KeyRound },
              ].map((item, index) => {
                const Icon = item.icon

                return (
                  <div className={index === 0 ? "pr-4" : "border-l border-slate-200 px-4 last:pr-0"} key={item.label}>
                    <div className="mb-2 flex size-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <Icon className="size-3.5" />
                    </div>
                    <p className="text-[10px] font-medium text-slate-400">{item.label}</p>
                    <p className="mt-1 truncate text-sm font-medium leading-none text-slate-600">{item.value}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="grid min-h-[calc(100vh-12rem)] gap-5 px-5 py-5 lg:grid-cols-[24rem_minmax(0,1fr)] lg:px-8">
          <aside className="min-w-0 bg-white p-5">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <RadioTower className="size-4 text-slate-500" />
                  LLM 配置
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">默认按 Responses 生图工具调用。</p>
              </div>
              <button
                aria-pressed={config.enabled}
                className={config.enabled ? "h-5 w-9 rounded-full bg-slate-950 p-0.5" : "h-5 w-9 rounded-full bg-slate-200 p-0.5"}
                onClick={() => {
                  setConfig((current) => ({ ...current, enabled: !current.enabled }))
                  setNotice("")
                }}
                type="button"
              >
                <span className={config.enabled ? "ml-auto block size-4 rounded-full bg-white" : "block size-4 rounded-full bg-white"} />
              </button>
            </div>

            <div className="grid gap-3">
              <ConfigField label="Provider">
                <input
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-300 focus:border-slate-400"
                  onChange={(event) => {
                    const providerName = event.currentTarget.value
                    setConfig((current) => ({ ...current, providerName }))
                    setNotice("")
                  }}
                  placeholder="GPT 5.5 中转"
                  value={config.providerName}
                />
              </ConfigField>

              <ConfigField label="Base URL">
                <input
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-300 focus:border-slate-400"
                  onChange={(event) => {
                    const baseURL = event.currentTarget.value
                    setConfig((current) => ({ ...current, baseURL }))
                    setNotice("")
                  }}
                  placeholder="https://relay.example.com/v1"
                  value={config.baseURL}
                />
              </ConfigField>

              <div className="grid grid-cols-2 gap-3">
                <ConfigField label="协议">
                  <select
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-slate-400"
                    onChange={(event) => {
                      const value = event.currentTarget.value
                      const providerApi = value === "responses" ? "responses" : "images_generations"
                      setConfig((current) => ({ ...current, providerApi }))
                      setNotice("")
                    }}
                    value={config.providerApi}
                  >
                    <option value="responses">Responses</option>
                    <option value="images_generations">Images</option>
                  </select>
                </ConfigField>

                <ConfigField label="Model">
                  <input
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-300 focus:border-slate-400"
                    onChange={(event) => {
                      const model = event.currentTarget.value
                      setConfig((current) => ({ ...current, model }))
                      setNotice("")
                    }}
                    placeholder="gpt-5.5"
                    value={config.model}
                  />
                </ConfigField>
              </div>

              <ConfigField label="API Key">
                <input
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-300 focus:border-slate-400"
                  onChange={(event) => {
                    const apiKey = event.currentTarget.value
                    setConfig((current) => ({ ...current, apiKey }))
                    setNotice("")
                  }}
                  placeholder="sk-..."
                  type="password"
                  value={config.apiKey}
                />
              </ConfigField>

              <div className="grid grid-cols-2 gap-3">
                <ConfigField label="尺寸">
                  <select
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-slate-400"
                    onChange={(event) => {
                      const size = event.currentTarget.value
                      setConfig((current) => ({ ...current, size }))
                      setNotice("")
                    }}
                    value={config.size}
                  >
                    {imageSizes.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </ConfigField>

                <ConfigField label="质量">
                  <select
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-slate-400"
                    onChange={(event) => {
                      const quality = event.currentTarget.value
                      setConfig((current) => ({ ...current, quality }))
                      setNotice("")
                    }}
                    value={config.quality}
                  >
                    {imageQualities.map((quality) => (
                      <option key={quality} value={quality}>{quality}</option>
                    ))}
                  </select>
                </ConfigField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ConfigField label="背景">
                  <select
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-slate-400"
                    onChange={(event) => {
                      const background = event.currentTarget.value
                      setConfig((current) => ({ ...current, background }))
                      setNotice("")
                    }}
                    value={config.background}
                  >
                    {imageBackgrounds.map((background) => (
                      <option key={background} value={background}>{background}</option>
                    ))}
                  </select>
                </ConfigField>

                <ConfigField label="格式">
                  <select
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-slate-400"
                    onChange={(event) => {
                      const outputFormat = event.currentTarget.value
                      setConfig((current) => ({ ...current, outputFormat }))
                      setNotice("")
                    }}
                    value={config.outputFormat}
                  >
                    {imageOutputFormats.map((format) => (
                      <option key={format} value={format}>{format}</option>
                    ))}
                  </select>
                </ConfigField>
              </div>

              {notice ? (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">{notice}</p>
              ) : null}

              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <button
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                  onClick={handleSaveConfig}
                  type="button"
                >
                  <CheckCircle2 className="size-4" />
                  保存
                </button>
                <button
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  onClick={handleResetConfig}
                  type="button"
                >
                  <Eraser className="size-4" />
                  重置
                </button>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <ShieldCheck className="size-4 text-slate-500" />
                  数据边界
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  API Key 只保存到当前浏览器 localStorage。生成时会临时随请求发送给 API 代理用于本次转发，不会落库。
                </p>
              </div>
            </div>
          </aside>

          <section className="grid min-h-[42rem] min-w-0 grid-rows-[minmax(0,1fr)_auto] bg-white">
            <div className="grid min-h-0 gap-0 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="flex min-h-0 flex-col border-b border-slate-200 xl:border-r xl:border-b-0">
                <div className="border-b border-slate-200 px-5 py-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <MessageSquareText className="size-4 text-slate-500" />
                    生图对话
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    每次提交会把当前提示词发送给 {config.providerName || "已配置中转"}。
                  </p>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-5 py-5">
                  {messages.length === 0 ? (
                    <div className="flex min-h-80 items-center justify-center border border-dashed border-slate-200 bg-white px-6 text-center">
                      <div>
                        <Brush className="mx-auto size-8 text-slate-300" />
                        <p className="mt-3 text-sm font-medium text-slate-700">还没有图片对话</p>
                        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                          选择一个快捷提示，或直接描述画面、风格、比例、光线和用途。
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {messages.map((message) => (
                        <article
                          className={message.role === "user" ? "ml-auto max-w-2xl" : "mr-auto max-w-3xl"}
                          key={message.id}
                        >
                          <div
                            className={
                              message.role === "user"
                                ? "rounded-2xl bg-slate-950 px-4 py-3 text-sm leading-6 text-white"
                                : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700"
                            }
                          >
                            <div className="mb-1 text-[11px] font-medium opacity-70">
                              {message.role === "user" ? "你" : "图片生成"} · {formatDateTime(message.createdAtMs)}
                            </div>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            {message.imageUrl ? (
                              <img
                                alt="生成图片"
                                className="mt-3 aspect-square w-full max-w-xl object-contain"
                                src={message.imageUrl}
                              />
                            ) : null}
                          </div>
                        </article>
                      ))}
                      {isGenerating ? (
                        <article className="mr-auto max-w-3xl">
                          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-500">
                            <Loader2 className="size-4 animate-spin" />
                            正在生成图片...
                          </div>
                        </article>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <aside className="min-h-0 bg-white px-5 py-5">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <ImageIcon className="size-4 text-slate-500" />
                    最新图片
                  </p>
                  {latestImageMessage?.imageUrl ? (
                    <a
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      download={`generated-image-${latestImageMessage.id}.${getImageFileExtension(latestImageMessage.imageMimeType)}`}
                      href={latestImageMessage.imageUrl}
                    >
                      <Download className="size-3.5" />
                      下载
                    </a>
                  ) : null}
                </div>

                <div className="mt-4">
                  {latestImageMessage?.imageUrl ? (
                    <div className="bg-slate-50 p-3">
                      <img
                        alt="最新生成图片"
                        className="aspect-square w-full object-contain"
                        src={latestImageMessage.imageUrl}
                      />
                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        {latestImageMessage.content} · {formatDateTime(latestImageMessage.createdAtMs)}
                      </p>
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center border border-dashed border-slate-200 bg-slate-50 text-center">
                      <div className="px-6">
                        <ImageIcon className="mx-auto size-8 text-slate-300" />
                        <p className="mt-3 text-sm font-medium text-slate-700">等待生成结果</p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">最新图片会显示在这里。</p>
                      </div>
                    </div>
                  )}
                </div>

                {errorMessage ? (
                  <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs leading-5 text-red-600">{errorMessage}</p>
                ) : null}
              </aside>
            </div>

            <div className="border-t border-slate-200 bg-white px-5 py-4">
              <div className="mb-3 flex min-w-0 gap-2 overflow-x-auto">
                {quickPrompts.map((prompt) => (
                  <button
                    className="h-8 shrink-0 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isGenerating}
                    key={prompt}
                    onClick={() => {
                      setDraftPrompt(prompt)
                      setErrorMessage("")
                    }}
                    type="button"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-500">提示词</span>
                  <textarea
                    className="min-h-24 resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-800 outline-none transition-colors placeholder:text-slate-300 focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
                    disabled={isGenerating}
                    onChange={(event) => {
                      setDraftPrompt(event.currentTarget.value)
                      setErrorMessage("")
                    }}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                        event.preventDefault()
                        void handleGenerate()
                      }
                    }}
                    placeholder="描述你想生成的画面、风格、构图、光线、用途..."
                    value={draftPrompt}
                  />
                </label>

                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isGenerating}
                  onClick={() => void handleGenerate()}
                  type="button"
                >
                  {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  生成图片
                </button>
              </div>
            </div>
          </section>
        </section>
      </main>
    </DashboardShell>
  )
}
