"use client"

import * as React from "react"
import {
  BarChartIcon,
  MessageCircleIcon,
  FlaskConicalIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  HelpCircleIcon,
} from "lucide-react"

import { NavMain } from '@/components/nav/nav-main'
import { NavSecondary } from '@/components/nav/nav-secondary'
// import { NavUser } from '@/components/nav-user' // Replaced by DashboardUserMenu
import { DashboardUserMenu } from './dashboard-user-menu' // Import DashboardUserMenu
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

const data = {
  // User data will now come from useAuth via DashboardUserMenu, this can be removed or kept for Nav components if they use it
  // user: {
  //   name: "shadcn",
  //   email: "m@example.com",
  //   avatar: "/avatars/shadcn.jpg",
  // },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
      isActive: true,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: BarChartIcon,
    },
  ],
  navAI: [
    {
      title: "Create Recipe",
      url: "/dashboard/create-recipe/health-concern",
      icon: FlaskConicalIcon,
      items: [
        {
          title: "New Recipe",
          url: "/dashboard/create-recipe/health-concern",
        },
        {
          title: "My Recipes",
          url: "/dashboard/recipes",
        },
      ],
    },
    {
      title: "Chat",
      url: "/dashboard/chat",
      icon: MessageCircleIcon,
    },
  ],
  navClouds: [],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: SettingsIcon,
    },
    {
      title: "Help",
      url: "/help",
      icon: HelpCircleIcon,
    },
  ],
  documents: [],
}

export function DashboardAppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  // variant and collapsible are now controlled by SidebarProvider through context
  return (
    <Sidebar className={className} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <FlaskConicalIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Recipe Creator</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavMain items={data.navAI} title="AI" />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <DashboardUserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
