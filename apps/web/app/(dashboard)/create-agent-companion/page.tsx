import {
  BadgeCheck,
  Bot,
  Brain,
  CheckCircle2,
  CirclePlus,
  Heart,
  ImagePlus,
  LockKeyhole,
  MessageCircle,
  Mic2,
  Palette,
  PenLine,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react"

import { DashboardShell } from "../_components/dashboard-shell"

const builderStats = [
  { label: "完成度", value: "62%", icon: CheckCircle2 },
  { label: "边界", value: "安全", icon: ShieldCheck },
  { label: "状态", value: "草稿", icon: PenLine },
]

const studioTabs = [
  { label: "画布", meta: "角色全貌" },
  { label: "人设", meta: "基础设定" },
  { label: "语气", meta: "表达样本" },
  { label: "边界", meta: "安全规则" },
  { label: "预览", meta: "发布前检查" },
]

const toneOptions = ["温柔稳定", "轻松幽默", "直球清醒", "慢热陪伴", "主动带节奏"]

const sliders = [
  { label: "共情", value: "82%", widthClassName: "w-[82%]" },
  { label: "主动", value: "68%", widthClassName: "w-[68%]" },
  { label: "边界感", value: "76%", widthClassName: "w-[76%]" },
  { label: "幽默感", value: "58%", widthClassName: "w-[58%]" },
]

const modes = [
  { label: "自然开场", icon: MessageCircle },
  { label: "关系复盘", icon: Brain },
  { label: "情绪陪伴", icon: Heart },
]

const guardrails = ["不替用户做重大决定", "避免操控式话术", "尊重对方边界", "不制造焦虑"]

const voiceSamples = [
  "我先帮你把想法整理清楚。",
  "这句话可以更轻一点，不用急着确认关系。",
  "你可以保留主动，但别把压力递给对方。",
]

const previewMessages = [
  {
    name: "你",
    avatar: "我",
    role: "user",
    message: "我想自然一点开启聊天，不想太用力。",
  },
  {
    name: "星野 Luna",
    avatar: "L",
    role: "agent",
    message: "那我们先从一个轻松但有回应空间的开场开始。",
  },
  {
    name: "星野 Luna",
    avatar: "L",
    role: "agent",
    message: "比如：刚才看到一个很像你会喜欢的小东西，突然想到你。",
  },
]

const publishChecks = [
  { label: "基础信息", done: true },
  { label: "形象占位", done: true },
  { label: "边界规则", done: true },
  { label: "开场样本", done: false },
]

export default function CreateAgentCompanionPage() {
  return (
    <DashboardShell title="创建 Agent 伴侣">
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
        <section className="bg-white px-5 pt-5 lg:px-8">
          <div className="border-b border-slate-200 pb-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end">
              <div className="flex min-w-0 gap-4">
                <div className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 sm:flex">
                  <Bot className="size-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                    <span>角色创建台</span>
                    <span className="h-px w-8 bg-slate-200" />
                    <span>Studio</span>
                  </div>
                  <p className="mt-2 max-w-xl text-[15px] font-normal leading-7 text-slate-600">
                    把一个适合长期聊天的 AI 伴侣，从形象、人设、语气和边界里慢慢拼出来。
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <BadgeCheck className="size-3.5" />
                      可发布到广场
                    </span>
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <Brain className="size-3.5" />
                      支持长期记忆
                    </span>
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <ShieldCheck className="size-3.5" />
                      边界校验
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-slate-200 pt-3 lg:border-t-0 lg:pt-0">
                {builderStats.map((item, index) => {
                  const Icon = item.icon

                  return (
                    <div
                      className={index === 0 ? "pr-4" : "border-l border-slate-200 px-4 last:pr-0"}
                      key={item.label}
                    >
                      <div className="mb-2 flex size-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        <Icon className="size-3.5" />
                      </div>
                      <p className="text-[10px] font-medium text-slate-400">{item.label}</p>
                      <p className="mt-1 text-sm font-medium leading-none text-slate-600">{item.value}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-5 lg:px-8">
          <div className="flex flex-col gap-1.5 lg:h-10 lg:flex-row lg:items-center">
            <label className="flex h-9 min-w-0 items-center gap-2 rounded-xl bg-slate-50/80 px-2.5 ring-1 ring-inset ring-slate-200/70 transition-colors focus-within:bg-white lg:w-80">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md text-slate-500">
                <Search className="size-3.5" />
              </span>
              <input
                aria-label="搜索创建模块"
                className="h-8 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="搜索模块、语气或角色关键词"
              />
            </label>

            <div className="hidden h-5 w-px shrink-0 bg-slate-200 lg:block" />

            <div className="flex h-9 min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {studioTabs.map((tab, index) => (
                <button
                  className={
                    index === 0
                      ? "relative flex h-8 shrink-0 items-center rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-950 after:absolute after:inset-x-3 after:bottom-1 after:h-px after:bg-slate-400"
                      : "flex h-8 shrink-0 items-center rounded-lg px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  }
                  key={tab.label}
                  title={tab.meta}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              type="button"
            >
              <Send className="size-4" />
              保存草稿
            </button>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="overflow-hidden rounded-2xl">
              <div className="grid auto-rows-[78px] grid-flow-dense grid-cols-1 gap-1 md:grid-cols-2 2xl:grid-cols-4">
                <article className="relative row-span-6 flex min-h-0 flex-col overflow-hidden bg-[#d8d8d8] p-4 md:col-span-2">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.68),transparent_17rem),linear-gradient(180deg,transparent_42%,rgba(255,255,255,0.38)_100%)]" />
                  <div className="relative flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/70 bg-white/50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      角色形象
                    </span>
                    <span className="rounded-full border border-white/70 bg-white/50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      占位图
                    </span>
                  </div>

                  <div className="relative m-auto flex size-28 items-center justify-center rounded-[2rem] border border-white/70 bg-white/35 text-slate-500">
                    <ImagePlus className="size-10" />
                  </div>

                  <div className="relative border-t border-white/70 pt-4">
                    <p className="text-lg font-semibold tracking-tight text-slate-900">星野 Luna</p>
                    <p className="mt-1 max-w-lg text-sm leading-6 text-slate-600">
                      稳定、温柔、擅长自然延续暧昧聊天的 AI 伴侣。
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/70 bg-white/55 px-3 text-xs font-medium text-slate-700 hover:bg-white/75"
                        type="button"
                      >
                        <Upload className="size-3.5" />
                        上传形象
                      </button>
                      <button
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/70 bg-white/55 px-3 text-xs font-medium text-slate-700 hover:bg-white/75"
                        type="button"
                      >
                        <Wand2 className="size-3.5" />
                        生成形象
                      </button>
                    </div>
                  </div>
                </article>

                <article className="row-span-3 flex min-h-0 flex-col bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Palette className="size-4 text-slate-500" />
                      基础人设
                    </p>
                    <span className="text-[11px] font-medium text-slate-500">Profile</span>
                  </div>
                  <div className="mt-auto space-y-2">
                    <input
                      aria-label="角色名称"
                      className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:bg-white"
                      defaultValue="星野 Luna"
                    />
                    <input
                      aria-label="一句话设定"
                      className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:bg-white"
                      defaultValue="温柔稳定的聊天伴侣"
                    />
                  </div>
                </article>

                <article className="row-span-3 flex min-h-0 flex-col bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Sparkles className="size-4 text-slate-500" />
                      角色说明
                    </p>
                    <span className="text-[11px] font-medium text-slate-500">Bio</span>
                  </div>
                  <textarea
                    aria-label="角色说明"
                    className="mt-3 min-h-0 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm leading-6 text-slate-700 outline-none focus:bg-white"
                    defaultValue="像一个认真听你说话的朋友，帮你整理情绪、调整回复语气，并给出更自然的关系推进建议。"
                  />
                </article>

                <article className="row-span-4 flex min-h-0 flex-col bg-white p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <SlidersHorizontal className="size-4 text-slate-500" />
                      性格参数
                    </p>
                    <span className="text-[11px] font-medium text-slate-500">Personality</span>
                  </div>
                  <div className="grid gap-3">
                    {sliders.map((item) => (
                      <div key={item.label}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">{item.label}</span>
                          <span className="text-slate-500">{item.value}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100">
                          <div className={`${item.widthClassName} h-full rounded-full bg-slate-900`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="row-span-4 flex min-h-0 flex-col bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Mic2 className="size-4 text-slate-500" />
                      语气样本
                    </p>
                    <span className="text-[11px] font-medium text-slate-500">Voice</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {voiceSamples.map((line) => (
                      <p
                        className="rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm leading-6 text-slate-700"
                        key={line}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </article>

                <article className="row-span-3 flex min-h-0 flex-col bg-white p-4 md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <MessageCircle className="size-4 text-slate-500" />
                      互动模式
                    </p>
                    <span className="text-[11px] font-medium text-slate-500">Modes</span>
                  </div>
                  <div className="mt-auto grid gap-2 sm:grid-cols-3">
                    {modes.map((mode, index) => {
                      const Icon = mode.icon

                      return (
                        <button
                          className={
                            index === 0
                              ? "flex h-12 items-center gap-2 rounded-xl border border-slate-950 bg-slate-950 px-3 text-left text-xs font-semibold text-white"
                              : "flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-left text-xs font-medium text-slate-700 hover:bg-white"
                          }
                          key={mode.label}
                          type="button"
                        >
                          <Icon className={index === 0 ? "size-4 shrink-0 text-white" : "size-4 shrink-0 text-slate-500"} />
                          {mode.label}
                        </button>
                      )
                    })}
                  </div>
                </article>

                <article className="row-span-3 flex min-h-0 flex-col bg-white p-4 md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <LockKeyhole className="size-4 text-slate-500" />
                      互动边界
                    </p>
                    <span className="text-[11px] font-medium text-slate-500">Guardrails</span>
                  </div>
                  <div className="mt-auto grid gap-2 sm:grid-cols-2">
                    {guardrails.map((item) => (
                      <div
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700"
                        key={item}
                      >
                        <CheckCircle2 className="size-3.5 shrink-0 text-slate-600" />
                        {item}
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>

            <aside className="grid gap-5">
              <section className="overflow-hidden rounded-2xl bg-white">
                <div className="bg-[#e7e7e7] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/70 bg-white/50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      预览卡片
                    </span>
                    <span className="rounded-full border border-white/70 bg-white/50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      草稿
                    </span>
                  </div>

                  <div className="mt-14 border-t border-white/70 pt-4">
                    <p className="text-lg font-semibold tracking-tight text-slate-900">星野 Luna</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      温柔、稳定、擅长陪你复盘情绪和延续暧昧聊天。
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {toneOptions.slice(0, 3).map((tone) => (
                        <span
                          className="rounded-full border border-white/70 bg-white/45 px-2 py-1 text-[11px] font-medium text-slate-700"
                          key={tone}
                        >
                          {tone}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <MessageCircle className="size-4 text-slate-500" />
                    对话预览
                  </p>
                  <span className="text-[11px] font-medium text-slate-400">Live sample</span>
                </div>

                <div className="mt-4 space-y-3">
                  {previewMessages.map((message, index) => {
                    const isUser = message.role === "user"

                    return (
                      <div
                        className={isUser ? "flex flex-row-reverse items-end gap-2.5" : "flex items-end gap-2.5"}
                        key={`${message.name}-${index}`}
                      >
                        <span
                          className={
                            isUser
                              ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white"
                              : "flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
                          }
                        >
                          {message.avatar}
                        </span>
                        <p
                          className={
                            isUser
                              ? "max-w-[82%] rounded-2xl rounded-br-md bg-slate-900 px-3 py-2.5 text-sm leading-6 text-white"
                              : "max-w-[82%] rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2.5 text-sm leading-6 text-slate-700"
                          }
                        >
                          {message.message}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CirclePlus className="size-4 text-slate-500" />
                    发布检查
                  </p>
                  <span className="text-[11px] font-medium text-slate-400">4 项</span>
                </div>

                <div className="mt-4 grid gap-2">
                  {publishChecks.map((item) => (
                    <div className="flex items-center gap-3 border-t border-slate-100 py-2 first:border-t-0 first:pt-0" key={item.label}>
                      <span
                        className={
                          item.done
                            ? "flex size-6 items-center justify-center rounded-lg bg-slate-900 text-white"
                            : "flex size-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400"
                        }
                      >
                        {item.done ? <CheckCircle2 className="size-3.5" /> : <Sparkles className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">{item.label}</span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {item.done ? "完成" : "待补充"}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  type="button"
                >
                  <Send className="size-4" />
                  准备发布
                </button>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </DashboardShell>
  )
}
