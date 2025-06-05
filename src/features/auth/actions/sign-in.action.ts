'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getServerLogger } from '@/lib/logger';
import { z } from 'zod';
import { handleError } from '@/lib/error';

const logger = getServerLogger('AuthActions');

// Validation schema
const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  redirectTo: z.string().optional()
});

type SignInResult = {
  success: boolean;
  error?: string;
  redirectTo?: string;
};

/**
 * Server action for user sign-in
 * Handles validation, authentication, and redirection
 * 
 * Note: All warn/error level logs are automatically sent to Sentry
 * via the SentryWinstonTransport configured in winston.config.ts
 */
export async function signInWithPasswordAction(formData: FormData): Promise<SignInResult> {
  try {
    // Extract and validate form data
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirectTo') as string || '/dashboard';
    
    // Validate input
    const validationResult = signInSchema.safeParse({ email, password, redirectTo });
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || 'Invalid input';
      
      logger.info('Sign-in validation failed', {
        error: errorMessage,
        operation: 'signInWithPassword'
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
    
    // Attempt sign-in
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      // Mask email for privacy in logs
      const maskedEmail = `${email.substring(0, 3)}***`;
      
      // Expected auth errors at info level (not sent to Sentry)
      if (error.status === 400 || error.status === 401) {
        logger.info('Sign-in failed - invalid credentials', {
          email: maskedEmail,
          error: error.message,
          status: error.status,
          operation: 'signInWithPassword'
        });
      } 
      // Unexpected auth errors at warn level (sent to Sentry via Winston transport)
      else {
        logger.warn('Sign-in failed - unexpected error', {
          email: maskedEmail,
          error: error.message,
          status: error.status,
          operation: 'signInWithPassword'
        });
      }
      
      return {
        success: false,
        error: error.message
      };
    }
    
    // Log successful sign-in with masked userId
    const maskedUserId = data.user?.id ? `${data.user.id.substring(0, 6)}...` : 'none';
    logger.info('User signed in successfully', {
      userId: maskedUserId,
      operation: 'signInWithPassword'
    });
    
    return {
      success: true,
      redirectTo
    };
  } catch (err) {
    // Handle unexpected errors using centralized error handler
    const error = handleError(err, {
      operation: 'signInWithPassword',
      component: 'AuthActions'
    });
    
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Server action for user sign-in with redirect
 * Handles validation, authentication, and automatic redirection
 */
export async function signInWithPasswordRedirectAction(formData: FormData): Promise<void> {
  const result = await signInWithPasswordAction(formData);
  
  if (result.success && result.redirectTo) {
    redirect(result.redirectTo);
  } else {
    // Redirect to login with error
    const errorParam = result.error ? `?error=${encodeURIComponent(result.error)}` : '';
    redirect(`/login${errorParam}`);
  }
}
