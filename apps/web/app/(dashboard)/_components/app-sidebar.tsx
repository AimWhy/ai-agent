"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, Brain, Command, Compass, Heart, Inbox, Sparkles, UserRound } from "lucide-react"

import { useWebDashboardContext } from "@/components/web-dashboard-guard"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/sidebar"

const data = {
  navMain: [
    {
      title: "聊天",
      url: "/",
      icon: Inbox,
    },
    {
      title: "发现",
      url: "/discover",
      icon: Compass,
    },
    {
      title: "创建 Agent 伴侣",
      url: "/create-agent-companion",
      icon: Bot,
    },
    {
      title: "我的伴侣",
      url: "/companions",
      icon: Heart,
    },
    {
      title: "记忆库",
      url: "/memories",
      icon: Brain,
    },
    {
      title: "订阅套餐",
      url: "/subscription-plans",
      icon: Sparkles,
    },
    {
      title: "个人中心",
      url: "/profile",
      icon: UserRound,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { profile } = useWebDashboardContext()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-8!"
            >
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Acme Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => {
                const isActive =
                  item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      isActive={isActive}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: profile.name,
            email: profile.email,
            avatar: null,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
