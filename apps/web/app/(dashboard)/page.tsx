import {
  BadgeCheck,
  Bot,
  CheckCircle2,
  Clock3,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Search,
  Sparkles,
  Star,
} from "lucide-react"
import { DashboardShell } from "./_components/dashboard-shell"
import { InboxChat } from "./_components/inbox-chat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const chatConversations = [
  {
    name: "William Smith",
    handle: "@william",
    headline: "明天想约你一起喝咖啡",
    lastActive: "09:34 AM",
    status: "在线",
    relationship: "刚认识",
    topic: "咖啡 / 城市散步",
    chemistry: "92%",
    chemistryLabel: "高匹配",
    chemistryLevel: "High",
    rhythm: "轻松推进",
    unread: true,
    pinned: true,
    profileNote:
      "他回复很稳定，喜欢用轻松的方式推进话题。上次聊到周末新开的咖啡店，可以从这个共同点自然延续。",
  },
  {
    name: "Alice Smith",
    handle: "@alice",
    headline: "分享了最近喜欢的一部电影",
    lastActive: "Yesterday",
    status: "在线",
    relationship: "熟悉中",
    topic: "电影 / 情绪共鸣",
    chemistry: "78%",
    chemistryLabel: "自然",
    chemistryLevel: "Normal",
    rhythm: "慢慢熟悉",
    unread: true,
    pinned: false,
    profileNote:
      "她喜欢先聊感受再聊观点，适合用轻松好奇的方式接话，不要太快转成建议。",
  },
  {
    name: "Bob Johnson",
    handle: "@bob",
    headline: "约你周末一起户外走走",
    lastActive: "2 days ago",
    status: "离线",
    relationship: "朋友感",
    topic: "徒步 / 周末计划",
    chemistry: "64%",
    chemistryLabel: "低压",
    chemistryLevel: "Low",
    rhythm: "低压邀约",
    unread: false,
    pinned: false,
    profileNote:
      "他表达直接但没有压迫感，适合给出明确偏好，再留一个轻松选择。",
  },
  {
    name: "Emily Davis",
    handle: "@emily",
    headline: "问你最近是不是有点忙",
    lastActive: "2 days ago",
    status: "在线",
    relationship: "暧昧试探",
    topic: "日常关心 / 边界感",
    chemistry: "88%",
    chemistryLabel: "高匹配",
    chemistryLevel: "High",
    rhythm: "温柔试探",
    unread: true,
    pinned: false,
    profileNote:
      "她会主动关心，但也很在意对方是否舒服。回复可以真诚一点，同时不要解释过度。",
  },
  {
    name: "Michael Wilson",
    handle: "@michael",
    headline: "发来一首你可能会喜欢的歌",
    lastActive: "1 week ago",
    status: "离线",
    relationship: "有共同兴趣",
    topic: "音乐 / 分享欲",
    chemistry: "84%",
    chemistryLabel: "高匹配",
    chemistryLevel: "High",
    rhythm: "兴趣延续",
    unread: false,
    pinned: true,
    profileNote:
      "他喜欢通过作品表达情绪，适合回应具体感受，再轻轻抛出自己的联想。",
  },
  {
    name: "Sarah Brown",
    handle: "@sarah",
    headline: "想继续聊上次那个展览",
    lastActive: "1 week ago",
    status: "离线",
    relationship: "慢热",
    topic: "展览 / 审美",
    chemistry: "76%",
    chemistryLabel: "自然",
    chemistryLevel: "Normal",
    rhythm: "细节回应",
    unread: false,
    pinned: false,
    profileNote:
      "她更吃细节和真诚，不适合太油的夸赞。可以从上次展览里的一个画面切入。",
  },
  {
    name: "David Lee",
    handle: "@david",
    headline: "提出一个很有意思的约会点子",
    lastActive: "1 week ago",
    status: "离线",
    relationship: "轻松互动",
    topic: "创意约会 / 城市探索",
    chemistry: "73%",
    chemistryLabel: "自然",
    chemistryLevel: "Normal",
    rhythm: "轻松提议",
    unread: false,
    pinned: false,
    profileNote:
      "他喜欢有画面感的计划，回复可以带一点玩笑，再给出一个具体时间窗口。",
  },
  {
    name: "Olivia Wilson",
    handle: "@olivia",
    headline: "聊到下个月想去海边",
    lastActive: "1 week ago",
    status: "离线",
    relationship: "低压陪伴",
    topic: "旅行 / 放松",
    chemistry: "61%",
    chemistryLabel: "低压",
    chemistryLevel: "Low",
    rhythm: "慢节奏",
    unread: false,
    pinned: false,
    profileNote:
      "她最近更想放松，不适合密集追问。可以回应向往感，再留一个开放话题。",
  },
  {
    name: "James Martin",
    handle: "@james",
    headline: "问你最近有没有参加什么活动",
    lastActive: "1 week ago",
    status: "离线",
    relationship: "共同社交圈",
    topic: "活动 / 城市生活",
    chemistry: "70%",
    chemistryLabel: "自然",
    chemistryLevel: "Normal",
    rhythm: "自然寒暄",
    unread: false,
    pinned: false,
    profileNote:
      "他适合从具体活动聊起，最好别只回复一句泛泛的寒暄。",
  },
  {
    name: "Sophia White",
    handle: "@sophia",
    headline: "想约一顿轻松的晚餐",
    lastActive: "1 week ago",
    status: "离线",
    relationship: "朋友转暧昧",
    topic: "晚餐 / 关系推进",
    chemistry: "66%",
    chemistryLabel: "低压",
    chemistryLevel: "Low",
    rhythm: "自然推进",
    unread: false,
    pinned: false,
    profileNote:
      "她主动但节奏不快，适合给出明确但轻松的回应，让邀约听起来像自然发生。",
  },
]

const selectedConversation = chatConversations[0]!
const unreadCount = chatConversations.filter((conversation) => conversation.unread).length
const crushCount = chatConversations.filter((conversation) => conversation.chemistryLevel === "High").length
const activeChatCount = chatConversations.filter(
  (conversation) => conversation.unread || conversation.chemistryLevel === "High" || conversation.pinned,
).length

type ChatConversation = (typeof chatConversations)[number]

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function chemistryClassName(level: ChatConversation["chemistryLevel"]) {
  if (level === "High") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  if (level === "Low") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  return "border-sky-200 bg-sky-50 text-sky-700"
}

function InboxList() {
  return (
    <aside className="flex h-[52vh] min-h-0 w-full max-h-[34rem] shrink-0 flex-col border-b bg-background lg:h-auto lg:max-h-none lg:w-[clamp(21rem,30vw,26rem)] lg:border-r lg:border-b-0">
      <div className="border-b bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.9))] px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-700">
              <Bot className="size-5" />
              <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                AI Social Companion
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-slate-950">Chats</h1>
                <span className="inline-flex h-5 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-medium text-emerald-700">
                  在线
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                陪你认识、筛选和延续关系
              </p>
            </div>
          </div>
          <Button
            aria-label="更多聊天操作"
            className="rounded-full"
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-950">今天的缘分动态</p>
                <span className="shrink-0 text-[11px] font-medium text-muted-foreground">刚刚在线</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                我帮你整理了 {activeChatCount} 位值得继续聊的人，其中 {crushCount} 位互动热度较高。
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-3 divide-x divide-slate-200">
            <div className="flex min-w-0 flex-col gap-2 px-3 py-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <MessageCircle className="size-3.5 text-blue-600" />
                <span>待聊</span>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="text-xl font-semibold leading-none text-slate-950">{unreadCount}</span>
                <span className="pb-0.5 text-[11px] text-muted-foreground">new</span>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-2 px-3 py-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <Heart className="size-3.5 text-rose-600" />
                <span>心动</span>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="text-xl font-semibold leading-none text-slate-950">{crushCount}</span>
                <span className="pb-0.5 text-[11px] text-muted-foreground">hot</span>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-2 px-3 py-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                <span>活跃</span>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="text-xl font-semibold leading-none text-slate-950">{activeChatCount}</span>
                <span className="pb-0.5 text-[11px] text-muted-foreground">online</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 transition-colors focus-within:border-slate-400">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500">
            <Search className="size-3.5" />
          </span>
          <Input
            aria-label="搜索聊天对象"
            className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
            placeholder="搜索昵称、兴趣或聊天记录"
          />
          <span className="hidden shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-flex">
            ⌘K
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1" aria-label="Social companion filters">
          {[
            ["Matches", "推荐"],
            ["Unread", "待聊"],
            ["Crush", "心动"],
            ["Close", "熟悉"],
          ].map(([key, label], index) => (
            <button
              className={cn(
                "h-7 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors",
                index === 0
                  ? "border-slate-900 bg-slate-950 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
              key={key}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex items-center justify-between border-b px-4 py-2.5 text-xs font-medium text-muted-foreground sm:px-5">
          <span>最近聊天</span>
          <span>{chatConversations.length} 位联系人</span>
        </div>
        <div className="divide-y divide-slate-200">
          {chatConversations.map((conversation, index) => (
            <a
              aria-current={index === 0 ? "page" : undefined}
              href="#"
              key={conversation.handle}
              className={cn(
                "group relative flex gap-3 px-4 py-3.5 text-sm transition-colors sm:px-5",
                "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400",
                index === 0
                  ? "bg-slate-100/90"
                  : "bg-white hover:bg-slate-50",
              )}
            >
              {index === 0 ? (
                <>
                  <span className="absolute inset-y-0 left-0 w-1 bg-slate-950" />
                  <span className="absolute inset-y-0 right-0 w-px bg-slate-300" />
                </>
              ) : null}

              <span
                className={cn(
                  "relative flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                  index === 0
                    ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700 group-hover:bg-slate-200",
                )}
              >
                {getInitials(conversation.name)}
                {conversation.unread ? (
                  <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-blue-600" />
                ) : null}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "truncate font-semibold",
                      index === 0 || conversation.unread ? "text-slate-950" : "text-slate-700",
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
                      index === 0 ? "text-slate-950" : "text-slate-900",
                    )}
                  >
                    {conversation.headline}
                  </span>
                </div>

                <p className="mt-1.5 line-clamp-2 text-xs leading-5 whitespace-break-spaces text-muted-foreground">
                  {conversation.profileNote}
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
                  {index === 0 ? (
                    <span className="inline-flex h-6 items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 text-[11px] font-medium text-violet-700">
                      <Sparkles className="size-3" />
                      Ready
                    </span>
                  ) : null}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="hidden border-t bg-white px-4 py-3 sm:block">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="flex items-center gap-2">
            <BadgeCheck className="size-4 text-emerald-600" />
            关系偏好已同步
          </span>
          <span className="flex items-center gap-1">
            <Clock3 className="size-3.5" />
            2m ago
          </span>
        </div>
      </div>
    </aside>
  )
}

export default function Page() {
  return (
    <DashboardShell title="聊天">
      <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col overflow-hidden bg-slate-50/70 lg:flex-row">
        <InboxList />

        <InboxChat conversation={selectedConversation} />
      </div>
    </DashboardShell>
  )
}
