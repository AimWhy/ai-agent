"use client"

import { useMemo, useState } from "react"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { TextStreamChatTransport } from "ai"
import type { InboxChatRequest } from "@repo/contracts"
import {
  Bot,
  Clock3,
  FileText,
  Heart,
  PenLine,
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
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import { getWebClientEnv } from "@/env.client"
import { cn } from "@/lib/utils"

type InboxMail = InboxChatRequest["mail"] & {
  date: string
}

type InboxChatProps = {
  mail: InboxMail
}

const quickPrompts = [
  "帮我用轻松自然的语气回复 TA。",
  "根据 TA 的信息找一个可以延续的话题。",
  "帮我写一句不尴尬的开场白。",
  "判断这段关系下一步适合怎么推进。",
]

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
}

export function InboxChat({ mail }: InboxChatProps) {
  const [draftMessage, setDraftMessage] = useState("")
  const transport = useMemo(
    () => new TextStreamChatTransport<UIMessage>({
      api: `${getWebClientEnv().NEXT_PUBLIC_API_BASE_URL}/rpc/chat/inbox`,
      body: {
        mail,
      },
    }),
    [mail],
  )
  const initialMessages: UIMessage[] = [
    {
      id: "initial-assistant-message",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "我已读取这封邮件，可以帮你总结重点、起草回复或拆解后续行动。",
        },
      ],
    },
  ]
  const { messages, sendMessage, status, error, stop } = useChat({
    transport,
    messages: initialMessages,
  })
  const isSending = status === "submitted" || status === "streaming"
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_32rem),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
      <div className="border-b bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-950 text-base font-semibold text-white">
              {mail.sender
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
                  {mail.sender}
                </h2>
                <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-medium text-emerald-700">
                  在线
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <UserRound className="size-3.5" />
                  AI 电子伴侣
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-3.5" />
                  {mail.date}
                </span>
                <span className="truncate">{mail.senderEmail}</span>
              </div>
              <p className="mt-2 line-clamp-1 text-sm text-slate-600">
                {mail.subject}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-white xl:min-w-96">
            <div className="border-r border-slate-200 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Heart className="size-3.5 text-rose-600" />
                心动值
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-950">92%</p>
            </div>
            <div className="border-r border-slate-200 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Sparkles className="size-3.5 text-violet-600" />
                共同点
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-slate-950">{mail.category}</p>
            </div>
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                节奏
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-slate-950">轻松聊</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile note</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 whitespace-break-spaces text-slate-700">
                {mail.teaser}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="inline-flex h-7 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600">
                {mail.priority}
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
              Assistant is using the selected email as context
            </div>
          </div>

          {messages.map((message) => {
            const isUser = message.role === "user"

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
                        ? "rounded-2xl rounded-tr-md border-slate-900 bg-slate-950 text-white"
                        : "rounded-2xl rounded-tl-md border-slate-200 bg-white text-slate-800",
                    )}
                  >
                    <MessageResponse
                      className={cn(
                        "[&_p]:leading-6",
                        isUser && "[&_a]:text-white [&_code]:text-white",
                      )}
                    >
                      {getMessageText(message)}
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
          {status === "submitted" ? (
            <div className="flex w-full items-start gap-3">
              <span className="mt-6 flex size-9 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-700">
                <Bot className="size-4" />
              </span>
              <div className="flex min-w-0 max-w-[min(34rem,82%)] flex-col gap-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-violet-700">
                  <Sparkles className="size-3.5" />
                  <span>AI Assistant</span>
                </div>
                <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800">
                  <MessageResponse>正在连接模型...</MessageResponse>
                </div>
              </div>
            </div>
          ) : null}
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-destructive">
              {error.message}
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
              <span className="flex items-center gap-1.5">
                <FileText className="size-3.5" />
                引用当前邮件
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
