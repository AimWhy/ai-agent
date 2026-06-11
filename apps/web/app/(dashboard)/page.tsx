"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import type { MyAgentInboxItem } from "@repo/contracts"
import {
  Compass,
  MessageCircle,
  Plus,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react"
import { DashboardShell } from "./_components/dashboard-shell"
import { InboxChat } from "./_components/inbox-chat"
import { getMyAgentInbox } from "@/auth/api"
import { AgentAvatar } from "@/components/agent-avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ChatConversation = MyAgentInboxItem

function chemistryClassName(level: ChatConversation["chemistryLevel"]) {
  if (level === "High") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  if (level === "Low") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  return "border-sky-200 bg-sky-50 text-sky-700"
}

type InboxListProps = {
  conversations: ChatConversation[]
  selectedConversationId: string | null
  onSelectConversation: (conversationId: string) => void
}

function getConversationPreview(conversation: ChatConversation) {
  return conversation.lastAssistantMessage || conversation.profileNote
}

function InboxList({ conversations, selectedConversationId, onSelectConversation }: InboxListProps) {
  return (
    <aside className="flex h-[52vh] min-h-0 w-full max-h-[34rem] shrink-0 flex-col border-b bg-background lg:h-auto lg:max-h-none lg:w-[clamp(21rem,30vw,26rem)] lg:border-r lg:border-b-0">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="divide-y divide-slate-200">
          {conversations.map((conversation) => {
            const selected = conversation.id === selectedConversationId

            return (
              <button
                aria-current={selected ? "page" : undefined}
                key={conversation.id}
                className={cn(
                  "group relative flex w-full gap-3 px-4 py-3.5 text-left text-sm transition-colors sm:px-5",
                  "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400",
                  selected
                    ? "bg-slate-100/90"
                    : "bg-white hover:bg-slate-50",
                )}
                onClick={() => onSelectConversation(conversation.id)}
                type="button"
              >
                {selected ? (
                  <>
                    <span className="absolute inset-y-0 left-0 w-1 bg-slate-950" />
                    <span className="absolute inset-y-0 right-0 w-px bg-slate-300" />
                  </>
                ) : null}

              <span className="relative shrink-0">
                <AgentAvatar
                  className={cn(
                    "size-10 rounded-lg text-xs",
                    selected
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-700 group-hover:bg-slate-200",
                  )}
                  fallbackClassName={cn(selected ? "bg-slate-950 text-white" : "group-hover:bg-slate-200")}
                  imageKey={conversation.imageKey}
                  name={conversation.name}
                />
                {conversation.unread ? (
                  <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-blue-600" />
                ) : null}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "truncate font-semibold",
                      selected || conversation.unread ? "text-slate-950" : "text-slate-700",
                    )}
                  >
                    {conversation.name}
                  </span>
                  {conversation.pinned ? (
                    <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                  ) : null}
                  <span className="ml-auto shrink-0 text-[11px] font-medium text-muted-foreground">
                    {conversation.lastActive}
                  </span>
                </div>

                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <MessageCircle
                    className={cn(
                      "size-3.5 shrink-0",
                      conversation.unread ? "text-blue-600" : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "truncate font-medium",
                      selected ? "text-slate-950" : "text-slate-900",
                    )}
                  >
                    {conversation.headline}
                  </span>
                </div>

                <p className="mt-1.5 line-clamp-2 text-xs leading-5 whitespace-break-spaces text-muted-foreground">
                  {getConversationPreview(conversation)}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-medium",
                      chemistryClassName(conversation.chemistryLevel),
                    )}
                  >
                    {conversation.chemistryLabel}
                  </span>
                  <span className="inline-flex h-6 items-center rounded-full border border-slate-200 bg-slate-50 px-2 text-[11px] font-medium text-slate-600">
                    {conversation.topic}
                  </span>
                  {selected ? (
                    <span className="inline-flex h-6 items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 text-[11px] font-medium text-violet-700">
                      <Sparkles className="size-3" />
                      Ready
                    </span>
                  ) : null}
                </div>
              </div>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

function InboxEmptyState() {
  const router = useRouter()

  return (
    <aside className="flex h-[52vh] min-h-0 w-full max-h-[34rem] shrink-0 flex-col border-b bg-background lg:h-auto lg:max-h-none lg:w-[clamp(21rem,30vw,26rem)] lg:border-r lg:border-b-0">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center px-5 py-8">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
              <Wand2 className="size-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-950">还没有 Agent 伴侣</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              当前账号还没有创建任何 AI Agent。先创建一个伴侣角色，首页才会出现对应的聊天会话。
            </p>
            <Button
              className="mt-5 rounded-full"
              onClick={() => router.push("/create-agent-companion")}
              type="button"
            >
              <Plus className="size-4" />
              创建 Agent 伴侣
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}

function EmptyChatPanel() {
  const router = useRouter()

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-slate-50/70">
      <div className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-xl">
          <div className="border-y border-slate-200 bg-white px-5 py-6 sm:px-6">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Compass className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Start here</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">先创建一个专属 Agent</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  首页聊天区会根据你创建的 Agent 动态生成会话入口。没有 Agent 时不展示虚假的联系人列表，避免默认状态误导用户。
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    className="rounded-full"
                    onClick={() => router.push("/create-agent-companion")}
                    type="button"
                  >
                    <Plus className="size-4" />
                    创建 Agent 伴侣
                  </Button>
                  <Button
                    className="rounded-full"
                    onClick={() => router.push("/discover")}
                    type="button"
                    variant="outline"
                  >
                    先去发现页看看
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              "设定角色形象",
              "配置聊天语气",
              "确认边界规则",
            ].map((item, index) => (
              <div className="border-y border-slate-200 bg-white px-4 py-3" key={item}>
                <p className="text-[11px] font-medium text-slate-400">Step {index + 1}</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function InboxLoadingState() {
  return (
    <aside className="flex h-[52vh] min-h-0 w-full max-h-[34rem] shrink-0 flex-col border-b bg-background lg:h-auto lg:max-h-none lg:w-[clamp(21rem,30vw,26rem)] lg:border-r lg:border-b-0">
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-slate-200 overflow-hidden">
        {[1, 2, 3].map((item) => (
          <div className="flex gap-3 px-4 py-4 sm:px-5" key={item}>
            <div className="size-10 animate-pulse rounded-lg bg-slate-100" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
              <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function InboxErrorState() {
  return (
    <aside className="flex h-[52vh] min-h-0 w-full max-h-[34rem] shrink-0 flex-col border-b bg-background lg:h-auto lg:max-h-none lg:w-[clamp(21rem,30vw,26rem)] lg:border-r lg:border-b-0">
      <div className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
            <Sparkles className="size-5" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-950">Agent 列表加载失败</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            请确认 API 已部署并完成最新 D1 迁移后再刷新首页。
          </p>
        </div>
      </div>
    </aside>
  )
}

export default function Page() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const agentInboxQuery = useQuery({
    queryKey: ["dashboard", "my-agent-inbox"],
    queryFn: getMyAgentInbox,
  })
  const conversations = agentInboxQuery.data?.items ?? []
  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0] ?? null
  const hasAgent = conversations.length > 0

  useEffect(() => {
    if (conversations.length === 0) {
      if (selectedConversationId !== null) {
        setSelectedConversationId(null)
      }

      return
    }

    if (!selectedConversationId || !conversations.some((conversation) => conversation.id === selectedConversationId)) {
      setSelectedConversationId(conversations[0]!.id)
    }
  }, [conversations, selectedConversationId])

  return (
    <DashboardShell title="聊天">
      <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col overflow-hidden bg-slate-50/70 lg:flex-row">
        {agentInboxQuery.isLoading ? (
          <InboxLoadingState />
        ) : agentInboxQuery.isError ? (
          <InboxErrorState />
        ) : hasAgent ? (
          <InboxList
            conversations={conversations}
            onSelectConversation={setSelectedConversationId}
            selectedConversationId={selectedConversation?.id ?? null}
          />
        ) : (
          <InboxEmptyState />
        )}

        {selectedConversation ? (
          <InboxChat
            conversation={selectedConversation}
            onConversationUpdated={() => {
              void agentInboxQuery.refetch()
            }}
          />
        ) : <EmptyChatPanel />}
      </div>
    </DashboardShell>
  )
}
