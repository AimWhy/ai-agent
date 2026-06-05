import {
  BadgeCheck,
  Bot,
  CheckCircle2,
  Clock3,
  Heart,
  Mail,
  MailOpen,
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

const inboxMails = [
  {
    name: "William Smith",
    sender: "William Smith",
    email: "williamsmith@example.com",
    senderEmail: "williamsmith@example.com",
    subject: "Meeting Tomorrow",
    date: "09:34 AM",
    priority: "High",
    category: "Work",
    unread: true,
    pinned: true,
    teaser:
      "Hi team, just a reminder about our meeting tomorrow at 10 AM.\nPlease come prepared with your project updates.",
  },
  {
    name: "Alice Smith",
    sender: "Alice Smith",
    email: "alicesmith@example.com",
    senderEmail: "alicesmith@example.com",
    subject: "Re: Project Update",
    date: "Yesterday",
    priority: "Normal",
    category: "Project",
    unread: true,
    pinned: false,
    teaser:
      "Thanks for the update. The progress looks great so far.\nLet's schedule a call to discuss the next steps.",
  },
  {
    name: "Bob Johnson",
    sender: "Bob Johnson",
    email: "bobjohnson@example.com",
    senderEmail: "bobjohnson@example.com",
    subject: "Weekend Plans",
    date: "2 days ago",
    priority: "Low",
    category: "Team",
    unread: false,
    pinned: false,
    teaser:
      "Hey everyone! I'm thinking of organizing a team outing this weekend.\nWould you be interested in a hiking trip or a beach day?",
  },
  {
    name: "Emily Davis",
    sender: "Emily Davis",
    email: "emilydavis@example.com",
    senderEmail: "emilydavis@example.com",
    subject: "Re: Question about Budget",
    date: "2 days ago",
    priority: "High",
    category: "Finance",
    unread: true,
    pinned: false,
    teaser:
      "I've reviewed the budget numbers you sent over.\nCan we set up a quick call to discuss some potential adjustments?",
  },
  {
    name: "Michael Wilson",
    sender: "Michael Wilson",
    email: "michaelwilson@example.com",
    senderEmail: "michaelwilson@example.com",
    subject: "Important Announcement",
    date: "1 week ago",
    priority: "High",
    category: "Company",
    unread: false,
    pinned: true,
    teaser:
      "Please join us for an all-hands meeting this Friday at 3 PM.\nWe have some exciting news to share about the company's future.",
  },
  {
    name: "Sarah Brown",
    sender: "Sarah Brown",
    email: "sarahbrown@example.com",
    senderEmail: "sarahbrown@example.com",
    subject: "Re: Feedback on Proposal",
    date: "1 week ago",
    priority: "Normal",
    category: "Sales",
    unread: false,
    pinned: false,
    teaser:
      "Thank you for sending over the proposal. I've reviewed it and have some thoughts.\nCould we schedule a meeting to discuss my feedback in detail?",
  },
  {
    name: "David Lee",
    sender: "David Lee",
    email: "davidlee@example.com",
    senderEmail: "davidlee@example.com",
    subject: "New Project Idea",
    date: "1 week ago",
    priority: "Normal",
    category: "Ideas",
    unread: false,
    pinned: false,
    teaser:
      "I've been brainstorming and came up with an interesting project concept.\nDo you have time this week to discuss its potential impact and feasibility?",
  },
  {
    name: "Olivia Wilson",
    sender: "Olivia Wilson",
    email: "oliviawilson@example.com",
    senderEmail: "oliviawilson@example.com",
    subject: "Vacation Plans",
    date: "1 week ago",
    priority: "Low",
    category: "HR",
    unread: false,
    pinned: false,
    teaser:
      "Just a heads up that I'll be taking a two-week vacation next month.\nI'll make sure all my projects are up to date before I leave.",
  },
  {
    name: "James Martin",
    sender: "James Martin",
    email: "jamesmartin@example.com",
    senderEmail: "jamesmartin@example.com",
    subject: "Re: Conference Registration",
    date: "1 week ago",
    priority: "Normal",
    category: "Events",
    unread: false,
    pinned: false,
    teaser:
      "I've completed the registration for the upcoming tech conference.\nLet me know if you need any additional information from my end.",
  },
  {
    name: "Sophia White",
    sender: "Sophia White",
    email: "sophiawhite@example.com",
    senderEmail: "sophiawhite@example.com",
    subject: "Team Dinner",
    date: "1 week ago",
    priority: "Low",
    category: "Team",
    unread: false,
    pinned: false,
    teaser:
      "To celebrate our recent project success, I'd like to organize a team dinner.\nAre you available next Friday evening? Please let me know your preferences.",
  },
]

const selectedMail = inboxMails[0]!
const unreadCount = inboxMails.filter((mail) => mail.unread).length
const crushCount = inboxMails.filter((mail) => mail.priority === "High").length
const activeChatCount = inboxMails.filter(
  (mail) => mail.unread || mail.priority === "High" || mail.pinned,
).length

type InboxMail = (typeof inboxMails)[number]

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function priorityClassName(priority: InboxMail["priority"]) {
  if (priority === "High") {
    return "border-red-200 bg-red-50 text-red-700"
  }

  if (priority === "Low") {
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
            aria-label="More inbox actions"
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
            aria-label="Search inbox"
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
          <span>{inboxMails.length} 位联系人</span>
        </div>
        <div className="divide-y divide-slate-200">
          {inboxMails.map((mail, index) => (
            <a
              aria-current={index === 0 ? "page" : undefined}
              href="#"
              key={mail.email}
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
                {getInitials(mail.name)}
                {mail.unread ? (
                  <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-blue-600" />
                ) : null}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "truncate font-semibold",
                      index === 0 || mail.unread ? "text-slate-950" : "text-slate-700",
                    )}
                  >
                    {mail.name}
                  </span>
                  {mail.pinned ? (
                    <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                  ) : null}
                  <span className="ml-auto shrink-0 text-[11px] font-medium text-muted-foreground">
                    {mail.date}
                  </span>
                </div>

                <div className="mt-1 flex min-w-0 items-center gap-2">
                  {mail.unread ? (
                    <Mail className="size-3.5 shrink-0 text-blue-600" />
                  ) : (
                    <MailOpen className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      "truncate font-medium",
                      index === 0 ? "text-slate-950" : "text-slate-900",
                    )}
                  >
                    {mail.subject}
                  </span>
                </div>

                <p className="mt-1.5 line-clamp-2 text-xs leading-5 whitespace-break-spaces text-muted-foreground">
                  {mail.teaser}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-medium",
                      priorityClassName(mail.priority),
                    )}
                  >
                    {mail.priority}
                  </span>
                  <span className="inline-flex h-6 items-center rounded-full border border-slate-200 bg-slate-50 px-2 text-[11px] font-medium text-slate-600">
                    {mail.category}
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
    <DashboardShell title="Inbox">
      <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col overflow-hidden bg-slate-50/70 lg:flex-row">
        <InboxList />

        <InboxChat mail={selectedMail} />
      </div>
    </DashboardShell>
  )
}
