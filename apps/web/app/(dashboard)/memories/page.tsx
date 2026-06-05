import {
  BadgeCheck,
  Bot,
  Brain,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Heart,
  LockKeyhole,
  MessageCircle,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react"

import { DashboardShell } from "../_components/dashboard-shell"

const memories = [
  {
    title: "喜欢被直接但温柔地提醒",
    type: "偏好",
    source: "星野 Luna",
    scope: "全部伴侣可用",
    confidence: "高",
    updatedAt: "刚刚",
    content: "用户更接受直接、清晰但语气柔和的建议，不喜欢过度铺垫。",
    pinned: true,
  },
  {
    title: "睡前聊天需要低压节奏",
    type: "场景",
    source: "眠眠",
    scope: "指定伴侣",
    confidence: "中",
    updatedAt: "12 分钟前",
    content: "睡前更适合安静、短句、少提问的陪伴方式。",
    pinned: false,
  },
  {
    title: "正在练习主动表达好感",
    type: "关系目标",
    source: "Noah",
    scope: "全部伴侣可用",
    confidence: "高",
    updatedAt: "今天",
    content: "用户希望表达主动，但需要避免显得太用力或给对方压力。",
    pinned: true,
  },
  {
    title: "不喜欢操控式聊天建议",
    type: "边界",
    source: "系统",
    scope: "全局规则",
    confidence: "高",
    updatedAt: "昨天",
    content: "所有 Agent 伴侣都应避免制造焦虑、操控对方或诱导过度解读。",
    pinned: false,
  },
]

const pendingMemories = [
  "你似乎更喜欢短句回复，而不是长段解释。",
  "你在关系推进前通常会先确认对方是否舒服。",
  "你倾向于把重要聊天留到晚上处理。",
]

const memoryStats = [
  { label: "全部记忆", value: "86", icon: Brain },
  { label: "已确认", value: "72", icon: BadgeCheck },
  { label: "待确认", value: "14", icon: Clock3 },
]

const filters = ["全部", "偏好", "边界", "关系目标", "场景", "待确认"]

const categories = [
  { label: "偏好", value: "24", icon: Heart },
  { label: "边界", value: "18", icon: ShieldCheck },
  { label: "对话风格", value: "21", icon: MessageCircle },
  { label: "关系目标", value: "13", icon: Star },
]

export default function MemoriesPage() {
  const selectedMemory = memories[0]!
  const selectedMemoryMeta = [
    { label: "来源", value: selectedMemory.source, icon: Bot },
    { label: "范围", value: selectedMemory.scope, icon: Eye },
    { label: "置信度", value: selectedMemory.confidence, icon: ShieldCheck },
  ]

  return (
    <DashboardShell title="记忆库">
      <main className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_32rem),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <section className="border-b bg-white/90 px-5 py-5 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-700">
                <Brain className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                  Memory library
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  管理 Agent 伴侣可以使用的长期记忆
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  查看、确认、编辑和删除偏好、边界、关系目标与聊天风格，让长期陪伴保持可控。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-white xl:min-w-96">
              {memoryStats.map((item, index) => {
                const Icon = item.icon

                return (
                  <div
                    className={index === 2 ? "px-3 py-2.5" : "border-r border-slate-200 px-3 py-2.5"}
                    key={item.label}
                  >
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <Icon className="size-3.5 text-slate-500" />
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">{item.value}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="px-5 py-5 lg:px-8">
          <div className="mb-5 flex flex-col gap-3 lg:h-10 lg:flex-row lg:items-center">
            <label className="flex h-9 min-w-0 items-center gap-2 rounded-xl bg-white px-2.5 ring-1 ring-inset ring-slate-200 transition-colors focus-within:bg-slate-50/70 lg:w-80">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md text-slate-500">
                <Search className="size-3.5" />
              </span>
              <input
                aria-label="搜索记忆"
                className="h-8 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="搜索偏好、边界或来源角色"
              />
            </label>

            <div className="hidden h-5 w-px shrink-0 bg-slate-200 lg:block" />

            <div className="flex h-9 min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {filters.map((filter, index) => (
                <button
                  className={
                    index === 0
                      ? "relative flex h-8 shrink-0 items-center rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-950 after:absolute after:inset-x-3 after:bottom-1 after:h-px after:bg-slate-400"
                      : "flex h-8 shrink-0 items-center rounded-lg px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  }
                  key={filter}
                  type="button"
                >
                  {filter}
                </button>
              ))}
            </div>

            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              type="button"
            >
              <Filter className="size-3.5" />
              高级筛选
            </button>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.72fr)_minmax(0,1fr)_21rem]">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">记忆列表</p>
                  <span className="text-xs font-medium text-muted-foreground">{memories.length} 条</span>
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {memories.map((memory, index) => (
                  <article
                    className={
                      index === 0
                        ? "relative bg-slate-100/80 px-4 py-4"
                        : "bg-white px-4 py-4 transition-colors hover:bg-slate-50"
                    }
                    key={memory.title}
                  >
                    {index === 0 ? <span className="absolute inset-y-0 left-0 w-1 bg-slate-950" /> : null}

                    <div className="flex items-start gap-3">
                      <span
                        className={
                          index === 0
                            ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white"
                            : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                        }
                      >
                        <Brain className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-sm font-semibold text-slate-950">{memory.title}</h2>
                          {memory.pinned ? <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" /> : null}
                          <span className="ml-auto shrink-0 text-[11px] font-medium text-muted-foreground">
                            {memory.updatedAt}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{memory.content}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className="inline-flex h-6 items-center rounded-full border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600">
                            {memory.type}
                          </span>
                          <span className="inline-flex h-6 items-center rounded-full border border-blue-200 bg-blue-50 px-2 text-[11px] font-medium text-blue-700">
                            {memory.scope}
                          </span>
                          <span className="inline-flex h-6 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-medium text-emerald-700">
                            置信度 {memory.confidence}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <Sparkles className="size-4 text-violet-600" />
                      记忆详情
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">当前选中的长期记忆</p>
                  </div>
                  <button
                    aria-label="更多记忆操作"
                    className="flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    type="button"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{selectedMemory.type}</p>
                  <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">{selectedMemory.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{selectedMemory.content}</p>
                </div>

                <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200">
                  {selectedMemoryMeta.map((item, index) => {
                    const Icon = item.icon

                    return (
                      <div
                        className={index === 2 ? "px-3 py-3" : "border-r border-slate-200 px-3 py-3"}
                        key={item.label}
                      >
                        <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                          <Icon className="size-3.5 text-slate-500" />
                          {item.label}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-950">{item.value}</p>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                    type="button"
                  >
                    <CheckCircle2 className="size-4" />
                    确认记忆
                  </button>
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    type="button"
                  >
                    <LockKeyhole className="size-4" />
                    限制范围
                  </button>
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                    type="button"
                  >
                    <Trash2 className="size-4" />
                    删除
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <MessageCircle className="size-4 text-blue-600" />
                    来源片段
                  </p>
                  <span className="text-[11px] font-medium text-muted-foreground">Conversation source</span>
                </div>
                <div className="space-y-3">
                  <p className="rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                    我希望你直接告诉我怎么说，但语气不要太硬。
                  </p>
                  <p className="ml-auto max-w-[82%] rounded-2xl rounded-tr-md border border-slate-950 bg-slate-950 px-4 py-3 text-sm leading-6 text-white">
                    明白，我会给你清楚的建议，同时保留温柔和分寸。
                  </p>
                </div>
              </section>
            </section>

            <aside className="flex flex-col gap-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Clock3 className="size-4 text-blue-600" />
                  待确认记忆
                </p>
                <div className="mt-4 space-y-3">
                  {pendingMemories.map((memory) => (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3" key={memory}>
                      <p className="text-sm leading-6 text-slate-600">{memory}</p>
                      <div className="mt-2 flex gap-2">
                        <button className="h-7 rounded-full bg-slate-950 px-3 text-xs font-medium text-white" type="button">
                          确认
                        </button>
                        <button className="h-7 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600" type="button">
                          忽略
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  分类概览
                </p>
                <div className="mt-4 grid gap-2">
                  {categories.map((category) => {
                    const Icon = category.icon

                    return (
                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3" key={category.label}>
                        <Icon className="size-4 text-slate-500" />
                        <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">{category.label}</span>
                        <span className="text-sm font-semibold text-slate-950">{category.value}</span>
                      </div>
                    )
                  })}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </DashboardShell>
  )
}
