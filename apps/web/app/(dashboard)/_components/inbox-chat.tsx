"use client"

import { useEffect, useMemo, useState } from "react"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { TextStreamChatTransport } from "ai"
import type { InboxChatRequest } from "@repo/contracts"
import {
  Bot,
  Clock3,
  Heart,
  MessageCircle,
  PenLine,
  RadioTower,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { MessageResponse } from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import { readClientSession } from "@/auth/client-session"
import {
  localLlmConfigChangedEventName,
  readLocalLlmConfigStore,
  selectLocalLlmConfig,
  type LocalLlmConfigStore,
} from "@/auth/local-llm-config"
import { getWebClientEnv } from "@/env.client"
import { cn } from "@/lib/utils"

type ChatConversation = InboxChatRequest["conversation"]

type InboxChatProps = {
  conversation: ChatConversation
}

const quickPrompts = [
  "帮我用轻松自然的语气回复 TA。",
  "根据 TA 的信息找一个可以延续的话题。",
  "帮我写一句不尴尬的开场白。",
  "判断这段关系下一步适合怎么推进。",
]

const INITIAL_ASSISTANT_MESSAGE_ID = "initial-assistant-message"
const TYPEWRITER_INTERVAL_MS = 18
const TYPEWRITER_CHARS_PER_STEP = 1

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
}

function getTextLength(text: string) {
  return Array.from(text).length
}

function sliceText(text: string, length: number) {
  return Array.from(text).slice(0, length).join("")
}

function formatChatErrorMessage(error: Error) {
  try {
    const parsed = JSON.parse(error.message) as {
      error?: {
        message?: unknown
      }
    }
    const message = parsed.error?.message

    if (typeof message === "string" && message.trim()) {
      return message
    }
  } catch {
    // Keep the original error message when it is not a JSON API response.
  }

  return error.message || "聊天请求失败，请检查 LLM 配置。"
}

function TypingBubble() {
  return (
    <div className="flex w-full items-start gap-3">
      <span className="mt-6 flex size-9 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-700">
        <Bot className="size-4" />
      </span>
      <div className="flex min-w-0 max-w-[min(34rem,82%)] flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-medium text-violet-700">
          <Sparkles className="size-3.5" />
          <span>AI Assistant</span>
        </div>
        <div className="rounded-xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-500">正在回复</span>
            <div className="flex items-center gap-1">
              <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InboxChat({ conversation }: InboxChatProps) {
  const [draftMessage, setDraftMessage] = useState("")
  const [llmStore, setLlmStore] = useState<LocalLlmConfigStore>({ selectedConfigId: null, items: [] })
  const enabledLlmConfigs = llmStore.items.filter((item) => item.enabled)
  const selectedLlmConfig =
    enabledLlmConfigs.find((item) => item.id === llmStore.selectedConfigId) ?? null
  const transport = useMemo(
    () => new TextStreamChatTransport<UIMessage>({
      api: `${getWebClientEnv().NEXT_PUBLIC_API_BASE_URL}/rpc/chat/inbox`,
      prepareSendMessagesRequest({ api, body, messages }) {
        const storedSession = readClientSession()
        const latestStore = readLocalLlmConfigStore()
        const selectedConfig = latestStore.items.find((item) => item.enabled && item.id === latestStore.selectedConfigId)
        const localLlmConfig = selectedConfig
          ? {
              providerName: selectedConfig.providerName,
              baseURL: selectedConfig.baseURL,
              model: selectedConfig.model,
              apiKey: selectedConfig.apiKey,
              wireApi: selectedConfig.wireApi,
              ...(selectedConfig.reasoningEffort ? { reasoningEffort: selectedConfig.reasoningEffort } : {}),
            }
          : null

        return {
          api,
          headers: storedSession
            ? { authorization: `Bearer ${storedSession.accessToken}` }
            : undefined,
          body: {
            ...body,
            messages,
            conversation,
            ...(localLlmConfig ? { llmConfig: localLlmConfig } : {}),
          },
        }
      },
    }),
    [conversation],
  )
  const initialMessages: UIMessage[] = [
    {
      id: INITIAL_ASSISTANT_MESSAGE_ID,
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "我已读取当前聊天对象的资料和上下文，可以帮你自然接话、起草回复或判断下一步节奏。",
        },
      ],
    },
  ]
  const { messages, sendMessage, status, error, stop } = useChat({
    transport,
    messages: initialMessages,
  })
  const isSending = status === "submitted" || status === "streaming"
  const [visibleAssistantTextById, setVisibleAssistantTextById] = useState<Record<string, string>>({})
  const assistantTextSignature = messages
    .filter((message) => message.role === "assistant" && message.id !== INITIAL_ASSISTANT_MESSAGE_ID)
    .map((message) => `${message.id}:${getMessageText(message)}`)
    .join("\n")
  const assistantFullTextById = useMemo(() => {
    const textById: Record<string, string> = {}

    for (const message of messages) {
      if (message.role !== "assistant" || message.id === INITIAL_ASSISTANT_MESSAGE_ID) {
        continue
      }

      const text = getMessageText(message)

      if (text) {
        textById[message.id] = text
      }
    }

    return textById
  }, [assistantTextSignature, messages])
  const latestMessage = messages[messages.length - 1]
  const latestAssistantText =
    latestMessage?.role === "assistant" ? getMessageText(latestMessage).trim() : ""
  const shouldShowTypingBubble =
    status === "submitted" ||
    (status === "streaming" && latestMessage?.role !== "assistant") ||
    (status === "streaming" && latestMessage?.role === "assistant" && !latestAssistantText)
  const hasTypewriterWork = Object.entries(assistantFullTextById).some(([id, fullText]) => {
    const visibleText = visibleAssistantTextById[id] ?? ""

    return getTextLength(visibleText) < getTextLength(fullText)
  })

  useEffect(() => {
    function reloadLlmStore() {
      setLlmStore(readLocalLlmConfigStore())
    }

    reloadLlmStore()
    window.addEventListener(localLlmConfigChangedEventName, reloadLlmStore)

    return () => {
      window.removeEventListener(localLlmConfigChangedEventName, reloadLlmStore)
    }
  }, [])

  useEffect(() => {
    setVisibleAssistantTextById((current) => {
      const next: Record<string, string> = {}
      let changed = false

      for (const [id, fullText] of Object.entries(assistantFullTextById)) {
        const visibleText = current[id]

        if (visibleText === undefined || !fullText.startsWith(visibleText)) {
          next[id] = sliceText(fullText, TYPEWRITER_CHARS_PER_STEP)
          changed = true
          continue
        }

        next[id] = visibleText
      }

      if (Object.keys(current).length !== Object.keys(next).length) {
        changed = true
      }

      return changed ? next : current
    })
  }, [assistantFullTextById])

  useEffect(() => {
    if (!hasTypewriterWork) {
      return
    }

    const timer = window.setTimeout(() => {
      setVisibleAssistantTextById((current) => {
        let changed = false
        const next = { ...current }

        for (const [id, fullText] of Object.entries(assistantFullTextById)) {
          const visibleText = current[id] ?? ""
          const visibleLength = getTextLength(visibleText)
          const fullLength = getTextLength(fullText)

          if (visibleLength >= fullLength) {
            continue
          }

          next[id] = sliceText(fullText, visibleLength + TYPEWRITER_CHARS_PER_STEP)
          changed = true
        }

        return changed ? next : current
      })
    }, TYPEWRITER_INTERVAL_MS)

    return () => window.clearTimeout(timer)
  }, [assistantFullTextById, hasTypewriterWork, visibleAssistantTextById])

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_32rem),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
      <div className="border-b bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-950 text-base font-semibold text-white">
              {conversation.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
              <span className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-500" />
            </span>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="truncate text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  {conversation.name}
                </h2>
                <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-medium text-emerald-700">
                  {conversation.status}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <UserRound className="size-3.5" />
                  AI 电子伴侣
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-3.5" />
                  {conversation.lastActive}
                </span>
                <span className="truncate">{conversation.handle}</span>
              </div>
              <p className="mt-2 line-clamp-1 text-sm text-slate-600">
                {conversation.headline}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-white xl:min-w-96">
            <div className="border-r border-slate-200 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Heart className="size-3.5 text-rose-600" />
                心动值
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-950">{conversation.chemistry}</p>
            </div>
            <div className="border-r border-slate-200 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Sparkles className="size-3.5 text-violet-600" />
                共同点
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-slate-950">{conversation.topic}</p>
            </div>
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                节奏
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-slate-950">{conversation.rhythm}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile note</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 whitespace-break-spaces text-slate-700">
                {conversation.profileNote}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="inline-flex h-7 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600">
                {conversation.relationship}
              </span>
              <span className="inline-flex h-7 items-center rounded-full border border-violet-200 bg-violet-50 px-3 text-xs font-medium text-violet-700">
                Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      <Conversation className="min-h-0">
        <ConversationContent className="mx-auto w-full max-w-4xl gap-6 px-4 py-6 sm:px-6">
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600">
              <Bot className="size-3.5 text-violet-600" />
              Assistant is using the selected chat context
            </div>
          </div>

          {messages.map((message) => {
            const isUser = message.role === "user"
            const messageText = getMessageText(message)
            const visibleMessageText =
              !isUser && message.id !== INITIAL_ASSISTANT_MESSAGE_ID
                ? visibleAssistantTextById[message.id] ?? sliceText(messageText, TYPEWRITER_CHARS_PER_STEP)
                : messageText

            if (!isUser && !messageText.trim()) {
              return null
            }

            return (
              <div
                className={cn(
                  "flex w-full items-start gap-3",
                  isUser ? "justify-end" : "justify-start",
                )}
                key={message.id}
              >
                {!isUser ? (
                  <span className="mt-6 flex size-9 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-700">
                    <Bot className="size-4" />
                  </span>
                ) : null}

                <div
                  className={cn(
                    "flex min-w-0 max-w-[min(34rem,82%)] flex-col gap-1.5",
                    isUser ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2 text-xs font-medium",
                      isUser ? "text-slate-500" : "text-violet-700",
                    )}
                  >
                    {!isUser ? <Sparkles className="size-3.5" /> : null}
                    <span>{isUser ? "You" : "AI Assistant"}</span>
                  </div>

                  <div
                    className={cn(
                      "relative border px-4 py-3 text-sm leading-6",
                      isUser
                        ? "rounded-xl rounded-tr-sm border-slate-900 bg-slate-950 text-white"
                        : "rounded-xl rounded-tl-sm border-slate-200 bg-white text-slate-800",
                    )}
                  >
                    <MessageResponse
                      className={cn(
                        "[&_p]:leading-6",
                        isUser && "[&_a]:text-white [&_code]:text-white",
                      )}
                    >
                      {visibleMessageText}
                    </MessageResponse>
                  </div>
                </div>

                {isUser ? (
                  <span className="mt-6 flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-900 bg-slate-950 text-white">
                    <UserRound className="size-4" />
                  </span>
                ) : null}
              </div>
            )
          })}
          {shouldShowTypingBubble ? <TypingBubble /> : null}
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-destructive">
              {formatChatErrorMessage(error)}
            </div>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
        <PromptInput
          className="mx-auto max-w-4xl"
          onSubmit={(message) => {
            const text = message.text.trim()

            if (!text) {
              return
            }

            sendMessage({ text })
            setDraftMessage("")
          }}
        >
          <PromptInputHeader className="border-b bg-slate-50/70 px-3 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
              <span className="shrink-0 text-xs font-medium text-muted-foreground">快捷输入</span>
              {quickPrompts.map((prompt) => (
                <button
                  className="h-7 shrink-0 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSending}
                  key={prompt}
                  onClick={() => setDraftMessage(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </PromptInputHeader>
          <PromptInputTextarea
            className="max-h-44 min-h-20 px-3 py-3 text-sm"
            disabled={isSending}
            onChange={(event) => setDraftMessage(event.currentTarget.value)}
            placeholder="输入想说的话，或先选择上方快捷提示..."
            value={draftMessage}
          />
          <PromptInputFooter className="border-t bg-slate-50/70 px-3 py-2">
            <PromptInputTools className="min-w-0 gap-2 text-xs text-muted-foreground">
              <label className="flex min-w-0 items-center gap-1.5">
                <RadioTower className="size-3.5" />
                <PromptInputSelect
                  disabled={isSending}
                  onValueChange={(value) => {
                    selectLocalLlmConfig(value === "platform-default" ? null : value)
                    setLlmStore(readLocalLlmConfigStore())
                  }}
                  value={selectedLlmConfig?.id ?? "platform-default"}
                >
                  <PromptInputSelectTrigger
                    aria-label="选择本次聊天使用的 LLM"
                    className="h-7 max-w-56 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 data-placeholder:text-slate-500"
                    size="sm"
                  >
                    <PromptInputSelectValue placeholder="平台默认" />
                  </PromptInputSelectTrigger>
                  <PromptInputSelectContent className="min-w-56 rounded-xl border border-slate-200 shadow-none">
                    <PromptInputSelectItem value="platform-default">
                      平台默认
                    </PromptInputSelectItem>
                    {enabledLlmConfigs.map((item) => (
                      <PromptInputSelectItem key={item.id} value={item.id}>
                        {item.name} · {item.model} · {item.wireApi === "responses" ? "Responses" : "Chat"}
                      </PromptInputSelectItem>
                    ))}
                  </PromptInputSelectContent>
                </PromptInputSelect>
              </label>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="size-3.5" />
                引用当前聊天
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <PenLine className="size-3.5" />
                Enter 发送
              </span>
            </PromptInputTools>
            <PromptInputSubmit
              className="rounded-full"
              disabled={isSending}
              onStop={stop}
              status={status}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  )
}
