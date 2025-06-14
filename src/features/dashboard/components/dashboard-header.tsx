// src/features/dashboard/components/dashboard-header.tsx
"use client";

import { usePathname } from "next/navigation";
import { Menu, Settings } from "lucide-react"; // Replaced MoreHorizontal with Settings
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardSettings } from "./dashboard-settings"; // Adjusted path as needed

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
    <header className="flex h-14 items-center justify-between border-b px-4 md:px-6 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="h-7 w-7 md:flex" /> {/* SidebarTrigger added, md:flex to ensure it's visible on desktop if needed by design */}
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-3">
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
    </header>
  );
}
