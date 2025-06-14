
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { getCurrentUserProfile } from '@/features/user-auth-data/services/profile.service';
import { createClient } from '@/lib/supabase/server';
// Removed: import { redirect } from 'next/navigation';
import { getServerLogger } from '@/lib/logger';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardAppSidebar } from '@/features/dashboard/components/DashboardAppSidebar';
import { DashboardHeader } from '@/features/dashboard/components'; // Assuming DashboardHeader is here
import { LoadingProvider as DashboardLoadingProvider } from "@/features/ui/providers/loading-provider";

const logger = getServerLogger('DashboardLayout');
const getTimestampLog = () => new Date().toISOString();

/**
 * Shared layout for all routes within the (dashboard) group.
 * This layout is responsible for:
 * 1. Applying the main visual shell (DashboardLayoutComponent).
 * 2. Prefetching common data, like the user profile, for all dashboard pages
 *    if a user session exists. This data is then passed to the client via HydrationBoundary.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log(`[${getTimestampLog()}] DashboardLayout (Server): Start`);
  const supabase = await createClient();
  // We still need to try to get the user to determine if we should prefetch their profile.
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  const queryClient = new QueryClient();

  if (userError) {
    logger.error('DashboardLayout (Server): Error fetching user from Supabase.', { error: userError.message });
    // Redirect removed. Page will proceed without user context if auth fails.
  }

  if (user) {
    console.log(`[${getTimestampLog()}] DashboardLayout (Server): User ID: ${user.id}. Attempting to prefetch profile.`);
    try {
      logger.info(`DashboardLayout (Server): PREFETCHING user profile for user ID: ${user.id}.`);
      console.log(`[${getTimestampLog()}] DashboardLayout (Server): PREFETCHING user profile for user ID: ${user.id}.`);

      // Race prefetch against timeout to prevent blocking rendering
      const profilePromise = queryClient.prefetchQuery({
        queryKey: ['userProfile', user.id],
        queryFn: () => getCurrentUserProfile(user.id),
        staleTime: 10 * 1000, // 10 seconds
      });

      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 500));
      await Promise.race([profilePromise, timeoutPromise]);

      logger.info(`DashboardLayout (Server): PREFETCH completed (or timed out) for user ID: ${user.id}.`);
      console.log(`[${getTimestampLog()}] DashboardLayout (Server): PREFETCH completed (or timed out) for user ID: ${user.id}.`);
    } catch (error) {
      const castError = error instanceof Error ? error : new Error(String(error));
      logger.error('DashboardLayout (Server): FAILED to prefetch user profile.', { userId: user.id, error: castError.message, stack: castError.stack });
      console.error(`[${getTimestampLog()}] DashboardLayout (Server): FAILED to prefetch user profile for user ID: ${user.id}. Error: ${castError.message}`);
      // Continue even if prefetch fails - client-side will attempt to fetch
    }
  } else {
    logger.warn('DashboardLayout (Server): No authenticated user found. Skipping user profile prefetch.');
    console.log(`[${getTimestampLog()}] DashboardLayout (Server): No authenticated user session. Profile prefetch skipped.`);
    // Redirect removed. Page will proceed without user context.
  }

  const dehydratedState = dehydrate(queryClient);
  console.log(`[${getTimestampLog()}] DashboardLayout (Server): Dehydrated state (first 500 chars):`, JSON.stringify(dehydratedState, null, 2).substring(0, 500) + '...');

  return (
    <SidebarProvider initialVariant="inset" initialCollapsible="offcanvas">
      <DashboardAppSidebar />
      <SidebarInset>
        <DashboardLoadingProvider>
          <DashboardHeader />
          <HydrationBoundary state={dehydratedState}>
            {children}
          </HydrationBoundary>
        </DashboardLoadingProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
