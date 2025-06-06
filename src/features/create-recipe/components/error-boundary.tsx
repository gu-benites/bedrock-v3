/**
 * @fileoverview Error Boundary component for Essential Oil Recipe Creator.
 * Catches and handles React errors gracefully with user-friendly fallback UI.
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useRecipeStore } from '../store/recipe-store';

/**
 * Error boundary state interface
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * Error boundary props interface
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Error fallback component
 */
function ErrorFallback({ 
  error, 
  errorInfo, 
  errorId, 
  onRetry, 
  onReset 
}: {
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
  onRetry: () => void;
  onReset: () => void;
}) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="text-muted-foreground">
            We encountered an unexpected error while processing your recipe. 
            Your progress has been saved and you can try again.
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {isDevelopment && (
          <div className="bg-muted/50 rounded-lg p-4 text-left">
            <h3 className="text-sm font-medium text-foreground mb-2">
              Error Details (Development)
            </h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div>
                <strong>Error:</strong> {error.message}
              </div>
              <div>
                <strong>Error ID:</strong> {errorId}
              </div>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer hover:text-foreground">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 text-xs bg-muted rounded p-2 overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Try Again
          </button>
          
          <button
            onClick={onReset}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
          >
            Start Over
          </button>
        </div>

        {/* Support Information */}
        <div className="text-xs text-muted-foreground">
          <p>
            If this problem persists, please contact support with error ID: 
            <code className="bg-muted px-1 py-0.5 rounded ml-1">{errorId}</code>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Recipe Error Boundary component
 */
export class RecipeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID
    const errorId = `recipe-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('Recipe Error Boundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  /**
   * Log error to external monitoring service
   */
  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    try {
      // In a real application, you would send this to your error monitoring service
      // Example: Sentry, LogRocket, Bugsnag, etc.
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // For now, just log to console in production
      console.error('Error logged to monitoring service:', errorData);
      
      // TODO: Replace with actual error service integration
      // Example: Sentry.captureException(error, { extra: errorData });
    } catch (loggingError) {
      console.error('Failed to log error to monitoring service:', loggingError);
    }
  }

  /**
   * Retry the failed operation
   */
  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  /**
   * Reset the entire wizard
   */
  private handleReset = () => {
    // Reset error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });

    // Reset recipe store state
    // Note: This would need to be called from a hook or context
    // For now, we'll just reload the page as a fallback
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error fallback
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo!}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    captureError,
    resetError
  };
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <RecipeErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </RecipeErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default RecipeErrorBoundary;
