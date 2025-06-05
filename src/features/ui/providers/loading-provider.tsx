'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface LoadingContextType {
  // Core loading states
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
  startLoading: () => void;
  stopLoading: () => void;

  // Authentication-related states (from existing auth loading context)
  isAuthenticated: boolean;
  mounted: boolean;
  minTimeElapsed: boolean;

  // Dashboard-specific states (from existing dashboard loading context)
  isSigningOut: boolean;
  setIsSigningOut: (value: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

/**
 * Unified loading provider for consistent loading states across the entire application
 * Consolidates functionality from:
 * - src/features/auth/context/loading-context.tsx
 * - src/features/dashboard/context/dashboard-loading-context.tsx
 *
 * Provides centralized loading state management with:
 * - Minimum display times to prevent flashing
 * - Authentication state coordination
 * - Dashboard-specific optimistic UI states
 * - Sentry performance monitoring
 */
export function LoadingProvider({
  children,
  initialState = false,
  minimumLoadingTime = 500
}: {
  children: ReactNode;
  initialState?: boolean;
  minimumLoadingTime?: number;
}) {
  // Manual loading states
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  // Component lifecycle states
  const [mounted, setMounted] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Dashboard-specific states
  const [isSigningOut, setIsSigningOut] = useState(false);

  // For now, we'll provide basic loading functionality without auth dependency
  // This will be enhanced when the auth optimization is fully deployed
  const user = null;
  const isAuthLoading = false;
  const sessionError = null;

  // Debug flag for conditional logging
  const debugLoading = process.env.NODE_ENV === 'development' &&
                       process.env.NEXT_PUBLIC_DEBUG_LOADING === 'true';
  
  // Set mounted state and start minimum time timer (from existing loading contexts)
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setMinTimeElapsed(true), minimumLoadingTime);
    return () => clearTimeout(timer);
  }, [minimumLoadingTime]);

  // Reset signing out state when user becomes null (from dashboard loading context)
  useEffect(() => {
    if (!user && isSigningOut) {
      setIsSigningOut(false);
    }
  }, [user, isSigningOut]);

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

  // Calculate derived states (from existing loading contexts)
  const globalIsLoading = (!mounted || isAuthLoading || isLoading) && !minTimeElapsed;
  const isAuthenticated = mounted && !!user && !sessionError && !isAuthLoading && !isSigningOut;

  // Report loading state changes to Sentry for performance monitoring
  useEffect(() => {
    if (globalIsLoading) {
      Sentry.setTag('ui.loading', 'true');
    } else {
      Sentry.setTag('ui.loading', 'false');
    }
  }, [globalIsLoading]);

  const value: LoadingContextType = {
    // Core loading states
    isLoading: globalIsLoading,
    setLoading,
    startLoading,
    stopLoading,

    // Authentication-related states
    isAuthenticated,
    mounted,
    minTimeElapsed,

    // Dashboard-specific states
    isSigningOut,
    setIsSigningOut,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

/**
 * Hook to access the unified loading context
 * Provides all loading states including auth and dashboard-specific functionality
 * Replaces both useLoading and useDashboardLoading hooks
 */
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

/**
 * Alias for dashboard components that were using useDashboardLoading
 * Provides backward compatibility during migration
 */
export const useDashboardLoading = (): LoadingContextType => {
  return useLoading();
};
