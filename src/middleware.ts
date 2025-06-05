import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import * as Sentry from '@sentry/nextjs';

// Define public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/register', '/reset-password', '/'];

export async function middleware(request: NextRequest) {
  try {
    // Create supabase middleware client
    const { supabase, response } = createClient(request);
    
    // Check if path is public
    const isPublicPath = PUBLIC_PATHS.some(path => 
      request.nextUrl.pathname === path || 
      request.nextUrl.pathname.startsWith(`${path}/`)
    );
    
    // Get session with minimal logging
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Handle session errors
    if (sessionError && !isPublicPath) {
      // Expected auth errors (not logged to console or Sentry)
      if (sessionError.message === "Auth session missing!") {
        // Just redirect without logging
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('next', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
      // Unexpected auth errors (logged to console and Sentry)
      else {
        console.warn(`[Middleware] Auth error: ${sessionError.message}`);
        
        // Report to Sentry with proper context
        Sentry.captureException(sessionError, {
          tags: { component: 'Middleware', type: 'sessionError' },
          extra: { 
            path: request.nextUrl.pathname,
            operation: 'middleware',
            message: "Session error in middleware"
          }
        });
        
        // Redirect to login
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('next', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }
    
    // Handle protected routes
    if (!session && !isPublicPath) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Handle auth routes when already authenticated
    if (session && (
      request.nextUrl.pathname === '/login' || 
      request.nextUrl.pathname === '/register'
    )) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Continue with the response
    return response;
  } catch (err) {
    // Simple error handling for Edge Runtime (no Winston logger available)
    if (process.env.NODE_ENV === 'development') {
      console.error('[Middleware] Critical error:', err);
    }

    // Report to Sentry
    Sentry.captureException(err, {
      tags: { component: 'Middleware', type: 'criticalError' },
      extra: {
        path: request.nextUrl.pathname,
        operation: 'middleware',
        message: "Critical error in middleware"
      }
    });

    // For critical errors, allow the request to proceed
    // The application's error boundaries will handle rendering
    return NextResponse.next();
  }
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
