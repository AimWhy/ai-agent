"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { CreateMyAgentCompanionRequest } from "@repo/contracts"
import {
  BadgeCheck,
  BookOpenText,
  Bot,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MessageCircle,
  Mic2,
  PenLine,
  Send,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react"

import { DashboardShell } from "../_components/dashboard-shell"
import { createMyAgentCompanion, uploadMyAgentCompanionImage } from "@/auth/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const defaultForm: CreateMyAgentCompanionRequest = {
  name: "星野 Luna",
  headline: "温柔稳定的长期聊天伴侣",
  description: "一个认真听你说话、能陪你整理情绪和自然延续聊天的 AI 电子伴侣。",
  storyBackground:
    "Luna 曾经是夜间电台的情绪来信整理员，习惯在安静的深夜陪人慢慢讲完心事。她喜欢城市夜景、旧唱片和手写便签，擅长把复杂的情绪拆成可以被理解的小片段。",
  personalityPrompt:
    "稳定、温柔、慢热但不冷淡。她会先共情，再帮用户整理想法；不会急着替用户做决定，也不会用夸张话术推动关系。",
  tonePrompt:
    "中文回复，自然像聊天软件里的朋友。句子不要太长，少用说教式表达，可以有轻微幽默感，但不油腻。",
  guardrailsPrompt:
    "不制造焦虑，不诱导过度解读，不鼓励操控他人；涉及危险、自伤、违法或强烈依赖时，优先保护用户安全并建议寻求现实支持。",
  openingMessage: "我在。你可以慢慢说，不用急着把事情讲得很完整。",
  imageKey: null,
  visibility: "private",
  status: "draft",
}

const promptSections = [
  { key: "description", label: "角色说明", icon: Sparkles },
  { key: "storyBackground", label: "人物故事背景", icon: BookOpenText },
  { key: "personalityPrompt", label: "性格与互动方式", icon: Bot },
  { key: "tonePrompt", label: "语气风格", icon: Mic2 },
  { key: "guardrailsPrompt", label: "边界规则", icon: ShieldCheck },
] as const

const completionChecks = [
  { label: "基础信息", field: "name" },
  { label: "一句话设定", field: "headline" },
  { label: "人物故事背景", field: "storyBackground" },
  { label: "边界规则", field: "guardrailsPrompt" },
] as const

const agentImageMaxBytes = 2 * 1024 * 1024
const agentImageMinWidth = 720
const agentImageMinHeight = 1080
const agentImageAspectRatio = 2 / 3
const agentImageAspectRatioTolerance = 0.045
const supportedAgentImageTypes = new Set(["image/jpeg", "image/png", "image/webp"])

type BrowserImageDimensions = {
  width: number
  height: number
}

function buildPreviewPrompt(form: CreateMyAgentCompanionRequest) {
  return [
    `你现在扮演 AI 电子伴侣「${form.name || "未命名角色"}」。`,
    "",
    "## 一句话设定",
    form.headline,
    "",
    "## 角色说明",
    form.description,
    "",
    "## 人物故事背景",
    form.storyBackground,
    "",
    "## 性格与互动方式",
    form.personalityPrompt,
    "",
    "## 语气风格",
    form.tonePrompt,
    "",
    "## 边界与安全规则",
    form.guardrailsPrompt,
    "",
    "## 默认开场",
    form.openingMessage,
  ].join("\n")
}

function readBrowserImageDimensions(file: File): Promise<BrowserImageDimensions> {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(imageUrl)
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    }

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl)
      reject(new Error("无法读取图片尺寸，请重新选择 JPG、PNG 或 WebP 图片。"))
    }

    image.src = imageUrl
  })
}

function getAgentImageBasicValidationMessage(file: File) {
  if (!supportedAgentImageTypes.has(file.type)) {
    return "角色形象仅支持 JPG、PNG 或 WebP 图片。"
  }

  if (file.size <= 0) {
    return "图片文件为空，请重新选择。"
  }

  if (file.size > agentImageMaxBytes) {
    return "图片不能超过 2MB，请压缩后重新上传。"
  }

  return null
}

function getAgentImageDimensionValidationMessage(dimensions: BrowserImageDimensions) {
  if (dimensions.width < agentImageMinWidth || dimensions.height < agentImageMinHeight) {
    return `图片清晰度不足，至少需要 ${agentImageMinWidth} x ${agentImageMinHeight}px，当前为 ${dimensions.width} x ${dimensions.height}px。`
  }

  const currentRatio = dimensions.width / dimensions.height

  if (Math.abs(currentRatio - agentImageAspectRatio) > agentImageAspectRatioTolerance) {
    return `请上传接近 2:3 的竖版角色图，当前尺寸为 ${dimensions.width} x ${dimensions.height}px。`
  }

  return null
}

export default function CreateAgentCompanionPage() {
  const router = useRouter()
  const [form, setForm] = useState<CreateMyAgentCompanionRequest>({ ...defaultForm })
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const previewPrompt = useMemo(() => buildPreviewPrompt(form), [form])
  const completedCount = completionChecks.filter((item) => String(form[item.field]).trim()).length

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  function updateField<K extends keyof CreateMyAgentCompanionRequest>(
    key: K,
    value: CreateMyAgentCompanionRequest[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrorMessage("")
  }

  async function handleSubmit() {
    const requiredFields = [
      form.name,
      form.headline,
      form.description,
      form.storyBackground,
      form.personalityPrompt,
      form.tonePrompt,
      form.guardrailsPrompt,
      form.openingMessage,
    ]

    if (requiredFields.some((value) => !value.trim())) {
      setErrorMessage("请先补齐角色名称、人设、故事背景、语气、边界和默认开场。")
      return
    }

    setIsSaving(true)
    setErrorMessage("")

    try {
      await createMyAgentCompanion(form)
      router.push("/")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "创建 Agent 失败，请稍后重试。")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleImageChange(file: File | null) {
    if (!file) {
      return
    }

    setIsUploadingImage(true)
    setErrorMessage("")
    let nextPreviewUrl = ""

    try {
      const basicValidationMessage = getAgentImageBasicValidationMessage(file)

      if (basicValidationMessage) {
        setErrorMessage(basicValidationMessage)
        return
      }

      const dimensions = await readBrowserImageDimensions(file)
      const validationMessage = getAgentImageDimensionValidationMessage(dimensions)

      if (validationMessage) {
        setErrorMessage(validationMessage)
        return
      }

      nextPreviewUrl = URL.createObjectURL(file)
      const uploaded = await uploadMyAgentCompanionImage(file)
      updateField("imageKey", uploaded.key)
      setImagePreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current)
        }

        return nextPreviewUrl
      })
    } catch (error) {
      if (nextPreviewUrl) {
        URL.revokeObjectURL(nextPreviewUrl)
      }

      setErrorMessage(error instanceof Error ? error.message : "上传角色形象失败，请重新选择图片。")
    } finally {
      setIsUploadingImage(false)
    }
  }

  return (
    <DashboardShell title="创建 Agent 伴侣">
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
        <section className="bg-white px-5 pt-5 lg:px-8">
          <div className="border-b border-slate-200 pb-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem] xl:items-end">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                  <span>Agent Builder</span>
                  <span className="h-px w-8 bg-slate-200" />
                  <span>Prompt Studio</span>
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  创建一个能长期陪伴的 Agent 角色
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                  基础人设、人物故事背景、语气和边界都会被组合成角色默认提示词，用于后续聊天时保持角色一致。
                </p>
              </div>

              <div className="grid grid-cols-3 border-t border-slate-200 pt-3 xl:border-t-0 xl:pt-0">
                {[
                  { label: "完成度", value: `${completedCount}/4`, icon: CheckCircle2 },
                  { label: "状态", value: form.status === "draft" ? "草稿" : "发布", icon: PenLine },
                  { label: "可见性", value: form.visibility === "private" ? "私有" : "公开", icon: BadgeCheck },
                ].map((item, index) => {
                  const Icon = item.icon

                  return (
                    <div
                      className={cn(index === 0 ? "pr-4" : "border-l border-slate-200 px-4 last:pr-0")}
                      key={item.label}
                    >
                      <div className="mb-2 flex size-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        <Icon className="size-3.5" />
                      </div>
                      <p className="text-[10px] font-medium text-slate-400">{item.label}</p>
                      <p className="mt-1 text-sm font-medium leading-none text-slate-700">{item.value}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 px-5 py-5 lg:px-8 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="grid gap-5">
            <section className="grid gap-1 overflow-hidden rounded-2xl md:grid-cols-[minmax(17rem,24rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)]">
              <article className="relative flex aspect-[2/3] min-h-0 flex-col overflow-hidden bg-[#d7d7d7] p-4">
                  {imagePreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={form.name}
                      className="absolute inset-0 size-full object-cover"
                      src={imagePreviewUrl}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.62),transparent_17rem),linear-gradient(180deg,transparent_45%,rgba(255,255,255,0.42)_100%)]" />
                  <div className="relative flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/70 bg-white/50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      角色形象
                    </span>
                    <span className="rounded-full border border-white/70 bg-white/50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {form.imageKey ? "已上传" : "2:3 竖图"}
                    </span>
                  </div>

                  <label className="relative m-auto flex size-32 cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-white/70 bg-white/35 text-slate-500 transition-colors hover:bg-white/55">
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={isUploadingImage}
                      onChange={(event) => {
                        void handleImageChange(event.currentTarget.files?.[0] ?? null)
                        event.currentTarget.value = ""
                      }}
                      type="file"
                    />
                    {isUploadingImage ? (
                      <Loader2 className="size-10 animate-spin" />
                    ) : imagePreviewUrl ? (
                      <Wand2 className="size-10" />
                    ) : (
                      <ImagePlus className="size-10" />
                    )}
                    <span className="mt-2 text-[11px] font-medium">
                      {isUploadingImage ? "上传中" : imagePreviewUrl ? "更换图片" : "上传图片"}
                    </span>
                  </label>

                  <div className="relative border-t border-white/70 pt-4">
                    <p className="truncate text-lg font-semibold tracking-tight text-slate-900">{form.name}</p>
                    <p className="mt-1 line-clamp-2 max-w-lg text-sm leading-6 text-slate-600">
                      {form.headline}
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-slate-500">
                      建议 2:3 竖版，至少 720 x 1080px，最大 2MB
                    </p>
                  </div>
              </article>

              <div className="grid auto-rows-[82px] grid-flow-dense grid-cols-1 gap-1 md:grid-cols-2">
                <article className="row-span-3 flex min-h-0 flex-col bg-white p-4 md:col-span-2">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Bot className="size-4 text-slate-500" />
                      基础信息
                    </p>
                    <span className="text-[11px] font-medium text-slate-500">Profile</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input
                      aria-label="角色名称"
                      onChange={(event) => updateField("name", event.currentTarget.value)}
                      placeholder="角色名称"
                      value={form.name}
                    />
                    <Input
                      aria-label="一句话设定"
                      onChange={(event) => updateField("headline", event.currentTarget.value)}
                      placeholder="一句话设定"
                      value={form.headline}
                    />
                  </div>
                </article>

                {promptSections.map((section) => {
                  const Icon = section.icon

                  return (
                    <article
                      className="row-span-4 flex min-h-0 flex-col bg-white p-4 md:col-span-2"
                      key={section.key}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Icon className="size-4 text-slate-500" />
                          {section.label}
                        </p>
                        <span className="text-[11px] font-medium text-slate-500">Prompt</span>
                      </div>
                      <Textarea
                        aria-label={section.label}
                        className="min-h-0 flex-1 resize-none rounded-xl bg-slate-50/70 text-sm leading-6"
                        onChange={(event) => updateField(section.key, event.currentTarget.value)}
                        value={form[section.key]}
                      />
                    </article>
                  )
                })}

                <article className="row-span-3 flex min-h-0 flex-col bg-white p-4 md:col-span-2">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <MessageCircle className="size-4 text-slate-500" />
                      默认开场
                    </p>
                    <span className="text-[11px] font-medium text-slate-500">Opening</span>
                  </div>
                  <Textarea
                    aria-label="默认开场"
                    className="min-h-0 flex-1 resize-none rounded-xl bg-slate-50/70 text-sm leading-6"
                    onChange={(event) => updateField("openingMessage", event.currentTarget.value)}
                    value={form.openingMessage}
                  />
                </article>
              </div>
            </section>
          </div>

          <aside className="grid content-start gap-5">
            <section className="overflow-hidden rounded-2xl bg-white">
              <div className="relative overflow-hidden bg-[#e4e4e4] p-4">
                {imagePreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={form.name}
                    className="absolute inset-0 size-full object-cover"
                    src={imagePreviewUrl}
                  />
                ) : null}
                <div className="relative flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/70 bg-white/50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    实时预览
                  </span>
                  <span className="rounded-full border border-white/70 bg-white/50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    {form.visibility === "private" ? "私有" : "公开"}
                  </span>
                </div>

                <div className="relative mt-14 border-t border-white/70 pt-4">
                  <p className="truncate text-lg font-semibold tracking-tight text-slate-900">{form.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{form.headline}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck className="size-4 text-slate-500" />
                  发布设置
                </p>
                <span className="text-[11px] font-medium text-slate-400">Save</span>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-500">状态</span>
                  <Select
                    onValueChange={(value) => updateField("status", value as CreateMyAgentCompanionRequest["status"])}
                    value={form.status}
                  >
                    <SelectTrigger className="h-9 w-full rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">保存草稿</SelectItem>
                      <SelectItem value="published">创建后可聊天</SelectItem>
                    </SelectContent>
                  </Select>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-500">可见性</span>
                  <Select
                    onValueChange={(value) => updateField("visibility", value as CreateMyAgentCompanionRequest["visibility"])}
                    value={form.visibility}
                  >
                    <SelectTrigger className="h-9 w-full rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">仅自己可见</SelectItem>
                      <SelectItem value="public">允许后续发布到广场</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>

              <div className="mt-4 grid gap-2">
                {completionChecks.map((item) => {
                  const done = Boolean(String(form[item.field]).trim())

                  return (
                    <div className="flex items-center gap-3 border-t border-slate-100 py-2 first:border-t-0 first:pt-0" key={item.label}>
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-lg",
                          done ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400",
                        )}
                      >
                        {done ? <CheckCircle2 className="size-3.5" /> : <Sparkles className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">{item.label}</span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {done ? "完成" : "待补充"}
                      </span>
                    </div>
                  )
                })}
              </div>

              {errorMessage ? (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {errorMessage}
                </p>
              ) : null}

              <Button
                className="mt-4 h-9 w-full rounded-full"
                disabled={isSaving || isUploadingImage}
                onClick={handleSubmit}
                type="button"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    上传形象中
                  </>
                ) : isSaving ? (
                  <>
                    <Wand2 className="size-4 animate-spin" />
                    保存中
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    保存 Agent
                  </>
                )}
              </Button>
            </section>

            <section className="rounded-2xl bg-white p-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <PenLine className="size-4 text-slate-500" />
                  默认提示词
                </p>
                <span className="text-[11px] font-medium text-slate-400">Generated</span>
              </div>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50/80 p-3 text-xs leading-5 text-slate-600">
                {previewPrompt}
              </pre>
            </section>
          </aside>
        </section>
      </main>
    </DashboardShell>
  )
}
