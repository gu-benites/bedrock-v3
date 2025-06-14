// src/features/dashboard/components/dashboard-header.tsx
"use client";

import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardSettings } from "./dashboard-settings";

const getPageTitleFromPathname = (pathname: string | null): string => {
  if (!pathname) return "Dashboard";

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return "Dashboard";
  }

  const pathSegments = pathname.startsWith('/dashboard/') ? pathname.substring('/dashboard/'.length).split('/') : pathname.replace(/^\//, '').split('/');
  
  if (pathSegments.length > 0 && pathSegments[0]) {
    const mainSegment = pathSegments[0];
    return mainSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return "Dashboard";
};

// Removed props: onToggleMobileSidebar, isMobileSidebarOpen
export function DashboardHeader() {
  const pathname = usePathname();
  const pageTitle = getPageTitleFromPathname(pathname);

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Sidebar Settings"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Sidebar Settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DashboardSettings />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
