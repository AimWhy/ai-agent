import { DashboardShell } from "./_components/dashboard-shell"

const inboxMails = [
  {
    name: "William Smith",
    email: "williamsmith@example.com",
    subject: "Meeting Tomorrow",
    date: "09:34 AM",
    teaser:
      "Hi team, just a reminder about our meeting tomorrow at 10 AM.\nPlease come prepared with your project updates.",
  },
  {
    name: "Alice Smith",
    email: "alicesmith@example.com",
    subject: "Re: Project Update",
    date: "Yesterday",
    teaser:
      "Thanks for the update. The progress looks great so far.\nLet's schedule a call to discuss the next steps.",
  },
  {
    name: "Bob Johnson",
    email: "bobjohnson@example.com",
    subject: "Weekend Plans",
    date: "2 days ago",
    teaser:
      "Hey everyone! I'm thinking of organizing a team outing this weekend.\nWould you be interested in a hiking trip or a beach day?",
  },
  {
    name: "Emily Davis",
    email: "emilydavis@example.com",
    subject: "Re: Question about Budget",
    date: "2 days ago",
    teaser:
      "I've reviewed the budget numbers you sent over.\nCan we set up a quick call to discuss some potential adjustments?",
  },
  {
    name: "Michael Wilson",
    email: "michaelwilson@example.com",
    subject: "Important Announcement",
    date: "1 week ago",
    teaser:
      "Please join us for an all-hands meeting this Friday at 3 PM.\nWe have some exciting news to share about the company's future.",
  },
  {
    name: "Sarah Brown",
    email: "sarahbrown@example.com",
    subject: "Re: Feedback on Proposal",
    date: "1 week ago",
    teaser:
      "Thank you for sending over the proposal. I've reviewed it and have some thoughts.\nCould we schedule a meeting to discuss my feedback in detail?",
  },
  {
    name: "David Lee",
    email: "davidlee@example.com",
    subject: "New Project Idea",
    date: "1 week ago",
    teaser:
      "I've been brainstorming and came up with an interesting project concept.\nDo you have time this week to discuss its potential impact and feasibility?",
  },
  {
    name: "Olivia Wilson",
    email: "oliviawilson@example.com",
    subject: "Vacation Plans",
    date: "1 week ago",
    teaser:
      "Just a heads up that I'll be taking a two-week vacation next month.\nI'll make sure all my projects are up to date before I leave.",
  },
  {
    name: "James Martin",
    email: "jamesmartin@example.com",
    subject: "Re: Conference Registration",
    date: "1 week ago",
    teaser:
      "I've completed the registration for the upcoming tech conference.\nLet me know if you need any additional information from my end.",
  },
  {
    name: "Sophia White",
    email: "sophiawhite@example.com",
    subject: "Team Dinner",
    date: "1 week ago",
    teaser:
      "To celebrate our recent project success, I'd like to organize a team dinner.\nAre you available next Friday evening? Please let me know your preferences.",
  },
]

export default function Page() {
  return (
    <DashboardShell title="Inbox">
      <div className="flex h-[calc(100vh-4rem)] box-border">
        <aside className="w-96 border-b lg:border-r lg:border-b-0 overflow-y-auto">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Inbox</h1>
              <p className="text-sm text-muted-foreground">邮件列表</p>
            </div>
            <span className="text-sm text-muted-foreground">Unreads</span>
          </div>
          <div className="divide-y">
            {inboxMails.map((mail, index) => (
              <a
                href="#"
                key={mail.email}
                className={
                  index === 0
                    ? "flex flex-col gap-2 bg-muted/60 p-4 text-sm leading-tight"
                    : "flex flex-col gap-2 p-4 text-sm leading-tight hover:bg-muted/50"
                }
              >
                <div className="flex w-full items-center gap-2">
                  <span className="font-medium">{mail.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{mail.date}</span>
                </div>
                <span className="font-medium">{mail.subject}</span>
                <span className="line-clamp-2 text-xs whitespace-break-spaces text-muted-foreground">
                  {mail.teaser}
                </span>
              </a>
            ))}
          </div>
        </aside>

        <div className="flex-1 flex min-h-[640px] flex-col">
          <div className="border-b p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Meeting Tomorrow</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  William Smith · williamsmith@example.com
                </p>
              </div>
              <span className="text-xs text-muted-foreground">09:34 AM</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="max-w-2xl rounded-none bg-muted p-4 text-sm leading-6">
              Hi team, just a reminder about our meeting tomorrow at 10 AM.
              Please come prepared with your project updates.
            </div>
            <div className="ml-auto max-w-2xl rounded-none bg-primary p-4 text-sm leading-6 text-primary-foreground">
              收到，我会准备 Agent 订阅页和 dashboard 路由结构的最新进展。
            </div>
            <div className="max-w-2xl rounded-none bg-muted p-4 text-sm leading-6">
              Great. Please include the navigation changes and any open questions for the next milestone.
            </div>
          </div>

          <div className="border-t p-4">
            <div className="rounded-none border bg-background p-4 text-sm text-muted-foreground">
              输入回复内容...
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
