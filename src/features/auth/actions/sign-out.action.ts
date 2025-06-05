'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerLogger } from '@/lib/logger';
import { handleError } from '@/lib/error';

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
    const cookieStore = await cookies();
    const supabase = await createClient();
    
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
    // Handle unexpected errors using centralized error handler
    handleError(err, {
      operation: 'signOut',
      component: 'AuthActions'
    });
    
    // Attempt redirect even after error
    redirect('/login');
  }
}
