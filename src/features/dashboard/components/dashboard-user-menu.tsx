
// src/features/dashboard/components/dashboard-user-menu.tsx
"use client";

import React, { useState } from "react";
import {
  LogOut,
  Settings,
  Headphones,
  FileText,
  UserCircle2,
  MoreVertical,
  Loader2,
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks";
import { useDashboardLoading } from "@/features/ui/providers/loading-provider";
import { signOutUserAction } from "@/features/auth/actions";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";


type UserMenuItemType = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

const userMenuItems: UserMenuItemType[] = [
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: <UserIcon className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    title: "Support",
    href: "/help",
    icon: <Headphones className="h-5 w-5" />,
  },
];

export function DashboardUserMenu() {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { isMobile } = useSidebar();

  const { user, profile, isLoading } = useAuth();
  const { isSigningOut, setIsSigningOut } = useDashboardLoading(); // Only for sign-out optimistic UI
  const showSkeletons = isLoading;
  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName;
    const userMetaFirstName = user?.user_metadata?.first_name as string | undefined;
    if (userMetaFirstName) return userMetaFirstName;
    if (user?.email) return user.email.split('@')[0];
    return "User";
  };

  const getEmailDisplay = () => {
    return profile?.email || user?.email || "No email available";
  };

  const getInitials = (baseUser = user, baseProfile = profile) => {
    const first = baseProfile?.firstName || (baseUser?.user_metadata?.first_name as string)?.[0] || '';
    const last = baseProfile?.lastName || (baseUser?.user_metadata?.last_name as string)?.[0] || '';
    const initials = `${first}${last}`.toUpperCase();
    return initials || "CN";
  };

  // Compute timestamped avatar URL directly in render logic if profile and avatarUrl exist
  const currentBaseAvatarUrl = profile?.avatarUrl || (user?.user_metadata?.avatar_url as string | undefined);
  const timestampedAvatarUrl = currentBaseAvatarUrl
    ? `${currentBaseAvatarUrl.split('?')[0]}?t=${new Date().getTime()}`
    : null;

  const handleSignOut = async (formData: FormData) => {
    setIsSigningOut(true);
    setShowLogoutConfirm(false);
    await signOutUserAction();
  };

  if (showSkeletons) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="ml-auto h-4 w-4" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Avatar className="h-8 w-8 rounded-lg grayscale">
              <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
                <UserCircle2 size={18} />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium text-muted-foreground">Not Logged In</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg grayscale">
                  {timestampedAvatarUrl && <AvatarImage src={timestampedAvatarUrl} alt={getDisplayName()} />}
                  <AvatarFallback className="rounded-lg">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{getDisplayName()}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {getEmailDisplay()}
                  </span>
                </div>
                <MoreVertical className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    {timestampedAvatarUrl && <AvatarImage src={timestampedAvatarUrl} alt={getDisplayName()} />}
                    <AvatarFallback className="rounded-lg">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{getDisplayName()}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {getEmailDisplay()}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {userMenuItems.map((item) => (
                  <DropdownMenuItem key={item.title} asChild>
                    <a href={item.href}>
                      {item.icon}
                      {item.title}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <form action={handleSignOut}>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  'Log Out'
                )}
              </Button>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
