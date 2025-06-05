'use client';

import { ErrorBoundary } from 'react-error-boundary';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full mx-auto text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Authentication Error</h3>
            <p className="text-sm text-muted-foreground">
              There was a problem with the authentication system. Please try again or contact support if the issue persists.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button 
                onClick={resetErrorBoundary}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                size="sm"
              >
                Go Home
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}
