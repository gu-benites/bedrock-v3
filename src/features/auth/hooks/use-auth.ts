'use client';

import { useAuthSession } from '@/providers/auth-session-provider';
import { useUserProfileQuery } from '@/features/user-auth-data/hooks/use-user-profile-query';
import { useMemo, useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { type User } from '@supabase/supabase-js';
import { type UserProfile } from '@/features/user-auth-data/schemas';

interface AuthState {
  user: User | null;
  profile: UserProfile | undefined;
  authUser: (User & UserProfile) | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  profileError: Error | null;
}

/**
 * Primary hook for authentication state
 * Combines session and profile data with efficient memoization
 */
export function useAuth(): AuthState {
  // Debug flag for conditional logging
  const debugAuth = process.env.NODE_ENV === 'development' && 
                    process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';
  
  // Get raw session data
  const { 
    user: sessionUser, 
    isLoading: isSessionLoading, 
    error: sessionError 
  } = useAuthSession();
  
  // Only fetch profile if we have a user
  const { 
    data: profileData, 
    isLoading: isProfileLoading,
    error: profileError
  } = useUserProfileQuery(
    sessionUser?.id,
    { enabled: !!sessionUser?.id }
  );
  
  // Report significant errors to Sentry
  useEffect(() => {
    if (sessionError) {
      // Dev-only console logging
      if (debugAuth) {
        console.error('[useAuth] Session error:', sessionError.message);
      }
      
      // Always report to Sentry with context
      Sentry.captureException(sessionError, {
        tags: { component: 'useAuth', type: 'sessionError' },
        extra: { 
          userId: sessionUser?.id ? `${sessionUser.id.substring(0, 6)}...` : 'none',
          operation: 'useAuth',
          message: "Error from AuthSessionProvider"
        }
      });
    }
  }, [sessionError, sessionUser, debugAuth]);
  
  useEffect(() => {
    if (profileError && sessionUser) {
      // Dev-only console logging
      if (debugAuth) {
        console.error('[useAuth] Profile error:', profileError);
      }
      
      // Always report to Sentry with context
      Sentry.captureException(profileError, {
        tags: { component: 'useAuth', type: 'profileError' },
        extra: { 
          userId: `${sessionUser.id.substring(0, 6)}...`,
          operation: 'useAuth',
          message: "Error from useUserProfileQuery"
        }
      });
    }
  }, [profileError, sessionUser, debugAuth]);
  
  // Memoize derived states to prevent unnecessary recalculations
  return useMemo(() => {
    const isAuthenticated = !!sessionUser && !isSessionLoading;
    const isLoading = isSessionLoading || (isAuthenticated && isProfileLoading);
    
    // Combined user object with both session and profile data
    const authUser = sessionUser && profileData ? {
      ...sessionUser,
      ...profileData,
    } : null;
    
    // Only log significant state changes in debug mode
    if (debugAuth) {
      const authState = isAuthenticated ? 'authenticated' : 'unauthenticated';
      const loadingState = isLoading ? 'loading' : 'ready';
      console.log(`[useAuth] State: ${authState}, ${loadingState}`);
    }
    
    return {
      user: sessionUser,
      profile: profileData,
      authUser,
      isAuthenticated,
      isLoading,
      error: sessionError,
      profileError
    };
  }, [sessionUser, profileData, isSessionLoading, isProfileLoading, sessionError, profileError, debugAuth]);
}
