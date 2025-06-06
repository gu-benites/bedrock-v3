/**
 * @fileoverview Authentication guard component for Essential Oil Recipe Creator.
 * Provides client-side authentication protection and loading states.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useLoading } from '@/features/auth/context/loading-context';
import { getServerLogger } from '@/lib/logger';

/**
 * Props for the AuthGuard component
 */
interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireProfile?: boolean;
}

/**
 * Loading component for authentication check
 */
function AuthLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <h2 className="text-xl font-semibold text-foreground">
          Checking Authentication
        </h2>
        <p className="text-muted-foreground">
          Please wait while we verify your access...
        </p>
      </div>
    </div>
  );
}

/**
 * Unauthorized access component
 */
function UnauthorizedFallback({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();

  useEffect(() => {
    // Redirect after a short delay to show the message
    const timer = setTimeout(() => {
      const loginUrl = `/login?next=${encodeURIComponent(redirectTo)}`;
      router.push(loginUrl);
    }, 2000);

    return () => clearTimeout(timer);
  }, [router, redirectTo]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-7a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Authentication Required
          </h2>
          <p className="text-muted-foreground">
            You need to be signed in to access the Recipe Creator.
          </p>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Redirecting you to login...
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Please wait</span>
          </div>
        </div>
        
        <div className="pt-4">
          <button
            onClick={() => {
              const loginUrl = `/login?next=${encodeURIComponent(redirectTo)}`;
              router.push(loginUrl);
            }}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Profile incomplete component
 */
function ProfileIncompleteFallback() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-warning"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Profile Setup Required
          </h2>
          <p className="text-muted-foreground">
            Please complete your profile to access the Recipe Creator.
          </p>
        </div>
        
        <div className="pt-4 space-x-4">
          <button
            onClick={() => router.push('/dashboard/profile')}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Complete Profile
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Authentication guard component that protects recipe creator routes
 */
export function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/dashboard/create-recipe',
  requireProfile = false
}: AuthGuardProps) {
  const { user, profile, isAuthenticated, isLoading, error } = useAuth();
  const { isLoading: isGlobalLoading } = useLoading();
  const router = useRouter();

  // Show loading state while checking authentication
  if (isLoading || isGlobalLoading) {
    return fallback || <AuthLoadingFallback />;
  }

  // Handle authentication errors
  if (error) {
    console.error('Authentication error in AuthGuard:', error);
    
    // Log error for debugging but don't expose to user
    if (typeof window !== 'undefined') {
      console.warn('Auth error, redirecting to login');
    }
    
    return <UnauthorizedFallback redirectTo={redirectTo} />;
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return <UnauthorizedFallback redirectTo={redirectTo} />;
  }

  // Check if profile is required and available
  if (requireProfile && !profile) {
    return <ProfileIncompleteFallback />;
  }

  // User is authenticated and has required profile (if needed)
  return <>{children}</>;
}

/**
 * Higher-order component for protecting pages with authentication
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    redirectTo?: string;
    requireProfile?: boolean;
  }
) {
  const AuthGuardedComponent = (props: P) => {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };

  AuthGuardedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
  
  return AuthGuardedComponent;
}

/**
 * Hook for checking authentication status in components
 */
export function useAuthGuard(requireProfile: boolean = false) {
  const { user, profile, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const checkAuth = () => {
    if (isLoading) return { canAccess: false, reason: 'loading' };
    if (!isAuthenticated || !user) return { canAccess: false, reason: 'unauthenticated' };
    if (requireProfile && !profile) return { canAccess: false, reason: 'incomplete_profile' };
    return { canAccess: true, reason: 'authorized' };
  };

  const redirectToLogin = (returnUrl?: string) => {
    const loginUrl = `/login${returnUrl ? `?next=${encodeURIComponent(returnUrl)}` : ''}`;
    router.push(loginUrl);
  };

  const redirectToProfile = () => {
    router.push('/dashboard/profile');
  };

  return {
    ...checkAuth(),
    user,
    profile,
    isLoading,
    redirectToLogin,
    redirectToProfile
  };
}
