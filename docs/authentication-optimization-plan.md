# Authentication Optimization Plan

## Current Issues Analysis

After studying the authentication and homepage loading process, I've identified several key issues:

1. **Redundant Authentication Checks**: Multiple components perform similar auth checks
2. **Inconsistent Error Logging**: Logging patterns don't align with established Winston/Sentry architecture
3. **Poor Separation of Concerns**: Unclear boundaries between auth, profile, and UI responsibilities
4. **Inefficient Error Handling**: Errors are logged but not properly handled with appropriate severity levels
5. **Performance Impact**: Multiple redundant operations affecting load times
6. **PII Exposure**: Personally identifiable information not properly masked in logs

## Implementation Plan

### Phase 1: Centralize Authentication Logic

#### 1. Create a Single Source of Truth for Auth State

**File**: `src/features/auth/services/auth-state.service.ts` (new)

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { getServerLogger } from '@/lib/logger';
import { cookies } from 'next/headers';
import { type User } from '@supabase/supabase-js';

const logger = getServerLogger('AuthStateService');

export type AuthStateResult = {
  user: User | null;
  error?: Error;
};

/**
 * Single source of truth for server-side authentication state
 * Used by layout, middleware, and page components
 *
 * Note: All warn/error level logs are automatically sent to Sentry
 * via the SentryWinstonTransport configured in winston.config.ts
 */
export async function getServerAuthState(): Promise<AuthStateResult> {
  try {
    const cookieStore = cookies();
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      // Expected auth errors at info level (not sent to Sentry)
      if (error.message === "Auth session missing!") {
        logger.info('User not authenticated', {
          message: error.message,
          operation: 'getServerAuthState'
        });
      }
      // Authentication errors at warn level (sent to Sentry via Winston transport)
      else if (error.status === 401 || error.status === 403) {
        logger.warn('Authentication error', {
          error: error.message,
          status: error.status,
          operation: 'getServerAuthState'
        });
      }
      // Critical errors at error level (sent to Sentry via Winston transport)
      else {
        logger.error('Critical authentication error', {
          error: error.message,
          status: error.status,
          stack: error.stack,
          operation: 'getServerAuthState'
        });
      }
      return { user: null, error };
    }

    // Log successful auth state retrieval
    logger.info('Auth state retrieved successfully', {
      userId: data.user?.id ? `${data.user.id.substring(0, 6)}...` : 'none',
      operation: 'getServerAuthState'
    });

    return { user: data.user };
  } catch (err) {
    logger.error('Critical error in auth state service', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      operation: 'getServerAuthState'
    });
    return { user: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
```

#### 2. Refactor Root Layout to Use Centralized Auth

**File**: `src/app/layout.tsx`

```typescript
import { getServerLogger } from '@/lib/logger';
import { getServerAuthState } from '@/features/auth/services/auth-state.service';

const logger = getServerLogger('RootLayout');

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  try {
    const { user, error } = await getServerAuthState();

    if (error) {
      // Error already logged in getServerAuthState, just add context
      logger.warn('Error getting auth state in root layout', {
        error: error.message,
        stack: error.stack,
        operation: 'RootLayout'
      });
    }

    return (
      <html lang="en">
        <body>
          <AuthSessionProvider preloadedUser={user}>
            <QueryClientProvider>
              {children}
            </QueryClientProvider>
          </AuthSessionProvider>
        </body>
      </html>
    );
  } catch (err) {
    logger.error('Critical error in root layout', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      operation: 'RootLayout'
    });

    // Fallback rendering without auth
    return (
      <html lang="en">
        <body>
          <QueryClientProvider>
            {children}
          </QueryClientProvider>
        </body>
      </html>
    );
  }
}
```

#### 3. Optimize AuthSessionProvider

**File**: `src/providers/auth-session-provider.tsx`

```typescript
'use client';

import { type User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import * as Sentry from '@sentry/nextjs';

export function AuthSessionProvider({
  children,
  preloadedUser
}: {
  children: React.ReactNode;
  preloadedUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(preloadedUser || null);
  const [isLoading, setIsLoading] = useState<boolean>(!preloadedUser);
  const [error, setError] = useState<Error | null>(null);

  // Conditional logging for development only
  const shouldLog = process.env.NODE_ENV === 'development' &&
                    process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';

  useEffect(() => {
    if (!preloadedUser) {
      const supabase = createClient();

      // Initial session check
      const getInitialSession = async () => {
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            // Dev-only console logging
            if (shouldLog) {
              console.warn('[AuthSessionProvider] Error getting initial session:', sessionError.message);
            }
            setError(sessionError);

            // Always report to Sentry with context
            Sentry.captureException(sessionError, {
              tags: { component: 'AuthSessionProvider', type: 'sessionError' },
              extra: {
                operation: 'getInitialSession',
                message: 'Error getting initial session'
              }
            });
          }

          setUser(session?.user || null);
          setIsLoading(false);
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));

          // Dev-only console logging
          if (shouldLog) {
            console.error('[AuthSessionProvider] Critical error getting initial session:', error.message);
          }
          setError(error);
          setIsLoading(false);

          // Always report to Sentry with context
          Sentry.captureException(error, {
            tags: { component: 'AuthSessionProvider', type: 'criticalError' },
            extra: {
              operation: 'getInitialSession',
              message: 'Critical error getting initial session'
            }
          });
        }
      };

      getInitialSession();

      // Subscribe to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (shouldLog) {
          console.log(`[AuthSessionProvider] Auth state changed: ${event}`);
        }

        // Handle auth events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user || null);

          // Log significant events to Sentry
          if (event === 'SIGNED_IN' && session?.user) {
            // Set user context with masked email for privacy
            Sentry.setUser({
              id: session.user.id,
              email: session.user.email ? `${session.user.email.substring(0, 3)}***` : undefined
            });

            Sentry.captureMessage('User signed in', {
              level: 'info',
              tags: { event, component: 'AuthSessionProvider' },
              extra: {
                userId: `${session.user.id.substring(0, 6)}...`,
                operation: 'authStateChange'
              }
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          Sentry.setUser(null);
          Sentry.captureMessage('User signed out', {
            level: 'info',
            tags: { event, component: 'AuthSessionProvider' },
            extra: { operation: 'authStateChange' }
          });
        }

        // Handle errors in session
        const sessionWithError = session as (typeof session & { error?: any });
        if (sessionWithError?.error) {
          const sessionError = new Error(sessionWithError.error.message || 'Unknown session error');
          setError(sessionError);

          Sentry.captureException(sessionError, {
            tags: { component: 'AuthSessionProvider', event, type: 'sessionError' },
            extra: {
              userId: sessionWithError.user?.id ? `${sessionWithError.user.id.substring(0, 6)}...` : 'none',
              errorName: sessionWithError.error.name,
              operation: 'authStateChange'
            }
          });
        } else {
          setError(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [preloadedUser, shouldLog]);

  return (
    <AuthSessionContext.Provider value={{ user, isLoading, error }}>
      {children}
    </AuthSessionContext.Provider>
  );
}
```

### Phase 2: Optimize Data Fetching

#### 1. Create Efficient Profile Service

**File**: `src/features/user-profile/services/profile.service.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { getServerLogger } from '@/lib/logger';
import { cache } from 'react';

const logger = getServerLogger('ProfileService');

/**
 * Cached server function to get user profile
 * Uses React cache() to deduplicate requests within the same render cycle
 *
 * Note: All warn/error level logs are automatically sent to Sentry
 * via the SentryWinstonTransport configured in winston.config.ts
 */
export const getCurrentUserProfile = cache(async (userId: string) => {
  if (!userId) {
    logger.info('Profile fetch attempted with no userId', {
      operation: 'getCurrentUserProfile'
    });
    return null;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Mask userId for privacy in logs
      const maskedUserId = `${userId.substring(0, 6)}...`;

      logger.warn('Error fetching user profile', {
        userId: maskedUserId,
        error: error.message,
        code: error.code,
        operation: 'getCurrentUserProfile'
      });
      return null;
    }

    // Mask userId for privacy in logs
    const maskedUserId = `${userId.substring(0, 6)}...`;
    logger.info('Profile fetched successfully', {
      userId: maskedUserId,
      operation: 'getCurrentUserProfile',
      hasData: !!data
    });

    return data;
  } catch (err) {
    // Mask userId for privacy in logs
    const maskedUserId = `${userId.substring(0, 6)}...`;

    logger.error('Critical error fetching user profile', {
      userId: maskedUserId,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      operation: 'getCurrentUserProfile'
    });
    return null;
  }
});
```

#### 2. Optimize Root Page Component

**File**: `src/app/page.tsx`

```typescript
import { getServerLogger } from '@/lib/logger';
import { getServerAuthState } from '@/features/auth/services/auth-state.service';
import { getCurrentUserProfile } from '@/features/user-profile/services/profile.service';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

const logger = getServerLogger('RootPage');

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
```

### Phase 3: Optimize Client-Side Hooks

#### 1. Refactor useAuth Hook

**File**: `src/features/auth/hooks/use-auth.ts`

```typescript
'use client';

import { useAuthSession } from './use-auth-session';
import { useUserProfileQuery } from '@/features/user-profile/hooks/use-user-profile-query';
import { useMemo, useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Primary hook for authentication state
 * Combines session and profile data with efficient memoization
 */
export function useAuth() {
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
```

#### 2. Optimize useUserProfileQuery

**File**: `src/features/user-profile/hooks/use-user-profile-query.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '../queries/profile.queries';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

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
```

### Phase 4: Optimize Loading States

#### 1. Create Unified Loading Provider

**File**: `src/features/ui/providers/loading-provider.tsx`

```typescript
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

type LoadingContextType = {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
  startLoading: () => void;
  stopLoading: () => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

/**
 * Unified loading provider for consistent loading states
 * Replaces multiple loading contexts with a single source of truth
 */
export function LoadingProvider({
  children,
  initialState = false,
  minimumLoadingTime = 500
}: {
  children: React.ReactNode;
  initialState?: boolean;
  minimumLoadingTime?: number;
}) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  // Debug flag for conditional logging
  const debugLoading = process.env.NODE_ENV === 'development' &&
                       process.env.NEXT_PUBLIC_DEBUG_LOADING === 'true';

  const startLoading = () => {
    // Dev-only console logging
    if (debugLoading && !isLoading) {
      console.log('[LoadingProvider] Starting loading state');
    }

    setIsLoading(true);
    setLoadingStartTime(Date.now());

    // Track loading state in Sentry for performance monitoring
    Sentry.addBreadcrumb({
      category: 'ui.loading',
      message: 'Loading started',
      level: 'info'
    });
  };

  const stopLoading = () => {
    if (!loadingStartTime) {
      setIsLoading(false);
      return;
    }

    const elapsedTime = Date.now() - loadingStartTime;

    // Dev-only console logging
    if (debugLoading) {
      console.log(`[LoadingProvider] Stopping loading state (elapsed: ${elapsedTime}ms)`);
    }

    if (elapsedTime >= minimumLoadingTime) {
      setIsLoading(false);
      setLoadingStartTime(null);

      Sentry.addBreadcrumb({
        category: 'ui.loading',
        message: 'Loading stopped',
        level: 'info',
        data: { elapsedTime }
      });
    } else {
      // Ensure minimum loading time for better UX
      const remainingTime = minimumLoadingTime - elapsedTime;
      setTimeout(() => {
        setIsLoading(false);
        setLoadingStartTime(null);

        Sentry.addBreadcrumb({
          category: 'ui.loading',
          message: 'Loading stopped (after minimum time)',
          level: 'info',
          data: { elapsedTime, remainingTime }
        });
      }, remainingTime);
    }
  };

  const setLoading = (state: boolean) => {
    if (state) {
      startLoading();
    } else {
      stopLoading();
    }
  };

  // Report loading state changes to Sentry for performance monitoring
  useEffect(() => {
    if (isLoading) {
      Sentry.setTag('ui.loading', 'true');
    } else {
      Sentry.setTag('ui.loading', 'false');
    }
  }, [isLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
```

#### 2. Update Homepage Layout

**File**: `src/features/homepage/layout/homepage-layout.tsx`

```typescript
'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { LoadingProvider } from '@/features/ui/providers/loading-provider';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export function HomepageLayout({ children }: { children: React.ReactNode }) {
  const { isLoading: isAuthLoading, error: authError, user } = useAuth();

  // Track page view in Sentry
  useEffect(() => {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: 'Homepage layout mounted',
      level: 'info'
    });

    // Set user context in Sentry when available (with masked email for privacy)
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email ? `${user.email.substring(0, 3)}***` : undefined
      });
    }

    // Report any auth errors
    if (authError) {
      Sentry.captureException(authError, {
        tags: { component: 'HomepageLayout', type: 'authError' },
        extra: {
          userId: user?.id ? `${user.id.substring(0, 6)}...` : 'none',
          operation: 'HomepageLayout',
          message: "Auth error in homepage layout"
        }
      });
    }
  }, [user, authError]);

  return (
    <LoadingProvider initialState={isAuthLoading}>
      <Header />
      <main>{children}</main>
      <Footer />
    </LoadingProvider>
  );
}
```

### Phase 5: Optimize Authentication Middleware

#### 1. Refactor Auth Middleware

**File**: `src/middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import * as Sentry from '@sentry/nextjs';

// Define public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/register', '/reset-password', '/'];

export async function middleware(request: NextRequest) {
  try {
    // Create supabase middleware client
    const { supabase, response } = createClient(request);

    // Check if path is public
    const isPublicPath = PUBLIC_PATHS.some(path =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith(`${path}/`)
    );

    // Get session with minimal logging
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // Handle session errors
    if (sessionError && !isPublicPath) {
      // Expected auth errors (not logged to console or Sentry)
      if (sessionError.message === "Auth session missing!") {
        // Just redirect without logging
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('next', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
      // Unexpected auth errors (logged to console and Sentry)
      else {
        console.warn(`[Middleware] Auth error: ${sessionError.message}`);

        // Report to Sentry with proper context
        Sentry.captureException(sessionError, {
          tags: { component: 'Middleware', type: 'sessionError' },
          extra: {
            path: request.nextUrl.pathname,
            operation: 'middleware',
            message: "Session error in middleware"
          }
        });

        // Redirect to login
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('next', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Handle protected routes
    if (!session && !isPublicPath) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Handle auth routes when already authenticated
    if (session && (
      request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/register'
    )) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Continue with the response
    return response;
  } catch (err) {
    // Handle critical errors
    console.error('[Middleware] Critical error:', err instanceof Error ? err.message : String(err));

    // Report to Sentry with proper context
    Sentry.captureException(err, {
      tags: { component: 'Middleware', level: 'critical', type: 'criticalError' },
      extra: {
        path: request.nextUrl.pathname,
        operation: 'middleware',
        message: "Critical error in middleware"
      }
    });

    // For critical errors, allow the request to proceed
    // The application's error boundaries will handle rendering
    return NextResponse.next();
  }
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
```

#### 2. Create Error Handling Utility

**File**: `src/lib/error/error-handler.ts`

```typescript
import * as Sentry from '@sentry/nextjs';
import { getServerLogger } from '@/lib/logger';

type ErrorContext = {
  userId?: string;
  operation?: string;
  component?: string;
  path?: string;
  [key: string]: any;
};

/**
 * Centralized error handling utility
 * Reports errors to both Winston and Sentry with consistent formatting
 *
 * Note: All warn/error level logs are automatically sent to Sentry
 * via the SentryWinstonTransport configured in winston.config.ts
 */
export function handleError(error: unknown, context: ErrorContext = {}) {
  const isServerSide = typeof window === 'undefined';
  const errorObj = error instanceof Error ? error : new Error(String(error));

  // Mask PII in context
  const sanitizedContext = {
    ...context,
    userId: context.userId ? `${context.userId.substring(0, 6)}...` : undefined,
    error: errorObj.message,
    stack: errorObj.stack,
    name: errorObj.name
  };

  // Server-side error handling with Winston
  if (isServerSide) {
    const logger = getServerLogger(context.component || 'ErrorHandler');

    if (context.operation === 'auth' && errorObj.message === 'Auth session missing!') {
      // Expected auth errors at info level (not sent to Sentry)
      logger.info('User not authenticated', sanitizedContext);
    } else if (errorObj.name === 'AbortError' || errorObj.name === 'TimeoutError') {
      // Network/timeout errors at warn level (sent to Sentry via Winston transport)
      logger.warn('Request failed', sanitizedContext);
    } else {
      // Unexpected errors at error level (sent to Sentry via Winston transport)
      logger.error('Application error', sanitizedContext);
    }
  }

  // Report to Sentry (both client and server) - avoid duplicate reporting for server errors
  if (errorObj.message !== 'Auth session missing!' && !isServerSide) {
    Sentry.captureException(errorObj, {
      tags: {
        component: context.component || 'unknown',
        operation: context.operation || 'unknown',
        type: 'clientError'
      },
      extra: sanitizedContext
    });
  }

  // Client-side console logging in development only
  if (!isServerSide && process.env.NODE_ENV === 'development') {
    const debugFlag = context.operation === 'auth'
      ? process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true'
      : process.env.NEXT_PUBLIC_DEBUG === 'true';

    if (debugFlag) {
      console.error(`[${context.component || 'App'}] Error:`, errorObj.message, sanitizedContext);
    }
  }

  return errorObj;
}

/**
 * Log significant application events to both Winston and Sentry
 */
export function logEvent(message: string, context: ErrorContext = {}, level: 'info' | 'warn' = 'info') {
  const isServerSide = typeof window === 'undefined';

  // Mask PII in context
  const sanitizedContext = {
    ...context,
    userId: context.userId ? `${context.userId.substring(0, 6)}...` : undefined
  };

  // Server-side logging with Winston
  if (isServerSide) {
    const logger = getServerLogger(context.component || 'EventLogger');

    if (level === 'info') {
      logger.info(message, sanitizedContext);
    } else {
      logger.warn(message, sanitizedContext);
    }
  }

  // Report to Sentry as breadcrumb
  Sentry.addBreadcrumb({
    category: context.operation || 'application',
    message,
    level,
    data: sanitizedContext
  });

  // Client-side console logging in development only
  if (!isServerSide && process.env.NODE_ENV === 'development') {
    const debugFlag = context.operation === 'auth'
      ? process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true'
      : process.env.NEXT_PUBLIC_DEBUG === 'true';

    if (debugFlag) {
      console.log(`[${context.component || 'App'}] ${message}`, sanitizedContext);
    }
  }
}
```

### Phase 6: Optimize Authentication Actions

#### 1. Refactor Sign-In Action

**File**: `src/features/auth/actions/sign-in.action.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getServerLogger } from '@/lib/logger';
import { z } from 'zod';

const logger = getServerLogger('AuthActions');

// Validation schema
const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  redirectTo: z.string().optional()
});

type SignInResult = {
  success: boolean;
  error?: string;
  redirectTo?: string;
};

/**
 * Server action for user sign-in
 * Handles validation, authentication, and redirection
 *
 * Note: All warn/error level logs are automatically sent to Sentry
 * via the SentryWinstonTransport configured in winston.config.ts
 */
export async function signInWithPasswordAction(formData: FormData): Promise<SignInResult> {
  try {
    // Extract and validate form data
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirectTo') as string || '/dashboard';

    // Validate input
    const validationResult = signInSchema.safeParse({ email, password, redirectTo });
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || 'Invalid input';

      logger.info('Sign-in validation failed', {
        error: errorMessage,
        operation: 'signInWithPassword'
      });

      return {
        success: false,
        error: errorMessage
      };
    }

    // Attempt sign-in
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Mask email for privacy in logs
      const maskedEmail = `${email.substring(0, 3)}***`;

      // Expected auth errors at info level (not sent to Sentry)
      if (error.status === 400 || error.status === 401) {
        logger.info('Sign-in failed - invalid credentials', {
          email: maskedEmail,
          error: error.message,
          status: error.status,
          operation: 'signInWithPassword'
        });
      }
      // Unexpected auth errors at warn level (sent to Sentry via Winston transport)
      else {
        logger.warn('Sign-in failed - unexpected error', {
          email: maskedEmail,
          error: error.message,
          status: error.status,
          operation: 'signInWithPassword'
        });
      }

      return {
        success: false,
        error: error.message
      };
    }

    // Log successful sign-in with masked userId
    const maskedUserId = data.user?.id ? `${data.user.id.substring(0, 6)}...` : 'none';
    logger.info('User signed in successfully', {
      userId: maskedUserId,
      operation: 'signInWithPassword'
    });

    return {
      success: true,
      redirectTo
    };
  } catch (err) {
    // Handle unexpected errors (sent to Sentry via Winston transport)
    logger.error('Critical error during sign-in', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      operation: 'signInWithPassword'
    });

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}
```

#### 2. Refactor Sign-Out Action

**File**: `src/features/auth/actions/sign-out.action.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerLogger } from '@/lib/logger';

const logger = getServerLogger('AuthActions');

/**
 * Server action for user sign-out
 * Handles session termination and redirection
 *
 * Note: All warn/error level logs are automatically sent to Sentry
 * via the SentryWinstonTransport configured in winston.config.ts
 */
export async function signOutAction() {
  try {
    const cookieStore = cookies();
    const supabase = createClient();

    // Get current user before sign-out for logging
    const { data: { user } } = await supabase.auth.getUser();
    const maskedUserId = user?.id ? `${user.id.substring(0, 6)}...` : 'none';

    // Perform sign-out
    const { error } = await supabase.auth.signOut();

    if (error) {
      // Sign-out errors at warn level (sent to Sentry via Winston transport)
      logger.warn('Error during sign-out', {
        userId: maskedUserId,
        error: error.message,
        status: error.status,
        operation: 'signOut'
      });

      // Even with error, redirect to login
      redirect('/login');
    }

    // Log successful sign-out
    logger.info('User signed out successfully', {
      userId: maskedUserId,
      operation: 'signOut'
    });

    // Redirect to login page
    redirect('/login');
  } catch (err) {
    // Handle unexpected errors (sent to Sentry via Winston transport)
    logger.error('Critical error during sign-out', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      operation: 'signOut'
    });

    // Attempt redirect even after error
    redirect('/login');
  }
}
```

### Phase 7: Implement Centralized Error Boundaries

#### 1. Create Global Error Boundary

**File**: `src/app/global-error.tsx`

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * Global error boundary for the entire application
 * Captures and reports unhandled errors at the root level
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Dev-only console logging
    if (process.env.NODE_ENV === 'development') {
      console.error('[GlobalError] Unhandled global error:', error);
    }

    // Always report error to Sentry with proper context
    Sentry.captureException(error, {
      tags: { component: 'GlobalError', level: 'critical', type: 'globalError' },
      extra: {
        digest: error.digest,
        operation: 'GlobalError',
        message: "Unhandled global error"
      }
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="error-container">
          <h2>Something went wrong!</h2>
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  );
}
```

#### 2. Create Feature-Level Error Boundary

**File**: `src/features/auth/components/auth-error-boundary.tsx`

```typescript
'use client';

import { ErrorBoundary } from 'react-error-boundary';
import * as Sentry from '@sentry/nextjs';

/**
 * Feature-specific error boundary for authentication components
 * Provides more targeted error handling and fallback UI
 */
export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  const handleError = (error: Error, info: { componentStack: string }) => {
    // Dev-only console logging
    if (process.env.NODE_ENV === 'development') {
      console.error('[AuthErrorBoundary] Error caught:', error);
      console.error('Component stack:', info.componentStack);
    }

    // Always report to Sentry with component-specific context
    Sentry.captureException(error, {
      tags: { component: 'AuthErrorBoundary', type: 'authError' },
      extra: {
        componentStack: info.componentStack,
        operation: 'AuthErrorBoundary',
        message: "Error in authentication component"
      }
    });
  };

  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="auth-error-container">
          <h3>Authentication Error</h3>
          <p>There was a problem with the authentication system.</p>
          <button onClick={resetErrorBoundary}>Try Again</button>
        </div>
      )}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Summary of Optimizations

This comprehensive authentication optimization plan addresses the key issues identified in the current implementation while fully aligning with our established error logging architecture:

1. **Centralized Authentication Logic**
   - Single source of truth for auth state
   - Consistent error handling and logging with proper severity levels
   - Full integration with Winston/Sentry architecture via SentryWinstonTransport

2. **Aligned Error Logging Patterns**
   - Server components use `getServerLogger` with specific module names
   - Appropriate logging levels: info for expected events, warn/error for issues
   - Automatic Sentry reporting for warn/error logs via Winston transport
   - Consistent PII masking across all authentication logs

3. **Efficient Data Fetching**
   - Server-side prefetching with React cache()
   - Optimized TanStack Query configuration
   - Proper error handling with masked user data

4. **Optimized Client-Side Hooks**
   - Memoized derived states
   - Conditional console logging for development only
   - Comprehensive Sentry error reporting with proper context

5. **Unified Loading States**
   - Consistent minimum display times
   - Centralized loading provider
   - Performance tracking with Sentry breadcrumbs

6. **Robust Error Handling**
   - Centralized error handler utility following established patterns
   - Feature-specific error boundaries with proper Sentry integration
   - Development-only console logging with production Sentry reporting

## Implementation Checklist

- [ ] Updated all server components to use `getServerLogger` with specific module names
- [ ] Added explicit documentation about SentryWinstonTransport in key services
- [ ] Ensured client components use Sentry.captureException with proper context
- [ ] Implemented consistent PII masking across all authentication logs
- [ ] Reviewed and adjusted logging levels based on error severity
- [ ] Updated centralized error handling utility to follow established patterns
- [ ] Added conditional console logging for development environments only

These optimizations will significantly improve the authentication flow, reduce redundant operations, and provide better error visibility through proper integration with our established error logging architecture while maintaining compatibility with existing Google One Tap sign-in integration and email/password login functionality.