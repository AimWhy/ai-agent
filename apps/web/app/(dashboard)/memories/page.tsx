"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UpdateAgentMemoryRequest } from "@repo/contracts"
import {
  Bot,
  Brain,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react"

import { DashboardShell } from "../_components/dashboard-shell"
import {
  deleteMyAgentMemory,
  getMyAgentInbox,
  getMyAgentMemories,
  updateMyAgentMemory,
} from "@/auth/api"
import { AgentAvatar } from "@/components/agent-avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function formatRelativeTime(updatedAtMs: number) {
  const diffMs = Math.max(0, Date.now() - updatedAtMs)
  const minuteMs = 60 * 1000
  const hourMs = 60 * minuteMs
  const dayMs = 24 * hourMs

  if (diffMs < minuteMs) {
    return "刚刚"
  }

  if (diffMs < hourMs) {
    return `${Math.max(1, Math.floor(diffMs / minuteMs))} 分钟前`
  }

  if (diffMs < dayMs) {
    return `${Math.floor(diffMs / hourMs)} 小时前`
  }

  return `${Math.floor(diffMs / dayMs)} 天前`
}

function getImportanceLabel(value: number) {
  if (value >= 5) {
    return "高"
  }

  if (value >= 3) {
    return "中"
  }

  return "低"
}

export default function MemoriesPage() {
  const queryClient = useQueryClient()
  const agentInboxQuery = useQuery({
    queryKey: ["dashboard", "my-agent-inbox"],
    queryFn: getMyAgentInbox,
  })
  const agents = agentInboxQuery.data?.items ?? []
  const [selectedAgentId, setSelectedAgentId] = useState("")
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? null

  useEffect(() => {
    if (agents.length === 0) {
      if (selectedAgentId) {
        setSelectedAgentId("")
      }

      return
    }

    if (!selectedAgentId || !agents.some((agent) => agent.id === selectedAgentId)) {
      setSelectedAgentId(agents[0].id)
    }
  }, [agents, selectedAgentId])

  const memoriesQuery = useQuery({
    queryKey: ["agent-memories", selectedAgent?.id],
    queryFn: () => getMyAgentMemories(selectedAgent!.id),
    enabled: Boolean(selectedAgent),
  })
  const memories = memoriesQuery.data?.items ?? []
  const [selectedMemoryId, setSelectedMemoryId] = useState("")
  const selectedMemory = memories.find((memory) => memory.id === selectedMemoryId) ?? memories[0] ?? null
  const [editForm, setEditForm] = useState({
    type: "",
    content: "",
    importance: 3,
  })

  useEffect(() => {
    if (memories.length === 0) {
      if (selectedMemoryId) {
        setSelectedMemoryId("")
      }

      return
    }

    if (!selectedMemoryId || !memories.some((memory) => memory.id === selectedMemoryId)) {
      setSelectedMemoryId(memories[0].id)
    }
  }, [memories, selectedMemoryId])

  useEffect(() => {
    if (!selectedMemory) {
      setEditForm({ type: "", content: "", importance: 3 })
      return
    }

    setEditForm({
      type: selectedMemory.type,
      content: selectedMemory.content,
      importance: selectedMemory.importance,
    })
  }, [selectedMemory])

  const memoryStats = useMemo(() => {
    const active = memories.filter((memory) => memory.status === "active").length
    const disabled = memories.filter((memory) => memory.status === "disabled").length

    return [
      { label: "全部记忆", value: String(memories.length), icon: Brain },
      { label: "已启用", value: String(active), icon: CheckCircle2 },
      { label: "已停用", value: String(disabled), icon: Clock3 },
    ]
  }, [memories])

  const categories = useMemo(() => {
    const countByType = new Map<string, number>()

    for (const memory of memories) {
      countByType.set(memory.type, (countByType.get(memory.type) ?? 0) + 1)
    }

    return Array.from(countByType.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [memories])

  const invalidateMemories = async () => {
    if (!selectedAgent) {
      return
    }

    await queryClient.invalidateQueries({ queryKey: ["agent-memories", selectedAgent.id] })
  }

  const updateMemoryMutation = useMutation({
    mutationFn: (input: { memoryId: string; patch: UpdateAgentMemoryRequest }) =>
      updateMyAgentMemory(selectedAgent!.id, input.memoryId, input.patch),
    onSuccess: invalidateMemories,
  })
  const deleteMemoryMutation = useMutation({
    mutationFn: (memoryId: string) => deleteMyAgentMemory(selectedAgent!.id, memoryId),
    onSuccess: async () => {
      setSelectedMemoryId("")
      await invalidateMemories()
    },
  })

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
                    管理每个 Agent 伴侣可以使用的长期记忆。聊天时会自动读取已启用记忆，并注入到 Agent 上下文中。
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <CheckCircle2 className="size-3.5" />
                      可编辑
                    </span>
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <Bot className="size-3.5" />
                      按 Agent 分组
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
          <div className="mx-auto grid max-w-6xl gap-5 xl:grid-cols-[18rem_minmax(0,1fr)_22rem]">
            <aside className="grid content-start gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Agents</p>
              <div className="grid gap-1 overflow-hidden rounded-2xl">
                {agents.map((agent) => (
                  <button
                    className={cn(
                      "flex items-center gap-3 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50",
                      selectedAgent?.id === agent.id && "bg-slate-100",
                    )}
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgentId(agent.id)
                      setSelectedMemoryId("")
                    }}
                    type="button"
                  >
                    <AgentAvatar
                      className="size-9 rounded-xl bg-slate-100 text-xs text-slate-700"
                      fallbackClassName="bg-slate-100 text-slate-700"
                      imageKey={agent.imageKey}
                      name={agent.name}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{agent.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{agent.status}</p>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            <section className="grid content-start gap-5">
              <div className="flex min-h-10 flex-wrap items-center gap-2">
                {categories.length > 0 ? categories.map(([type, count], index) => (
                  <span
                    className={cn(
                      "inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium",
                      index === 0 ? "bg-slate-950 text-white" : "bg-white text-slate-500",
                    )}
                    key={type}
                  >
                    {type} · {count}
                  </span>
                )) : (
                  <span className="text-sm text-slate-400">暂无记忆分类</span>
                )}
              </div>

              <div className="grid gap-1 overflow-hidden rounded-2xl">
                {memoriesQuery.isLoading ? (
                  [1, 2, 3].map((item) => (
                    <div className="bg-white p-4" key={item}>
                      <div className="h-4 w-44 animate-pulse rounded bg-slate-100" />
                      <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100" />
                    </div>
                  ))
                ) : memories.length === 0 ? (
                  <div className="bg-white p-6 text-center">
                    <Brain className="mx-auto size-8 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-700">还没有沉淀长期记忆</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      与 Agent 聊天后，系统会从稳定偏好、边界和目标中自动生成记忆。
                    </p>
                  </div>
                ) : memories.map((memory) => (
                  <button
                    className={cn(
                      "relative bg-white p-4 text-left transition-colors hover:bg-slate-50",
                      selectedMemory?.id === memory.id && "bg-slate-100",
                    )}
                    key={memory.id}
                    onClick={() => setSelectedMemoryId(memory.id)}
                    type="button"
                  >
                    {selectedMemory?.id === memory.id ? <span className="absolute inset-y-0 left-0 w-1 bg-slate-950" /> : null}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{memory.type}</p>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{memory.content}</p>
                      </div>
                      <span className={cn(
                        "shrink-0 rounded-full px-2 py-1 text-[11px] font-medium",
                        memory.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500",
                      )}>
                        {memory.status === "active" ? "已启用" : "已停用"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-400">
                      <span>重要度 {getImportanceLabel(memory.importance)}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(memory.updatedAtMs)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <aside className="grid content-start gap-5">
              <section className="rounded-2xl bg-white p-4">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <Sparkles className="size-4 text-slate-500" />
                      当前记忆
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Selected memory</p>
                  </div>
                </div>

                {selectedMemory ? (
                  <div className="grid gap-4 pt-4">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium text-slate-400">类型</span>
                      <input
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-slate-400"
                        onChange={(event) => setEditForm((current) => ({ ...current, type: event.currentTarget.value }))}
                        value={editForm.type}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium text-slate-400">内容</span>
                      <textarea
                        className="min-h-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-800 outline-none focus:border-slate-400"
                        onChange={(event) => setEditForm((current) => ({ ...current, content: event.currentTarget.value }))}
                        value={editForm.content}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium text-slate-400">重要度</span>
                      <input
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-slate-400"
                        max={5}
                        min={1}
                        onChange={(event) => setEditForm((current) => ({ ...current, importance: Number(event.currentTarget.value) }))}
                        type="number"
                        value={editForm.importance}
                      />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="rounded-full"
                        disabled={updateMemoryMutation.isPending}
                        onClick={() => {
                          void updateMemoryMutation.mutateAsync({
                            memoryId: selectedMemory.id,
                            patch: editForm,
                          })
                        }}
                        type="button"
                      >
                        <Save className="size-4" />
                        保存
                      </Button>
                      <Button
                        className="rounded-full"
                        disabled={updateMemoryMutation.isPending}
                        onClick={() => {
                          void updateMemoryMutation.mutateAsync({
                            memoryId: selectedMemory.id,
                            patch: { status: selectedMemory.status === "active" ? "disabled" : "active" },
                          })
                        }}
                        type="button"
                        variant="outline"
                      >
                        {selectedMemory.status === "active" ? "停用" : "启用"}
                      </Button>
                      <Button
                        className="rounded-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        disabled={deleteMemoryMutation.isPending}
                        onClick={() => {
                          void deleteMemoryMutation.mutateAsync(selectedMemory.id)
                        }}
                        type="button"
                        variant="outline"
                      >
                        <Trash2 className="size-4" />
                        删除
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500">选择一条记忆后可以编辑。</div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <MessageCircle className="size-4 text-slate-500" />
                  来源片段
                </p>
                {selectedMemory?.sourceMessage ? (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                    {selectedMemory.sourceMessage.role === "user" ? (
                      <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                        <UserRound className="size-4" />
                      </span>
                    ) : selectedAgent ? (
                      <AgentAvatar
                        className="mt-1 size-8 shrink-0 rounded-full bg-slate-100 text-[10px] text-slate-700"
                        fallbackClassName="bg-slate-100 text-slate-700"
                        imageKey={selectedAgent.imageKey}
                        name={selectedAgent.name}
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-400">
                        {selectedMemory.sourceMessage.role === "user" ? "用户消息" : "Agent 回复"} · {formatRelativeTime(selectedMemory.sourceMessage.createdAtMs)}
                      </p>
                      <p className="mt-2 whitespace-break-spaces text-sm leading-6 text-slate-700">
                        {selectedMemory.sourceMessage.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-slate-500">这条记忆暂无来源消息。</p>
                )}
              </section>
            </aside>
          </div>
        </section>
      </main>
    </DashboardShell>
  )
}
