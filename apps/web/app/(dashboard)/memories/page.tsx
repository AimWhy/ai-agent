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
    spanClassName: "row-span-3 md:col-span-2",
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
    spanClassName: "row-span-3",
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
    spanClassName: "row-span-4",
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
    spanClassName: "row-span-3 md:col-span-2 2xl:col-span-1",
  },
  {
    title: "重要聊天适合先写草稿",
    type: "对话风格",
    source: "林澈",
    scope: "全部伴侣可用",
    confidence: "中",
    updatedAt: "本周",
    content: "面对重要关系对话时，用户更希望先整理草稿，再决定是否发送。",
    pinned: false,
    spanClassName: "row-span-3",
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

const filters = [
  { label: "全部", meta: "86 条" },
  { label: "偏好", meta: "24 条" },
  { label: "边界", meta: "18 条" },
  { label: "关系目标", meta: "13 条" },
  { label: "场景", meta: "10 条" },
  { label: "待确认", meta: "14 条" },
]

const categories = [
  { label: "偏好", value: "24", icon: Heart },
  { label: "边界", value: "18", icon: ShieldCheck },
  { label: "对话风格", value: "21", icon: MessageCircle },
  { label: "关系目标", value: "13", icon: Star },
]

const sourceConversation = [
  {
    name: "你",
    avatar: "我",
    role: "user",
    message: "我想回她，但不知道怎么说才不会显得太紧张。",
  },
  {
    name: "星野 Luna",
    avatar: "L",
    role: "agent",
    message: "先不用把情绪解释得太完整，可以只回应一个轻松的点，让对话继续自然流动。",
  },
  {
    name: "你",
    avatar: "我",
    role: "user",
    message: "我希望你直接告诉我怎么说，但语气不要太硬。",
  },
  {
    name: "星野 Luna",
    avatar: "L",
    role: "agent",
    message: "明白。我会给你清楚的建议，同时保留温柔和分寸，不让对方觉得被推进。",
  },
  {
    name: "你",
    avatar: "我",
    role: "user",
    message: "对，我不喜欢那种特别套路、像在控制别人的话术。",
  },
  {
    name: "星野 Luna",
    avatar: "L",
    role: "agent",
    message: "那我会把建议收束在真实表达上：短一点、清楚一点，但不给对方压力。",
  },
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
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
        <section className="bg-white px-5 pt-5 lg:px-8">
          <div className="border-b border-slate-200 pb-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end">
              <div className="flex min-w-0 gap-4">
                <div className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 sm:flex">
                  <Brain className="size-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                    <span>记忆库</span>
                    <span className="h-px w-8 bg-slate-200" />
                    <span>Memory library</span>
                  </div>
                  <p className="mt-2 max-w-xl text-[15px] font-normal leading-7 text-slate-600">
                    管理 Agent 伴侣可以使用的长期记忆，让偏好、边界和关系目标保持清晰可控。
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <BadgeCheck className="size-3.5" />
                      用户确认
                    </span>
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <Bot className="size-3.5" />
                      伴侣共享
                    </span>
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <ShieldCheck className="size-3.5" />
                      边界可控
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-slate-200 pt-3 lg:border-t-0 lg:pt-0">
                {memoryStats.map((item, index) => {
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
                  key={filter.label}
                  title={filter.meta}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <button
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              type="button"
            >
              <Filter className="size-4" />
              高级筛选
            </button>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="overflow-hidden rounded-2xl">
              <div className="grid auto-rows-[86px] grid-flow-dense grid-cols-1 gap-1 md:grid-cols-2 2xl:grid-cols-4">
                {memories.map((memory, index) => (
                  <article
                    className={`${memory.spanClassName} relative flex min-h-0 flex-col bg-white p-4 transition-colors hover:bg-slate-50`}
                    key={memory.title}
                  >
                    {index === 0 ? <span className="absolute inset-x-4 top-0 h-px bg-slate-900" /> : null}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={
                            index === 0
                              ? "flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white"
                              : "flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                          }
                        >
                          <Brain className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{memory.title}</p>
                          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                            {memory.source} · {memory.updatedAt}
                          </p>
                        </div>
                      </div>
                      {memory.pinned ? <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" /> : null}
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{memory.content}</p>

                    <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
                      <span className="inline-flex h-6 items-center rounded-full bg-slate-100 px-2 text-[11px] font-medium text-slate-600">
                        {memory.type}
                      </span>
                      <span className="inline-flex h-6 items-center rounded-full bg-slate-100 px-2 text-[11px] font-medium text-slate-500">
                        {memory.scope}
                      </span>
                      <span className="ml-auto inline-flex h-6 items-center rounded-full bg-slate-950 px-2 text-[11px] font-medium text-white">
                        {memory.confidence}
                      </span>
                    </div>
                  </article>
                ))}

                <article className="row-span-6 flex min-h-0 flex-col bg-white p-4 md:col-span-2 2xl:col-span-2">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <MessageCircle className="size-4 text-slate-500" />
                      来源片段
                    </p>
                    <span className="text-[11px] font-medium text-slate-400">Conversation source</span>
                  </div>

                  <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-hidden">
                    {sourceConversation.map((message, index) => {
                      const isUser = message.role === "user"

                      return (
                        <div
                          className={isUser ? "flex flex-row-reverse items-end gap-2.5" : "flex items-end gap-2.5"}
                          key={`${message.name}-${index}`}
                        >
                          <span
                            className={
                              isUser
                                ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white"
                                : "flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
                            }
                          >
                            {message.avatar}
                          </span>
                          <div className={isUser ? "max-w-[82%] text-right" : "max-w-[82%]"}>
                            <p className="mb-1 px-1 text-[11px] font-medium text-slate-400">{message.name}</p>
                            <p
                              className={
                                isUser
                                  ? "rounded-2xl rounded-br-md bg-slate-950 px-3 py-2.5 text-left text-sm leading-6 text-white"
                                  : "rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2.5 text-sm leading-6 text-slate-700"
                              }
                            >
                              {message.message}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </article>
              </div>
            </section>

            <aside className="grid gap-5">
              <section className="rounded-2xl bg-white p-4">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <Sparkles className="size-4 text-slate-500" />
                      当前记忆
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Selected memory</p>
                  </div>
                  <button
                    aria-label="更多记忆操作"
                    className="flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    type="button"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>

                <div className="py-4">
                  <p className="text-[11px] font-medium text-slate-400">{selectedMemory.type}</p>
                  <h2 className="mt-2 text-base font-semibold tracking-tight text-slate-950">
                    {selectedMemory.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{selectedMemory.content}</p>
                </div>

                <div className="grid grid-cols-3 border-y border-slate-200">
                  {selectedMemoryMeta.map((item, index) => {
                    const Icon = item.icon

                    return (
                      <div
                        className={index === 2 ? "px-3 py-3" : "border-r border-slate-200 px-3 py-3"}
                        key={item.label}
                      >
                        <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                          <Icon className="size-3.5" />
                          {item.label}
                        </p>
                        <p className="mt-1 truncate text-sm font-medium text-slate-700">{item.value}</p>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
                    type="button"
                  >
                    <CheckCircle2 className="size-4" />
                    确认
                  </button>
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    type="button"
                  >
                    <LockKeyhole className="size-4" />
                    范围
                  </button>
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 hover:bg-red-100"
                    type="button"
                  >
                    <Trash2 className="size-4" />
                    删除
                  </button>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <Clock3 className="size-4 text-slate-500" />
                    待确认记忆
                  </p>
                  <span className="text-[11px] font-medium text-slate-400">{pendingMemories.length} 条</span>
                </div>

                <div className="mt-4 grid gap-2">
                  {pendingMemories.map((memory) => (
                    <div className="border-t border-slate-100 py-3 first:border-t-0 first:pt-0" key={memory}>
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

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <ShieldCheck className="size-4 text-slate-500" />
                  分类概览
                </p>
                <div className="mt-4 grid gap-2">
                  {categories.map((category) => {
                    const Icon = category.icon

                    return (
                      <div className="flex items-center gap-3 border-t border-slate-100 py-2 first:border-t-0 first:pt-0" key={category.label}>
                        <Icon className="size-4 text-slate-500" />
                        <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">{category.label}</span>
                        <span className="text-sm font-medium text-slate-500">{category.value}</span>
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
