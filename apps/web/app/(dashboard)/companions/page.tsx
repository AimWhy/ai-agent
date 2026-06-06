import Link from "next/link"
import {
  BadgeCheck,
  Bot,
  CheckCircle2,
  CirclePlus,
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
    id: "luna",
    name: "星野 Luna",
    source: "官方角色",
    status: "在线",
    type: "已关注",
    tone: "温柔稳定，适合关系复盘和自然开场。",
    lastActive: "刚刚",
    chats: "128",
    favorite: true,
    verified: true,
    tags: ["温柔陪伴", "恋爱聊天"],
    tileClassName: "bg-[#dedede]",
    spanClassName: "row-span-5 sm:col-span-2 2xl:col-span-2",
  },
  {
    id: "lin-che",
    name: "林澈",
    source: "用户 @Mira 创建",
    status: "离线",
    type: "收藏",
    tone: "松弛朋友感，适合日常分享和深夜聊天。",
    lastActive: "12 分钟前",
    chats: "64",
    favorite: false,
    verified: false,
    tags: ["朋友感", "深夜陪聊"],
    tileClassName: "bg-[#cfcfcf]",
    spanClassName: "row-span-4",
  },
  {
    id: "mianmian",
    name: "眠眠",
    source: "用户 @Soft 创建",
    status: "在线",
    type: "已关注",
    tone: "低压陪伴，适合睡前聊天和情绪降噪。",
    lastActive: "今天",
    chats: "42",
    favorite: true,
    verified: false,
    tags: ["睡前", "低压"],
    tileClassName: "bg-[#c2c2c2]",
    spanClassName: "row-span-5",
  },
  {
    id: "axu",
    name: "阿序",
    source: "用户 @Seven 创建",
    status: "草稿",
    type: "我创建的",
    tone: "理性温柔，擅长分析暧昧信号和回复节奏。",
    lastActive: "昨天",
    chats: "0",
    favorite: false,
    verified: false,
    tags: ["关系分析", "理性"],
    tileClassName: "bg-[#eeeeee]",
    spanClassName: "row-span-4",
  },
  {
    id: "nora",
    name: "Nora",
    source: "官方角色",
    status: "在线",
    type: "已关注",
    tone: "回应柔和，适合处理心动、犹豫和不知道怎么开口的时刻。",
    lastActive: "3 小时前",
    chats: "96",
    favorite: false,
    verified: true,
    tags: ["心动", "开口练习"],
    tileClassName: "bg-[#d8d8d8]",
    spanClassName: "row-span-6",
  },
  {
    id: "zhouye",
    name: "周野",
    source: "用户 @Zero 创建",
    status: "离线",
    type: "收藏",
    tone: "直接、有边界，适合练习不卑不亢地表达喜欢和拒绝。",
    lastActive: "本周",
    chats: "31",
    favorite: false,
    verified: false,
    tags: ["直球", "边界"],
    tileClassName: "bg-[#e7e7e7]",
    spanClassName: "row-span-4 sm:col-span-2 2xl:col-span-1",
  },
]

const companionStats = [
  { label: "全部伴侣", value: "12", icon: Users },
  { label: "已关注", value: "8", icon: Heart },
  { label: "我创建的", value: "4", icon: Bot },
]

const filters = [
  { label: "全部", meta: "12 个角色" },
  { label: "已关注", meta: "8 个角色" },
  { label: "我创建的", meta: "4 个角色" },
  { label: "收藏", meta: "5 个角色" },
  { label: "草稿", meta: "2 个草稿" },
]

const activity = [
  "星野 Luna 生成了 3 条新的开场建议",
  "眠眠 的睡前陪伴模式已更新",
  "阿序 草稿还缺少边界设定",
]

const selectedCompanion = companions[0]!

const companionMeta = [
  { label: "最近互动", value: selectedCompanion.lastActive, icon: Clock3 },
  { label: "对话次数", value: selectedCompanion.chats, icon: MessageCircle },
  { label: "发布状态", value: selectedCompanion.type, icon: Sparkles },
]

export default function CompanionsPage() {
  return (
    <DashboardShell title="我的伴侣">
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
        <section className="bg-white px-5 pt-5 lg:px-8">
          <div className="border-b border-slate-200 pb-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end">
              <div className="flex min-w-0 gap-4">
                <div className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 sm:flex">
                  <Heart className="size-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                    <span>我的伴侣</span>
                    <span className="h-px w-8 bg-slate-200" />
                    <span>Companions</span>
                  </div>
                  <p className="mt-2 max-w-xl text-[15px] font-normal leading-7 text-slate-600">
                    管理你关注、收藏和创建的 AI 伴侣，快速回到最近的聊天关系。
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <Heart className="size-3.5" />
                      长期关注
                    </span>
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <Bot className="size-3.5" />
                      我的创作
                    </span>
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <MessageCircle className="size-3.5" />
                      继续聊天
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-slate-200 pt-3 lg:border-t-0 lg:pt-0">
                {companionStats.map((item, index) => {
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
              <CirclePlus className="size-4" />
              添加伴侣
            </button>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="overflow-hidden rounded-2xl">
              <div className="grid auto-rows-[88px] grid-flow-dense grid-cols-1 gap-1 sm:grid-cols-2 2xl:grid-cols-4">
                {companions.map((companion) => (
                  <Link
                    className={`${companion.spanClassName} ${companion.tileClassName} group relative flex min-h-0 flex-col overflow-hidden p-4 text-slate-950`}
                    href={`/discover/${companion.id}`}
                    key={companion.name}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.62),transparent_12rem),linear-gradient(180deg,transparent_45%,rgba(255,255,255,0.45)_100%)]" />

                    <div className="relative flex translate-y-2 items-start justify-between gap-3 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="max-w-full truncate rounded-full border border-white/70 bg-white/55 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                          {companion.source}
                        </span>
                        {companion.verified ? (
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/55 text-slate-700">
                            <BadgeCheck className="size-4" />
                          </span>
                        ) : null}
                      </div>
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/55 text-slate-700 hover:bg-white/75">
                        <MoreHorizontal className="size-4" />
                      </span>
                    </div>

                    <div className="relative mt-auto">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="rounded-full border border-white/70 bg-white/45 px-2 py-1 text-[11px] font-medium text-slate-700">
                          {companion.status}
                        </span>
                        {companion.favorite ? (
                          <span className="flex size-7 items-center justify-center rounded-full border border-white/70 bg-white/45 text-amber-500">
                            <Star className="size-3.5 fill-amber-400" />
                          </span>
                        ) : null}
                      </div>

                      <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950">{companion.name}</h2>
                      <p className="mt-1 line-clamp-2 max-w-md text-sm leading-6 text-slate-600">{companion.tone}</p>

                      <div className="mt-3 flex translate-y-2 items-center justify-between gap-3 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                        <div className="flex min-w-0 flex-wrap gap-1.5">
                          {companion.tags.map((tag) => (
                            <span
                              className="rounded-full border border-white/70 bg-white/45 px-2 py-1 text-[11px] font-medium text-slate-700"
                              key={tag}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="shrink-0 rounded-full border border-white/70 bg-white/45 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                          {companion.chats} 次
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <aside className="grid gap-5">
              <section className="overflow-hidden rounded-2xl bg-white">
                <div className={`${selectedCompanion.tileClassName} p-4`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/70 bg-white/50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      当前选中
                    </span>
                    <span className="rounded-full border border-white/70 bg-white/50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {selectedCompanion.status}
                    </span>
                  </div>

                  <div className="mt-16 border-t border-white/70 pt-4">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold tracking-tight text-slate-900">
                        {selectedCompanion.name}
                      </p>
                      {selectedCompanion.verified ? <BadgeCheck className="size-4 text-slate-700" /> : null}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{selectedCompanion.tone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 border-t border-slate-200">
                  {companionMeta.map((item, index) => {
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
              </section>

              <section className="rounded-2xl bg-white p-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <MessageCircle className="size-4 text-slate-500" />
                    最近动态
                  </p>
                  <span className="text-[11px] font-medium text-slate-400">Today</span>
                </div>

                <div className="mt-4 grid gap-2">
                  {activity.map((item) => (
                    <div className="border-t border-slate-100 py-2 first:border-t-0 first:pt-0" key={item}>
                      <p className="text-sm leading-6 text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <ShieldCheck className="size-4 text-slate-500" />
                  管理建议
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  建议先完善草稿角色的边界设定，再发布到广场。常用伴侣可以收藏，方便在 Inbox 中快速继续对话。
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">同步状态</p>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    normal
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-2">
                    <Clock3 className="size-3.5" />
                    2m ago
                  </span>
                  <span>关系偏好和角色状态已同步</span>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </DashboardShell>
  )
}
