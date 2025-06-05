import * as Sentry from '@sentry/nextjs';
import { getServerLogger } from '@/lib/logger';

export type ErrorContext = {
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
