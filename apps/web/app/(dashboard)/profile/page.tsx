"use client"

import { useState, type ChangeEvent } from "react"
import {
  BadgeCheck,
  Bell,
  Brain,
  CheckCircle2,
  Clock3,
  Heart,
  ImageUp,
  KeyRound,
  LockKeyhole,
  MessageCircle,
  Palette,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react"
import type { UserProfileResponse } from "@repo/contracts"

import { uploadWebUserAvatar } from "@/auth/api"
import { UserAvatar } from "@/components/user-avatar"
import { useWebDashboardContext } from "@/components/web-dashboard-guard"
import { DashboardShell } from "../_components/dashboard-shell"

const profileTabs = [
  { label: "资料", meta: "基础信息" },
  { label: "偏好", meta: "聊天习惯" },
  { label: "隐私", meta: "数据边界" },
  { label: "通知", meta: "提醒设置" },
  { label: "安全", meta: "账号状态" },
]

const preferences = [
  { label: "回复语气", value: "直接但温柔", icon: MessageCircle },
  { label: "默认节奏", value: "低压推进", icon: Heart },
  { label: "记忆策略", value: "确认后保存", icon: Brain },
  { label: "界面风格", value: "简洁克制", icon: Palette },
]

const privacyItems = [
  { label: "长期记忆", value: "开启，需确认", icon: Brain },
  { label: "角色共享", value: "仅授权伴侣", icon: LockKeyhole },
  { label: "安全边界", value: "严格模式", icon: ShieldCheck },
]

const activity = [
  "资料最后更新于",
  "最近登录时间",
  "当前会话有效期至",
]

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

function formatDate(value: number | null) {
  if (value === null) {
    return "暂无记录"
  }

  return dateFormatter.format(new Date(value)).replaceAll("/", ".")
}

function formatDateTime(value: number | null) {
  if (value === null) {
    return "暂无记录"
  }

  return dateTimeFormatter.format(new Date(value)).replaceAll("/", ".")
}

function formatRelativeTime(value: number | null) {
  if (value === null) {
    return "暂无记录"
  }

  const diffMs = Math.max(0, Date.now() - value)
  const minutes = Math.floor(diffMs / 60000)

  if (minutes < 1) {
    return "刚刚"
  }

  if (minutes < 60) {
    return `${minutes} 分钟前`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `${hours} 小时前`
  }

  const days = Math.floor(hours / 24)

  if (days < 7) {
    return `${days} 天前`
  }

  return formatDate(value)
}

function formatStatus(status: UserProfileResponse["status"]) {
  const statusMap: Record<UserProfileResponse["status"], string> = {
    active: "正常",
    suspended: "已暂停",
    deleted: "已删除",
  }

  return statusMap[status]
}

function formatRole(role: string) {
  const roleMap: Record<string, string> = {
    web_user: "Web 用户",
    admin_user: "管理员",
    admin_owner: "Owner",
  }

  return roleMap[role] ?? role.replaceAll("_", " ")
}

export default function ProfilePage() {
  const { profile, session, refreshProfile } = useWebDashboardContext()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarUploadMessage, setAvatarUploadMessage] = useState<string | null>(null)
  const profileStats = [
    { label: "角色", value: String(profile.roles.length), icon: Heart },
    { label: "会话", value: session.app.toUpperCase(), icon: Brain },
    { label: "状态", value: formatStatus(profile.status), icon: ShieldCheck },
  ]
  const accountChecks = [
    { label: "账号资料", done: Boolean(profile.name && profile.email) },
    { label: "账号状态", done: profile.status === "active" },
    { label: "角色权限", done: profile.roles.length > 0 },
    { label: "头像形象", done: Boolean(profile.avatarKey) },
  ]
  const incompleteCount = accountChecks.filter((item) => !item.done).length
  const profileActivity = [
    `${activity[0]} ${formatDateTime(profile.updatedAtMs)}`,
    `${activity[1]} ${formatDateTime(profile.lastLoginAtMs)}`,
    `${activity[2]} ${formatDateTime(session.expiresAtMs)}`,
  ]

  async function handleRefreshProfile() {
    setIsRefreshing(true)

    try {
      await refreshProfile()
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]

    event.currentTarget.value = ""

    if (!file) {
      return
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarUploadMessage("请选择 JPG、PNG 或 WebP 图片。")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarUploadMessage("头像文件不能超过 2MB。")
      return
    }

    setIsUploadingAvatar(true)
    setAvatarUploadMessage(null)

    try {
      await uploadWebUserAvatar(file)
      await refreshProfile()
      setAvatarUploadMessage("头像已更新。")
    } catch (error) {
      setAvatarUploadMessage(error instanceof Error ? error.message : "头像上传失败。")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  return (
    <DashboardShell title="个人中心">
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
        <section className="bg-white px-5 pt-5 lg:px-8">
          <div className="mx-auto w-full max-w-3xl border-b border-slate-200 pb-5">
            <div className="grid gap-5">
              <div className="flex min-w-0 gap-4">
                <div className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 sm:flex">
                  <UserRound className="size-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                    <span>个人中心</span>
                    <span className="h-px w-8 bg-slate-200" />
                    <span>Profile</span>
                  </div>
                  <p className="mt-2 max-w-xl text-[15px] font-normal leading-7 text-slate-600">
                    管理你的资料、聊天偏好、记忆权限和账号安全，让 AI 伴侣更懂你，也更有边界。
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <BadgeCheck className="size-3.5" />
                      {formatStatus(profile.status)}
                    </span>
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <ShieldCheck className="size-3.5" />
                      {session.app.toUpperCase()} 会话
                    </span>
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <Sparkles className="size-3.5" />
                      {profile.roles.length} 个角色
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 border-t border-slate-200 pt-3">
                {profileStats.map((item) => {
                  const Icon = item.icon

                  return (
                    <div className="rounded-xl bg-slate-50/80 p-3" key={item.label}>
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
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            <label className="flex h-9 min-w-0 items-center gap-2 rounded-xl bg-slate-50/80 px-2.5 ring-1 ring-inset ring-slate-200/70 transition-colors focus-within:bg-white">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md text-slate-500">
                <Search className="size-3.5" />
              </span>
              <input
                aria-label="搜索个人中心设置"
                className="h-8 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="搜索资料、隐私或偏好"
              />
            </label>

            <div className="grid min-w-0 gap-1">
              {profileTabs.map((tab, index) => (
                <button
                  className={
                    index === 0
                      ? "relative flex h-8 items-center rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-950 after:absolute after:inset-x-3 after:bottom-1 after:h-px after:bg-slate-400"
                      : "flex h-8 items-center rounded-lg px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
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
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isRefreshing}
              onClick={() => {
                void handleRefreshProfile()
              }}
              type="button"
            >
              <RefreshCw className={isRefreshing ? "size-4 animate-spin" : "size-4"} />
              {isRefreshing ? "同步中" : "刷新资料"}
            </button>
          </div>

          <div className="mx-auto mt-5 grid w-full max-w-3xl gap-5">
            <section className="grid gap-5">
              <article className="flex min-h-0 flex-col rounded-2xl bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <UserAvatar user={profile} size="lg" />
                    <div className="min-w-0">
                      <p className="text-xl font-semibold tracking-tight text-slate-950">{profile.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {profile.roles.map((role) => (
                          <span className="inline-flex h-6 items-center rounded-full bg-slate-100 px-2 text-[11px] font-medium text-slate-600" key={role}>
                            {formatRole(role)}
                          </span>
                        ))}
                        <span className="inline-flex h-6 items-center rounded-full bg-slate-100 px-2 text-[11px] font-medium text-slate-600">
                          {profile.avatarKey ? "头像已同步" : "未设置头像"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 sm:inline-flex">
                    {profile.status === "active" ? "可用" : formatStatus(profile.status)}
                  </span>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50/80 p-3">
                  <p className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <ImageUp className="size-3.5" />
                    头像设置
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    支持 JPG、PNG、WebP，文件不超过 2MB。
                  </p>
                  <label className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={isUploadingAvatar}
                      onChange={handleAvatarFileChange}
                      type="file"
                    />
                    <ImageUp className="size-4" />
                    {isUploadingAvatar ? "上传中" : profile.avatarKey ? "更换头像" : "上传头像"}
                  </label>
                  {avatarUploadMessage ? (
                    <p className="mt-2 text-xs leading-5 text-slate-500">{avatarUploadMessage}</p>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-3 border-t border-slate-200 pt-4">
                  <div className="rounded-xl bg-slate-50/80 p-3">
                    <p className="text-[10px] font-medium text-slate-400">加入时间</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{formatDate(profile.createdAtMs)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50/80 p-3">
                    <p className="text-[10px] font-medium text-slate-400">用户 ID</p>
                    <p className="mt-1 truncate text-sm font-medium text-slate-700" title={profile.id}>{profile.id}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50/80 p-3">
                    <p className="text-[10px] font-medium text-slate-400">同步</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{formatRelativeTime(profile.updatedAtMs)}</p>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl bg-white p-5">
                <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <MessageCircle className="size-4 text-slate-500" />
                    聊天偏好
                  </p>
                  <span className="text-[11px] font-medium text-slate-400">Preferences</span>
                </div>

                <div className="grid gap-2">
                  {preferences.map((item) => {
                    const Icon = item.icon

                    return (
                      <div className="border-t border-slate-100 py-3 first:border-t-0 sm:first:border-t sm:odd:pr-3" key={item.label}>
                        <p className="flex items-center gap-2 text-xs font-medium text-slate-400">
                          <Icon className="size-3.5" />
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-800">{item.value}</p>
                      </div>
                    )
                  })}
                </div>
              </article>

              <article className="rounded-2xl bg-white p-5">
                <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <LockKeyhole className="size-4 text-slate-500" />
                    隐私与记忆
                  </p>
                  <span className="text-[11px] font-medium text-slate-400">Privacy</span>
                </div>

                <div className="grid gap-3">
                  {privacyItems.map((item) => {
                    const Icon = item.icon

                    return (
                      <div className="flex items-center gap-3 border-t border-slate-100 py-2 first:border-t-0" key={item.label}>
                        <Icon className="size-4 shrink-0 text-slate-500" />
                        <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">{item.label}</span>
                        <span className="text-sm text-slate-500">{item.value}</span>
                      </div>
                    )
                  })}
                </div>
              </article>

              <article className="rounded-2xl bg-white p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Bell className="size-4 text-slate-500" />
                  通知
                </p>
                <div className="mt-4 space-y-3">
                  {["重要聊天提醒", "记忆确认提醒", "伴侣动态提醒"].map((item, index) => (
                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 first:border-t-0 first:pt-0" key={item}>
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                      <span
                        className={
                          index === 2
                            ? "h-5 w-9 rounded-full bg-slate-200 p-0.5"
                            : "h-5 w-9 rounded-full bg-slate-950 p-0.5"
                        }
                      >
                        <span
                          className={
                            index === 2
                              ? "block size-4 rounded-full bg-white"
                              : "ml-auto block size-4 rounded-full bg-white"
                          }
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl bg-white p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <KeyRound className="size-4 text-slate-500" />
                  安全
                </p>
                <div className="mt-4 space-y-3">
                  <div className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
                    <p className="text-xs font-medium text-slate-400">登录方式</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{profile.email}</p>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-medium text-slate-400">会话状态</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {session.sessionId.slice(0, 8)} · {formatDateTime(session.expiresAtMs)}
                    </p>
                  </div>
                  <button
                    className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    type="button"
                  >
                    管理安全设置
                  </button>
                </div>
              </article>
            </section>

            <section className="grid gap-5">
              <section className="rounded-2xl bg-white p-4">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <CheckCircle2 className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">账号完整度</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {incompleteCount === 0 ? "全部核心资料已同步。" : `还有 ${incompleteCount} 项可以完善。`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  {accountChecks.map((item) => (
                    <div className="flex items-center gap-3 border-t border-slate-100 py-2 first:border-t-0 first:pt-0" key={item.label}>
                      <span
                        className={
                          item.done
                            ? "flex size-6 items-center justify-center rounded-lg bg-slate-950 text-white"
                            : "flex size-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400"
                        }
                      >
                        {item.done ? <CheckCircle2 className="size-3.5" /> : <Sparkles className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">{item.label}</span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {item.done ? "完成" : "待完善"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl bg-white p-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <Clock3 className="size-4 text-slate-500" />
                    最近同步
                  </p>
                  <span className="text-[11px] font-medium text-slate-400">Today</span>
                </div>

                <div className="mt-4 grid gap-2">
                  {profileActivity.map((item) => (
                    <div className="border-t border-slate-100 py-3 first:border-t-0 first:pt-0" key={item}>
                      <p className="text-sm leading-6 text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <ShieldCheck className="size-4 text-slate-500" />
                  数据边界
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  伴侣只能使用你授权的偏好、边界和已确认记忆。待确认记忆不会自动进入长期上下文。
                </p>
              </section>
            </section>
          </div>
        </section>
      </main>
    </DashboardShell>
  )
}
