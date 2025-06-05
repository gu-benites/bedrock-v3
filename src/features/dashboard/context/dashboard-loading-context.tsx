// src/features/dashboard/context/dashboard-loading-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';

interface DashboardLoadingContextType {
  isLoading: boolean; // Dashboard-specific loading state
  isAuthenticated: boolean; // Derived authentication state
  isSigningOut: boolean; // Optimistic sign-out state
  setIsSigningOut: (value: boolean) => void; // Function to set sign-out state
  mounted: boolean; // Component mount state
  minTimeElapsed: boolean; // Minimum loading time elapsed
}

const DashboardLoadingContext = createContext<DashboardLoadingContextType | undefined>(undefined);

/**
 * Dashboard-specific loading context provider that extends global loading behavior.
 * Includes optimistic UI updates for sign-out operations and dashboard-specific loading states.
 */
export const DashboardLoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, isLoadingAuth, sessionError } = useAuth();

  // Set mounted state and start minimum time timer
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setMinTimeElapsed(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Reset signing out state when user becomes null (sign-out completed)
  useEffect(() => {
    if (!user && isSigningOut) {
      setIsSigningOut(false);
    }
  }, [user, isSigningOut]);

  // Calculate loading state: show loading if not mounted, auth is loading, or min time hasn't elapsed
  const isLoading = (!mounted || isLoadingAuth) && !minTimeElapsed;
  
  // Calculate authentication state: authenticated if mounted, has user, no session error, not loading, and not signing out
  const isAuthenticated = mounted && !!user && !sessionError && !isLoadingAuth && !isSigningOut;

  const value: DashboardLoadingContextType = {
    isLoading,
    isAuthenticated,
    isSigningOut,
    setIsSigningOut,
    mounted,
    minTimeElapsed,
  };

  return (
    <DashboardLoadingContext.Provider value={value}>
      {children}
    </DashboardLoadingContext.Provider>
  );
};

/**
 * Hook to access the dashboard loading context.
 * Provides dashboard-specific loading and authentication states with optimistic UI support.
 */
export const useDashboardLoading = (): DashboardLoadingContextType => {
  const context = useContext(DashboardLoadingContext);
  if (context === undefined) {
    throw new Error('useDashboardLoading must be used within a DashboardLoadingProvider');
  }
  return context;
};
