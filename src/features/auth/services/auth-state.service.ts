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
    const cookieStore = await cookies();
    const supabase = await createClient();
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
    
    // Log successful auth state retrieval with masked user ID
    if (data.user?.id) {
      const maskedUserId = `${data.user.id.substring(0, 6)}...`;
      logger.info('Auth state retrieved successfully', {
        userId: maskedUserId,
        operation: 'getServerAuthState'
      });
    } else {
      logger.info('Auth state retrieved - no user session', {
        operation: 'getServerAuthState'
      });
    }
    
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
