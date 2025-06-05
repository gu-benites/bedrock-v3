// src/features/auth/context/loading-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';

interface LoadingContextType {
  isLoading: boolean; // Global loading state with minimum display time
  isAuthenticated: boolean; // Derived authentication state
  mounted: boolean; // Component mount state
  minTimeElapsed: boolean; // Minimum loading time elapsed
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

/**
 * Global loading context provider that manages loading states across the application.
 * Implements minimum display time for loading indicators to prevent flashing.
 * Coordinates with authentication state for consistent UX.
 */
export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const { user, isLoadingAuth, sessionError } = useAuth();

  // Set mounted state and start minimum time timer
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setMinTimeElapsed(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Calculate loading state: show loading if not mounted, auth is loading, or min time hasn't elapsed
  const isLoading = (!mounted || isLoadingAuth) && !minTimeElapsed;
  
  // Calculate authentication state: authenticated if mounted, has user, no session error, and not loading
  const isAuthenticated = mounted && !!user && !sessionError && !isLoadingAuth;

  const value: LoadingContextType = {
    isLoading,
    isAuthenticated,
    mounted,
    minTimeElapsed,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

/**
 * Hook to access the global loading context.
 * Provides consistent loading and authentication states across components.
 */
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
