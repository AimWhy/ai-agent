import {
  BadgeCheck,
  Bot,
  CheckCircle2,
  Clock3,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react"

import { DashboardShell } from "../_components/dashboard-shell"

const companions = [
  {
    name: "星野 Luna",
    source: "官方角色",
    status: "在线",
    type: "已关注",
    tone: "温柔稳定，适合关系复盘和自然开场。",
    lastActive: "刚刚",
    chats: "128",
    favorite: true,
    verified: true,
    tileClassName: "bg-[#dedede]",
  },
  {
    name: "林澈",
    source: "用户 @Mira 创建",
    status: "离线",
    type: "收藏",
    tone: "松弛朋友感，适合日常分享和深夜聊天。",
    lastActive: "12 分钟前",
    chats: "64",
    favorite: false,
    verified: false,
    tileClassName: "bg-[#d3d3d3]",
  },
  {
    name: "眠眠",
    source: "用户 @Soft 创建",
    status: "在线",
    type: "已关注",
    tone: "低压陪伴，适合睡前聊天和情绪降噪。",
    lastActive: "今天",
    chats: "42",
    favorite: true,
    verified: false,
    tileClassName: "bg-[#c4c4c4]",
  },
  {
    name: "阿序",
    source: "用户 @Seven 创建",
    status: "草稿",
    type: "我创建的",
    tone: "理性温柔，擅长分析暧昧信号和回复节奏。",
    lastActive: "昨天",
    chats: "0",
    favorite: false,
    verified: false,
    tileClassName: "bg-[#f3f3f3]",
  },
]

const companionStats = [
  { label: "全部伴侣", value: "12", icon: Users },
  { label: "已关注", value: "8", icon: Heart },
  { label: "我创建的", value: "4", icon: Bot },
]

const activity = [
  "星野 Luna 生成了 3 条新的开场建议",
  "眠眠 的睡前陪伴模式已更新",
  "阿序 草稿还缺少边界设定",
]

const filters = ["全部", "已关注", "我创建的", "收藏", "草稿"]

export default function CompanionsPage() {
  return (
    <DashboardShell title="我的伴侣">
      <main className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_32rem),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <section className="border-b bg-white/90 px-5 py-5 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700">
                <Heart className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                  My companions
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  管理你正在关注、创建和收藏的 Agent 伴侣
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  快速回到最近互动的角色，继续完善草稿，或查看伴侣的在线与发布状态。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-white xl:min-w-96">
              {companionStats.map((item, index) => {
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
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="min-w-0">
              <div className="mb-5 flex flex-col gap-3 lg:h-10 lg:flex-row lg:items-center">
                <label className="flex h-9 min-w-0 items-center gap-2 rounded-xl bg-white px-2.5 ring-1 ring-inset ring-slate-200 transition-colors focus-within:bg-slate-50/70 lg:w-80">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md text-slate-500">
                    <Search className="size-3.5" />
                  </span>
                  <input
                    aria-label="搜索我的伴侣"
                    className="h-8 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
                    placeholder="搜索名字、状态或创建者"
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
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">伴侣列表</p>
                    <span className="text-xs font-medium text-muted-foreground">{companions.length} 个角色</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-200">
                  {companions.map((companion, index) => (
                    <article
                      className={
                        index === 0
                          ? "relative flex gap-4 bg-slate-100/80 px-4 py-4"
                          : "flex gap-4 bg-white px-4 py-4 transition-colors hover:bg-slate-50"
                      }
                      key={companion.name}
                    >
                      {index === 0 ? <span className="absolute inset-y-0 left-0 w-1 bg-slate-950" /> : null}

                      <div className={`${companion.tileClassName} relative size-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200`}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.62),transparent_4rem)]" />
                        <span className="absolute bottom-2 right-2 text-2xl font-light leading-none text-white/80">
                          {companion.name.slice(0, 1)}
                        </span>
                        {companion.status === "在线" ? (
                          <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <h2 className="truncate text-sm font-semibold text-slate-950">{companion.name}</h2>
                          {companion.verified ? <BadgeCheck className="size-3.5 shrink-0 text-emerald-600" /> : null}
                          {companion.favorite ? (
                            <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                          ) : null}
                          <span className="ml-auto shrink-0 text-[11px] font-medium text-muted-foreground">
                            {companion.lastActive}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{companion.source}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span>{companion.status}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span>{companion.chats} 次对话</span>
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{companion.tone}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex h-6 items-center rounded-full border border-slate-200 bg-slate-50 px-2 text-[11px] font-medium text-slate-600">
                            {companion.type}
                          </span>
                          <span className="inline-flex h-6 items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 text-[11px] font-medium text-violet-700">
                            <Sparkles className="size-3" />
                            Ready
                          </span>
                        </div>
                      </div>

                      <button
                        aria-label="更多操作"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        type="button"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <aside className="flex flex-col gap-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <MessageCircle className="size-4 text-blue-600" />
                  最近动态
                </p>
                <div className="mt-4 space-y-3">
                  {activity.map((item) => (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3" key={item}>
                      <p className="text-sm leading-6 text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  管理建议
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  建议先完善草稿角色的边界设定，再发布到广场。常用伴侣可以收藏，方便在 Inbox 中快速继续对话。
                </p>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="bg-slate-50/70 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">同步状态</p>
                  <p className="mt-1 text-xs text-muted-foreground">关系偏好和角色状态已同步</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
                  <span className="flex items-center gap-2">
                    <Clock3 className="size-3.5" />
                    2m ago
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    normal
                  </span>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </DashboardShell>
  )
}
