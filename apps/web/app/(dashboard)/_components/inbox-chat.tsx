"use client"

import { useMemo } from "react"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { TextStreamChatTransport } from "ai"
import type { InboxChatRequest } from "@repo/contracts"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"
import { getWebClientEnv } from "@/env.client"

type InboxMail = InboxChatRequest["mail"] & {
  date: string
}

type InboxChatProps = {
  mail: InboxMail
}

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
}

export function InboxChat({ mail }: InboxChatProps) {
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
    <div className="flex flex-1 flex-col">
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{mail.subject}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mail.sender} · {mail.senderEmail}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{mail.date}</span>
        </div>
      </div>

      <Conversation>
        <ConversationContent>
          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                <MessageResponse>{getMessageText(message)}</MessageResponse>
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" ? (
            <Message from="assistant">
              <MessageContent>
                <MessageResponse>正在连接模型...</MessageResponse>
              </MessageContent>
            </Message>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput
        onSubmit={(message) => {
          sendMessage({ text: message.text })
        }}
      >
        <PromptInputTextarea
          defaultValue="请帮我起草一段简洁专业的回复。"
          disabled={isSending}
          placeholder="输入回复内容..."
        />
        <PromptInputSubmit
          disabled={isSending}
          onStop={stop}
          status={status}
        />
      </PromptInput>
    </div>
  )
}
