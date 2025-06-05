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
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full mx-auto p-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">⚠️</div>
              <h1 className="text-2xl font-bold text-foreground">Something went wrong!</h1>
              <p className="text-muted-foreground">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
              <button 
                onClick={() => reset()}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
