'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '../queries/profile.queries';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { type UserProfile } from '../schemas/profile.schema';

/**
 * Hook for fetching user profile data
 * Uses TanStack Query for efficient caching and revalidation
 */
export function useUserProfileQuery(userId?: string, options = {}) {
  const debugAuth = process.env.NODE_ENV === 'development' && 
                    process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';
  
  const queryResult = useQuery({
    queryKey: userId ? ['userProfile', userId] : undefined,
    queryFn: () => getUserProfile(userId!),
    enabled: !!userId && (options.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    ...options
  });
  
  const { error, isError, data } = queryResult;
  
  // Log query status in debug mode
  useEffect(() => {
    if (debugAuth && userId) {
      const maskedUserId = `${userId.substring(0, 6)}...`;
      console.log(`[useUserProfileQuery] Query result for userId ${maskedUserId}:`, {
        status: queryResult.status,
        isLoading: queryResult.isLoading,
        isFetching: queryResult.isFetching,
        isSuccess: queryResult.isSuccess,
        isStale: queryResult.isStale,
        dataExists: !!queryResult.data,
        error: queryResult.error
      });
    }
  }, [queryResult, userId, debugAuth]);
  
  // Report significant errors to Sentry
  useEffect(() => {
    if (isError && error && userId) {
      // Mask userId for privacy
      const maskedUserId = `${userId.substring(0, 6)}...`;
      
      Sentry.captureException(error, {
        tags: { component: 'useUserProfileQuery', type: 'profileError' },
        extra: { 
          userId: maskedUserId,
          operation: 'useUserProfileQuery',
          message: "Error fetching user profile"
        }
      });
    }
  }, [isError, error, userId]);
  
  return queryResult;
}
