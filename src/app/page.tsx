import { getServerLogger } from '@/lib/logger';
import { getServerAuthState } from '@/features/auth/services/auth-state.service';
import { getCurrentUserProfile } from '@/features/user-auth-data/services/profile.service';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { HomepageLayout } from '@/features/homepage/layout/homepage-layout';

const logger = getServerLogger('RootPage');

/**
 * Optimized root page component
 * Uses centralized auth state service and optimized profile service
 * for efficient data prefetching and consistent error handling
 */
export default async function RootPage() {
  try {
    const { user, error: authError } = await getServerAuthState();
    
    if (authError) {
      // Error already logged in getServerAuthState, just add context
      logger.warn('Auth error in root page', {
        error: authError.message,
        stack: authError.stack,
        operation: 'RootPage'
      });
    }
    
    const queryClient = new QueryClient();
    
    // Only prefetch profile if user is authenticated
    if (user?.id) {
      // Mask userId for privacy in logs
      const maskedUserId = `${user.id.substring(0, 6)}...`;
      
      logger.info('Prefetching profile for authenticated user', {
        userId: maskedUserId,
        operation: 'RootPage'
      });
      
      try {
        await queryClient.prefetchQuery({
          queryKey: ['userProfile', user.id],
          queryFn: () => getCurrentUserProfile(user.id),
        });
      } catch (err) {
        logger.warn('Error prefetching user profile', {
          userId: maskedUserId,
          error: err instanceof Error ? err.message : String(err),
          operation: 'RootPage'
        });
      }
    } else {
      logger.info('No authenticated user. Skipping profile prefetch for homepage', {
        operation: 'RootPage'
      });
    }
    
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <HomepageLayout />
      </HydrationBoundary>
    );
  } catch (err) {
    logger.error('Critical error in root page', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      operation: 'RootPage'
    });
    
    // Fallback rendering
    return <HomepageLayout />;
  }
}
