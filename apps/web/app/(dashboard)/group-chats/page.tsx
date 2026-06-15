"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  AgentGroupChat,
  AgentGroupChatDetailResponse,
  AgentGroupChatListResponse,
  AgentGroupChatMessage,
  MyAgentInboxItem,
} from "@repo/contracts"
import {
  Bot,
  Check,
  CirclePlus,
  Loader2,
  MessageCircle,
  MessagesSquare,
  RadioTower,
  Search,
  SendHorizontal,
  Users,
  X,
} from "lucide-react"

import { DashboardShell } from "../_components/dashboard-shell"
import {
  addAgentGroupChatMembers,
  createAgentGroupChat,
  getAgentGroupChatDetail,
  getAgentGroupChatMessages,
  getAgentGroupChats,
  getMyAgentInbox,
  removeAgentGroupChatMember,
  sendAgentGroupChatMessage,
} from "@/auth/api"
import {
  localLlmConfigChangedEventName,
  readLocalLlmConfigStore,
  selectLocalLlmConfig,
  type LocalLlmConfigStore,
} from "@/auth/local-llm-config"
import { MessageResponse } from "@/components/ai-elements/message"
import { AgentAvatar } from "@/components/agent-avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type GroupCreateDialogProps = {
  agents: MyAgentInboxItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (groupChatId: string) => void
}

function formatTime(timestamp: number | null) {
  if (!timestamp) {
    return "暂无消息"
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp))
}

function getMessagePreview(groupChat: AgentGroupChat) {
  if (!groupChat.latestMessage) {
    return "邀请几个 Agent 进来，开启一个新的多人陪伴场景。"
  }

  const speaker = groupChat.latestMessage.senderType === "agent"
    ? groupChat.latestMessage.agentName ?? "Agent"
    : "你"

  return `${speaker}：${groupChat.latestMessage.content}`
}

function toLlmRequestConfig(store: LocalLlmConfigStore) {
  const selected = store.items.find((item) => item.enabled && item.id === store.selectedConfigId)

  if (!selected) {
    return null
  }

  return {
    providerName: selected.providerName,
    baseURL: selected.baseURL,
    model: selected.model,
    apiKey: selected.apiKey,
    wireApi: selected.wireApi,
    ...(selected.reasoningEffort ? { reasoningEffort: selected.reasoningEffort } : {}),
  }
}

function GroupCreateDialog({ agents, open, onCreated, onOpenChange }: GroupCreateDialogProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState("周末闲聊小队")
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])
  const createMutation = useMutation({
    mutationFn: () => createAgentGroupChat({
      title: title.trim(),
      agentIds: selectedAgentIds,
    }),
    async onSuccess(response) {
      queryClient.setQueryData<AgentGroupChatListResponse>(["agent-group-chats"], (current) => ({
        items: [
          response.groupChat,
          ...(current?.items ?? []).filter((item) => item.id !== response.groupChat.id),
        ],
      }))
      await queryClient.invalidateQueries({ queryKey: ["agent-group-chats"] })
      onCreated(response.groupChat.id)
      onOpenChange(false)
      setTitle("周末闲聊小队")
      setSelectedAgentIds([])
    },
  })

  function toggleAgent(agentId: string) {
    setSelectedAgentIds((current) => {
      if (current.includes(agentId)) {
        return current.filter((id) => id !== agentId)
      }

      return [...current, agentId].slice(0, 6)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>创建 Agent 群聊</DialogTitle>
          <DialogDescription>
            选择 1-6 个 Agent。第一版采用受控回复，每轮会选择最合适的 1-3 个 Agent 发言。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 px-5 py-4">
          <label className="grid gap-2">
            <span className="text-xs font-medium text-muted-foreground">群聊名称</span>
            <Input
              className="h-10 rounded-xl"
              onChange={(event) => setTitle(event.currentTarget.value)}
              placeholder="例如：深夜陪伴小队"
              value={title}
            />
          </label>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground">邀请 Agent</span>
              <span className="text-xs text-muted-foreground">{selectedAgentIds.length}/6</span>
            </div>
            <div className="max-h-[20rem] overflow-y-auto border-y border-slate-200">
              {agents.length === 0 ? (
                <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
                  还没有可邀请的 Agent
                </div>
              ) : (
                agents.map((agent) => {
                  const selected = selectedAgentIds.includes(agent.id)

                  return (
                    <button
                      className={cn(
                        "flex w-full items-center gap-3 border-b border-slate-100 px-1 py-3 text-left transition-colors last:border-b-0",
                        selected ? "bg-slate-100" : "hover:bg-slate-50",
                      )}
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      type="button"
                    >
                      <AgentAvatar
                        className="size-10 rounded-xl"
                        imageKey={agent.imageKey}
                        name={agent.name}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-950">{agent.name}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">{agent.headline}</div>
                      </div>
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full border",
                          selected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 text-transparent",
                        )}
                      >
                        <Check className="size-3.5" />
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
          {createMutation.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {createMutation.error instanceof Error ? createMutation.error.message : "创建群聊失败"}
            </div>
          ) : null}
        </div>
        <DialogFooter className="mx-0 mb-0 rounded-b-2xl">
          <Button
            disabled={!title.trim() || selectedAgentIds.length === 0 || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CirclePlus className="size-4" />}
            创建群聊
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MessageBubble({ message }: { message: AgentGroupChatMessage }) {
  const isUser = message.senderType === "user"
  const isAgent = message.senderType === "agent"

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {isAgent ? (
        <AgentAvatar
          className="mt-1 size-9 rounded-xl"
          imageKey={message.agentImageKey}
          name={message.agentName ?? "Agent"}
        />
      ) : null}
      <div className={cn("max-w-[78%]", isUser && "order-first")}>
        <div className={cn("mb-1 flex items-center gap-2 text-xs text-muted-foreground", isUser && "justify-end")}>
          <span>{isUser ? "你" : message.agentName ?? "Agent"}</span>
          <span>{formatTime(message.createdAtMs)}</span>
        </div>
        <div
          className={cn(
            "border px-4 py-3 text-sm leading-6",
            isUser
              ? "whitespace-pre-wrap rounded-xl rounded-tr-sm border-slate-950 bg-slate-950 text-white"
              : "rounded-xl rounded-tl-sm border-slate-200 bg-white text-slate-800",
          )}
        >
          {isUser ? (
            message.content
          ) : (
            <MessageResponse className="[&_p]:leading-6">
              {message.content}
            </MessageResponse>
          )}
        </div>
      </div>
      {isUser ? (
        <span className="mt-6 flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-950 bg-slate-950 text-white">
          <Users className="size-4" />
        </span>
      ) : null}
    </div>
  )
}

export default function GroupChatsPage() {
  const queryClient = useQueryClient()
  const [selectedGroupChatId, setSelectedGroupChatId] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [draftMessage, setDraftMessage] = useState("")
  const [agentSearch, setAgentSearch] = useState("")
  const [llmStore, setLlmStore] = useState<LocalLlmConfigStore>({ selectedConfigId: null, items: [] })
  const shouldStickToBottomRef = useRef(false)
  const messageScrollRef = useRef<HTMLDivElement | null>(null)
  const groupChatsQuery = useQuery({
    queryKey: ["agent-group-chats"],
    queryFn: getAgentGroupChats,
  })
  const agentInboxQuery = useQuery({
    queryKey: ["dashboard", "my-agent-inbox", "group-chats"],
    queryFn: getMyAgentInbox,
  })
  const groupChats = groupChatsQuery.data?.items ?? []
  const selectedGroupChat = groupChats.find((groupChat) => groupChat.id === selectedGroupChatId) ?? groupChats[0] ?? null
  const detailQuery = useQuery({
    queryKey: ["agent-group-chat", selectedGroupChat?.id],
    queryFn: () => getAgentGroupChatDetail(selectedGroupChat?.id ?? ""),
    enabled: Boolean(selectedGroupChat?.id),
  })
  const availableAgents = agentInboxQuery.data?.items ?? []
  const currentMembers = detailQuery.data?.groupChat.members ?? selectedGroupChat?.members ?? []
  const filteredAvailableAgents = useMemo(() => {
    const normalized = agentSearch.trim().toLowerCase()
    const currentMemberAgentIds = new Set(currentMembers.map((member) => member.agentId))

    return availableAgents.filter((agent) => {
      if (currentMemberAgentIds.has(agent.id)) {
        return false
      }

      if (!normalized) {
        return true
      }

      return [agent.name, agent.headline, agent.profileNote].some((value) => value.toLowerCase().includes(normalized))
    })
  }, [agentSearch, availableAgents, currentMembers])
  const enabledLlmConfigs = llmStore.items.filter((item) => item.enabled)
  const selectedLlmConfig =
    enabledLlmConfigs.find((item) => item.id === llmStore.selectedConfigId) ?? null
  const sendMutation = useMutation({
    mutationFn: ({ groupChatId, message }: { groupChatId: string; message: string }) => {
      const llmConfig = toLlmRequestConfig(readLocalLlmConfigStore())

      return sendAgentGroupChatMessage({
        groupChatId,
        message,
        ...(llmConfig ? { llmConfig } : {}),
      })
    },
    onMutate(variables) {
      const previousDetail = queryClient.getQueryData<AgentGroupChatDetailResponse>([
        "agent-group-chat",
        variables.groupChatId,
      ])
      const optimisticMessage: AgentGroupChatMessage = {
        id: `optimistic-${Date.now()}`,
        groupChatId: variables.groupChatId,
        senderType: "user",
        agentId: null,
        agentName: null,
        agentImageKey: null,
        content: variables.message,
        status: "completed",
        turnIndex: (previousDetail?.messages.at(-1)?.turnIndex ?? 0) + 1,
        createdAtMs: Date.now(),
      }

      queryClient.setQueryData<AgentGroupChatDetailResponse>(
        ["agent-group-chat", variables.groupChatId],
        (current) => current
          ? {
              ...current,
              groupChat: {
                ...current.groupChat,
                latestMessage: optimisticMessage,
                lastMessageAtMs: optimisticMessage.createdAtMs,
                messageCount: current.groupChat.messageCount + 1,
              },
              messages: [...current.messages, optimisticMessage],
            }
          : current,
      )
      queryClient.setQueryData<AgentGroupChatListResponse>(["agent-group-chats"], (current) => current
        ? {
            items: current.items.map((item) => item.id === variables.groupChatId
              ? {
                  ...item,
                  latestMessage: optimisticMessage,
                  lastMessageAtMs: optimisticMessage.createdAtMs,
                  messageCount: item.messageCount + 1,
                }
              : item),
          }
        : current)
      setDraftMessage("")

      return {
        optimisticMessageId: optimisticMessage.id,
        previousDetail,
      }
    },
    async onSuccess(response, variables, context) {
      queryClient.setQueryData<AgentGroupChatDetailResponse>(
        ["agent-group-chat", variables.groupChatId],
        (current) => current
          ? {
              ...current,
              groupChat: response.groupChat,
              messages: [
                ...current.messages.filter((message) => (
                  message.id !== context?.optimisticMessageId &&
                  message.id !== response.userMessage.id &&
                  !response.agentMessages.some((agentMessage) => agentMessage.id === message.id)
                )),
                response.userMessage,
                ...response.agentMessages,
              ],
            }
          : current,
      )
      queryClient.setQueryData<AgentGroupChatListResponse>(["agent-group-chats"], (current) => current
        ? {
            items: [
              response.groupChat,
              ...current.items.filter((item) => item.id !== response.groupChat.id),
            ],
          }
        : current)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["agent-group-chats"] }),
        queryClient.invalidateQueries({ queryKey: ["agent-group-chat", variables.groupChatId] }),
      ])
    },
    onError(_, variables, context) {
      if (context?.previousDetail) {
        queryClient.setQueryData(["agent-group-chat", variables.groupChatId], context.previousDetail)
      }
      setDraftMessage(variables.message)
    },
  })
  const addMemberMutation = useMutation({
    mutationFn: ({ groupChatId, agentId }: { groupChatId: string; agentId: string }) => addAgentGroupChatMembers(groupChatId, { agentIds: [agentId] }),
    async onSuccess(_, variables) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["agent-group-chats"] }),
        queryClient.invalidateQueries({ queryKey: ["agent-group-chat", variables.groupChatId] }),
      ])
    },
  })
  const removeMemberMutation = useMutation({
    mutationFn: ({ groupChatId, memberId }: { groupChatId: string; memberId: string }) => removeAgentGroupChatMember(groupChatId, memberId),
    async onSuccess(_, variables) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["agent-group-chats"] }),
        queryClient.invalidateQueries({ queryKey: ["agent-group-chat", variables.groupChatId] }),
      ])
    },
  })
  const loadMoreMessagesMutation = useMutation({
    mutationFn: ({ groupChatId, cursor }: { groupChatId: string; cursor: string }) => getAgentGroupChatMessages(groupChatId, cursor),
    onSuccess(response, variables) {
      queryClient.setQueryData<AgentGroupChatDetailResponse>(
        ["agent-group-chat", variables.groupChatId],
        (current) => current
          ? {
              ...current,
              messages: [
                ...response.messages,
                ...current.messages.filter((message) => !response.messages.some((item) => item.id === message.id)),
              ],
              nextCursor: response.nextCursor,
            }
          : current,
      )
    },
  })

  useEffect(() => {
    setLlmStore(readLocalLlmConfigStore())

    function handleChanged() {
      setLlmStore(readLocalLlmConfigStore())
    }

    window.addEventListener(localLlmConfigChangedEventName, handleChanged)

    return () => window.removeEventListener(localLlmConfigChangedEventName, handleChanged)
  }, [])

  useEffect(() => {
    if (selectedGroupChatId && groupChats.some((groupChat) => groupChat.id === selectedGroupChatId)) {
      return
    }

    setSelectedGroupChatId(groupChats[0]?.id ?? null)
  }, [groupChats, selectedGroupChatId])

  const messages = detailQuery.data?.messages ?? []
  const isSending = sendMutation.isPending
  const latestMessageId = messages.at(-1)?.id ?? null

  useEffect(() => {
    if (!selectedGroupChat?.id) {
      return
    }

    const shouldScrollToBottom = shouldStickToBottomRef.current || isSending

    if (!shouldScrollToBottom) {
      return
    }

    requestAnimationFrame(() => {
      const container = messageScrollRef.current

      if (!container) {
        return
      }

      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      })
    })
  }, [isSending, latestMessageId, selectedGroupChat?.id])

  return (
    <DashboardShell title="Agent 群聊">
      <main className="flex min-h-[calc(100vh-4rem)] flex-col bg-slate-50/70 lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
        <section className="shrink-0 border-b bg-white px-5 py-5 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 sm:flex">
                <MessagesSquare className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <span>Group Chat</span>
                  <span className="h-px w-10 bg-slate-200" />
                  <span>{groupChats.length} 个群聊</span>
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">Agent 群聊</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  邀请多个 Agent 进入同一个聊天空间。每轮由系统选择最适合的 Agent 回复，先保持受控、清晰、不过度打扰。
                </p>
              </div>
            </div>
            <Button className="rounded-full" onClick={() => setCreateDialogOpen(true)}>
              <CirclePlus className="size-4" />
              新建群聊
            </Button>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl flex-1 gap-5 px-5 py-5 lg:min-h-0 lg:grid-cols-[19rem_minmax(0,1fr)_20rem] lg:overflow-hidden lg:px-8">
          <aside className="flex min-h-[18rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white lg:min-h-0">
            <div className="shrink-0 border-b px-4 py-3">
              <div className="text-sm font-semibold text-slate-950">群聊列表</div>
              <div className="mt-1 text-xs text-muted-foreground">选择一个群聊继续对话</div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {groupChatsQuery.isLoading ? (
                <div className="flex min-h-44 items-center justify-center text-sm text-muted-foreground">正在加载群聊...</div>
              ) : groupChatsQuery.isError ? (
                <div className="flex min-h-44 items-center justify-center px-4 text-center text-sm text-red-600">群聊列表加载失败</div>
              ) : groupChats.length === 0 ? (
                <div className="flex min-h-44 flex-col items-center justify-center px-5 text-center">
                  <MessagesSquare className="size-8 text-slate-300" />
                  <div className="mt-3 text-sm font-medium text-slate-950">还没有群聊</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">创建一个群聊，把不同性格的 Agent 拉到同一个空间里。</div>
                </div>
              ) : (
                groupChats.map((groupChat) => {
                  const selected = groupChat.id === selectedGroupChat?.id

                  return (
                    <button
                      className={cn(
                        "w-full border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0",
                        selected ? "bg-slate-100" : "hover:bg-slate-50",
                      )}
                      key={groupChat.id}
                      onClick={() => setSelectedGroupChatId(groupChat.id)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate text-sm font-semibold text-slate-950">{groupChat.title}</div>
                        <div className="shrink-0 text-[11px] text-muted-foreground">{formatTime(groupChat.lastMessageAtMs)}</div>
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {getMessagePreview(groupChat)}
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        {groupChat.members.slice(0, 4).map((member) => (
                          <AgentAvatar
                            className="size-6 rounded-lg"
                            imageKey={member.imageKey}
                            key={member.id}
                            name={member.name}
                          />
                        ))}
                        {groupChat.members.length > 4 ? (
                          <span className="flex size-6 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-500">
                            +{groupChat.members.length - 4}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-[36rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white lg:min-h-0">
            {selectedGroupChat ? (
              <>
                <header className="flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-slate-950">{selectedGroupChat.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {currentMembers.length} 个 Agent · {detailQuery.data?.groupChat.messageCount ?? selectedGroupChat.messageCount} 条消息
                    </div>
                  </div>
                  <div className="hidden items-center gap-1 sm:flex">
                    {currentMembers.slice(0, 5).map((member) => (
                      <AgentAvatar
                        className="size-8 rounded-xl"
                        imageKey={member.imageKey}
                        key={member.id}
                        name={member.name}
                      />
                    ))}
                  </div>
                </header>
                <div ref={messageScrollRef} className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-5 py-5">
                  {detailQuery.isLoading ? (
                    <div className="flex h-full min-h-80 items-center justify-center text-sm text-muted-foreground">正在加载群聊消息...</div>
                  ) : detailQuery.isError ? (
                    <div className="flex h-full min-h-80 items-center justify-center text-sm text-red-600">群聊消息加载失败</div>
                  ) : messages.length === 0 ? (
                    <div className="flex min-h-80 items-center justify-center">
                      <div className="max-w-md text-center">
                        <MessageCircle className="mx-auto size-10 text-slate-300" />
                        <div className="mt-3 text-sm font-semibold text-slate-950">开始第一轮群聊</div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          你可以直接提问，也可以点名某个 Agent。说“你们怎么看”时，会触发多个 Agent 参与。
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {detailQuery.data?.nextCursor ? (
                        <div className="flex justify-center">
                          <Button
                            className="rounded-full"
                            disabled={loadMoreMessagesMutation.isPending}
                            onClick={() => {
                              if (selectedGroupChat && detailQuery.data?.nextCursor) {
                                loadMoreMessagesMutation.mutate({
                                  groupChatId: selectedGroupChat.id,
                                  cursor: detailQuery.data.nextCursor,
                                })
                              }
                            }}
                            size="sm"
                            variant="outline"
                          >
                            {loadMoreMessagesMutation.isPending ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : null}
                            加载更早消息
                          </Button>
                        </div>
                      ) : null}
                      {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                      ))}
                    </div>
                  )}
                  {sendMutation.isPending ? (
                    <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Agent 正在组织这轮回复...
                    </div>
                  ) : null}
                  {sendMutation.isError ? (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {sendMutation.error instanceof Error ? sendMutation.error.message : "发送失败"}
                    </div>
                  ) : null}
                </div>
                <footer className="shrink-0 border-t bg-white px-4 py-4">
                  <div className="mx-auto grid max-w-4xl gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <RadioTower className="size-3.5" />
                      <Select
                        onValueChange={(value) => {
                          selectLocalLlmConfig(value === "platform-default" ? null : value)
                          setLlmStore(readLocalLlmConfigStore())
                        }}
                        value={selectedLlmConfig?.id ?? "platform-default"}
                      >
                        <SelectTrigger className="h-8 w-fit min-w-44 rounded-full border-slate-200 bg-slate-50 px-3 text-xs">
                          <SelectValue placeholder="平台默认" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-none">
                          <SelectItem value="platform-default">平台默认</SelectItem>
                          {enabledLlmConfigs.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} · {item.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span>每轮最多 3 个 Agent 回复</span>
                    </div>
                    <div className="flex gap-3">
                      <Textarea
                        className="min-h-20 resize-none rounded-2xl border-slate-200 bg-slate-50 text-sm"
                        disabled={isSending}
                        onChange={(event) => setDraftMessage(event.currentTarget.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault()
                            const text = draftMessage.trim()

                            if (text && selectedGroupChat && !isSending) {
                              shouldStickToBottomRef.current = true
                              sendMutation.mutate({ groupChatId: selectedGroupChat.id, message: text })
                            }
                          }
                        }}
                        placeholder="输入群聊消息。可以点名 Agent，也可以说“你们怎么看”。"
                        value={draftMessage}
                      />
                      <Button
                        className="mt-auto rounded-full"
                        disabled={!draftMessage.trim() || !selectedGroupChat || isSending}
                        onClick={() => {
                          if (selectedGroupChat) {
                            shouldStickToBottomRef.current = true
                            sendMutation.mutate({
                              groupChatId: selectedGroupChat.id,
                              message: draftMessage.trim(),
                            })
                          }
                        }}
                        size="icon"
                      >
                        {isSending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
                      </Button>
                    </div>
                  </div>
                </footer>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-5 py-12">
                <div className="max-w-md text-center">
                  <MessagesSquare className="mx-auto size-12 text-slate-300" />
                  <h2 className="mt-4 text-base font-semibold text-slate-950">创建你的第一个 Agent 群聊</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    群聊可以让不同性格的 Agent 一起参与同一个话题，但每轮回复会保持受控，不会刷屏。
                  </p>
                  <Button className="mt-5 rounded-full" onClick={() => setCreateDialogOpen(true)}>
                    <CirclePlus className="size-4" />
                    新建群聊
                  </Button>
                </div>
              </div>
            )}
          </section>

          <aside className="grid content-start gap-5 overflow-y-auto lg:min-h-0">
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-950">群成员</div>
                  <div className="mt-1 text-xs text-muted-foreground">{currentMembers.length}/6 个 Agent</div>
                </div>
                <Users className="size-4 text-slate-400" />
              </div>
              <div className="mt-4 grid gap-2">
                {currentMembers.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-muted-foreground">
                    暂无成员
                  </div>
                ) : (
                  currentMembers.map((member) => (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 px-2 py-2" key={member.id}>
                      <AgentAvatar className="size-9 rounded-xl" imageKey={member.imageKey} name={member.name} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-950">{member.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{member.headline || "Agent 伴侣"}</div>
                      </div>
                      <button
                        aria-label={`移除 ${member.name}`}
                        className="flex size-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                        disabled={removeMemberMutation.isPending || currentMembers.length <= 1}
                        onClick={() => {
                          if (selectedGroupChat) {
                            removeMemberMutation.mutate({
                              groupChatId: selectedGroupChat.id,
                              memberId: member.id,
                            })
                          }
                        }}
                        type="button"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-950">邀请 Agent</div>
                  <div className="mt-1 text-xs text-muted-foreground">从你的伴侣列表中加入</div>
                </div>
                <Bot className="size-4 text-slate-400" />
              </div>
              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="h-9 rounded-full border-slate-200 bg-slate-50 pl-9 text-sm"
                  onChange={(event) => setAgentSearch(event.currentTarget.value)}
                  placeholder="搜索 Agent"
                  value={agentSearch}
                />
              </div>
              <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto">
                {agentInboxQuery.isLoading ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-muted-foreground">正在加载 Agent...</div>
                ) : filteredAvailableAgents.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-muted-foreground">没有可邀请的 Agent</div>
                ) : (
                  filteredAvailableAgents.map((agent) => (
                    <button
                      className="flex items-center gap-3 rounded-xl border border-slate-100 px-2 py-2 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!selectedGroupChat || currentMembers.length >= 6 || addMemberMutation.isPending}
                      key={agent.id}
                      onClick={() => {
                        if (selectedGroupChat) {
                          addMemberMutation.mutate({
                            groupChatId: selectedGroupChat.id,
                            agentId: agent.id,
                          })
                        }
                      }}
                      type="button"
                    >
                      <AgentAvatar className="size-9 rounded-xl" imageKey={agent.imageKey} name={agent.name} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-950">{agent.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{agent.headline}</div>
                      </div>
                      <CirclePlus className="size-4 text-slate-400" />
                    </button>
                  ))
                )}
              </div>
            </section>
          </aside>
        </section>

        <GroupCreateDialog
          agents={availableAgents}
          onCreated={setSelectedGroupChatId}
          onOpenChange={setCreateDialogOpen}
          open={createDialogOpen}
        />
      </main>
    </DashboardShell>
  )
}
