import {
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Heart,
  MessageCircle,
  Mic2,
  Palette,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"

import { DashboardShell } from "../_components/dashboard-shell"

const creationSteps = [
  { label: "角色基础", status: "已完成" },
  { label: "性格设定", status: "编辑中" },
  { label: "互动边界", status: "待完善" },
  { label: "发布预览", status: "待确认" },
]

const toneOptions = ["温柔稳定", "轻松幽默", "直球清醒", "慢热陪伴", "主动带节奏"]

const modeCards = [
  {
    title: "自然开场",
    text: "为用户生成低压力、容易接住的第一句话。",
    icon: MessageCircle,
  },
  {
    title: "关系复盘",
    text: "整理聊天线索、关系距离和下一步表达策略。",
    icon: Brain,
  },
  {
    title: "情绪陪伴",
    text: "先接住情绪，再给出更稳妥的表达建议。",
    icon: Heart,
  },
]

const guardrails = ["不替用户做重大决定", "避免操控式话术", "尊重对方边界", "不制造焦虑"]

const sliders = [
  { label: "共情", value: "82%", widthClassName: "w-[82%]" },
  { label: "主动", value: "68%", widthClassName: "w-[68%]" },
  { label: "边界感", value: "76%", widthClassName: "w-[76%]" },
  { label: "幽默感", value: "58%", widthClassName: "w-[58%]" },
]

export default function CreateAgentCompanionPage() {
  return (
    <DashboardShell title="创建 Agent 伴侣">
      <main className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_32rem),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <section className="border-b bg-white/90 px-5 py-5 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-700">
                <Bot className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                  Agent companion builder
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  创建一个可以长期陪伴和聊天的 AI 角色
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  设置人设、语气、边界和互动模式，生成可发布到角色广场的 Agent 伴侣。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-white xl:min-w-96">
              <div className="border-r border-slate-200 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  完成度
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">62%</p>
              </div>
              <div className="border-r border-slate-200 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-blue-600" />
                  边界
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">安全</p>
              </div>
              <div className="px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Sparkles className="size-3.5 text-violet-600" />
                  预览
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">草稿</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-5 lg:px-8">
          <div className="grid gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
            <aside className="flex flex-col gap-5">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">创建流程</p>
                  <p className="mt-1 text-xs text-muted-foreground">按顺序完成核心设定</p>
                </div>
                <div className="divide-y divide-slate-200">
                  {creationSteps.map((step, index) => (
                    <div className="flex items-center gap-3 px-4 py-3" key={step.label}>
                      <span
                        className={
                          index === 1
                            ? "flex size-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white"
                            : "flex size-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500"
                        }
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-950">{step.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{step.status}</p>
                      </div>
                      <ChevronRight className="size-4 text-slate-300" />
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-3">
                <div className="relative min-h-[420px] overflow-hidden rounded-2xl bg-[#d8d8d8]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.58),transparent_16rem),linear-gradient(180deg,transparent_55%,rgba(255,255,255,0.5)_100%)]" />
                  <div className="absolute left-5 top-5 flex items-center gap-2">
                    <span className="rounded-full border border-white/70 bg-white/45 px-3 py-1 text-[11px] font-medium text-slate-600">
                      形象预览
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                      草稿
                    </span>
                  </div>
                  <div className="absolute inset-x-6 bottom-6 border-t border-white/70 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Preview</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      当前使用占位形象，后续可上传角色图片或使用生成图。
                    </p>
                  </div>
                </div>
              </section>
            </aside>

            <div className="grid gap-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <Palette className="size-4 text-violet-600" />
                    基础人设
                  </p>
                  <span className="text-[11px] font-medium text-muted-foreground">Basic profile</span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">角色名称</span>
                    <input
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-950 outline-none transition-colors focus:bg-white"
                      defaultValue="星野 Luna"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">一句话设定</span>
                    <input
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-950 outline-none transition-colors focus:bg-white"
                      defaultValue="稳定、温柔、擅长自然延续暧昧聊天"
                    />
                  </label>
                </div>

                <label className="mt-4 block">
                  <span className="text-xs font-medium text-slate-500">角色说明</span>
                  <textarea
                    className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition-colors focus:bg-white"
                    defaultValue="像一个认真听你说话的朋友，能帮你整理情绪、调整回复语气，并给出更自然的关系推进建议。"
                  />
                </label>
              </section>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <SlidersHorizontal className="size-4 text-blue-600" />
                      性格参数
                    </p>
                    <span className="text-[11px] font-medium text-muted-foreground">Personality</span>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {sliders.map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-600">{item.label}</span>
                          <span className="text-muted-foreground">{item.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className={`${item.widthClassName} h-full rounded-full bg-slate-950`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {toneOptions.map((tone, index) => (
                      <button
                        className={
                          index === 0
                            ? "h-8 rounded-full border border-slate-950 bg-slate-950 px-3 text-xs font-medium text-white"
                            : "h-8 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        }
                        key={tone}
                        type="button"
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <Mic2 className="size-4 text-rose-600" />
                    语气样本
                  </p>
                  <div className="mt-4 space-y-3">
                    {[
                      "我先帮你把想法整理清楚。",
                      "这句话可以更轻一点，不用急着确认关系。",
                      "你可以保留主动，但别把压力递给对方。",
                    ].map((line) => (
                      <p className="rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700" key={line}>
                        {line}
                      </p>
                    ))}
                  </div>
                </section>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <MessageCircle className="size-4 text-blue-600" />
                    互动模式
                  </p>
                  <span className="text-[11px] font-medium text-muted-foreground">Mode presets</span>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {modeCards.map((mode, index) => {
                    const Icon = mode.icon

                    return (
                      <div
                        className={
                          index === 0
                            ? "rounded-2xl border border-violet-200 bg-violet-50/70 p-4"
                            : "rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                        }
                        key={mode.title}
                      >
                        <span
                          className={
                            index === 0
                              ? "flex size-9 items-center justify-center rounded-full bg-white text-violet-700"
                              : "flex size-9 items-center justify-center rounded-full bg-white text-slate-600"
                          }
                        >
                          <Icon className="size-4" />
                        </span>
                        <p className="mt-4 text-sm font-semibold text-slate-950">{mode.title}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{mode.text}</p>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    互动边界
                  </p>
                  <span className="text-[11px] font-medium text-muted-foreground">Guardrails</span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {guardrails.map((item) => (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3" key={item}>
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-3 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">准备发布到角色广场</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      发布前可以继续完善形象、开场白和边界说明。
                    </p>
                  </div>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                    type="button"
                  >
                    <Send className="size-4" />
                    保存草稿
                  </button>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
    </DashboardShell>
  )
}
