'use client';

import { type User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import * as Sentry from '@sentry/nextjs';

interface AuthSessionContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

const AuthSessionContext = createContext<AuthSessionContextType | undefined>(
  undefined,
);

export const AuthSessionProvider = ({
  children,
  preloadedUser = null
}: {
  children: ReactNode;
  preloadedUser?: User | null;
}) => {
  const [user, setUser] = useState<User | null>(preloadedUser);
  const [isLoading, setIsLoading] = useState<boolean>(!preloadedUser);
  const [error, setError] = useState<Error | null>(null);
  
  // Conditional logging for development only
  const shouldLog = process.env.NODE_ENV === 'development' && 
                    process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';
  
  useEffect(() => {
    if (!preloadedUser) {
      const supabase = createClient();
      
      // Initial session check
      const getInitialSession = async () => {
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            // Dev-only console logging
            if (shouldLog) {
              console.warn('[AuthSessionProvider] Error getting initial session:', sessionError.message);
            }
            setError(sessionError);
            
            // Always report to Sentry with context
            Sentry.captureException(sessionError, {
              tags: { component: 'AuthSessionProvider', type: 'sessionError' },
              extra: { 
                operation: 'getInitialSession',
                message: 'Error getting initial session'
              }
            });
          }
          
          setUser(session?.user || null);
          setIsLoading(false);
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          
          // Dev-only console logging
          if (shouldLog) {
            console.error('[AuthSessionProvider] Critical error getting initial session:', error.message);
          }
          setError(error);
          setIsLoading(false);
          
          // Always report to Sentry with context
          Sentry.captureException(error, {
            tags: { component: 'AuthSessionProvider', type: 'criticalError' },
            extra: { 
              operation: 'getInitialSession',
              message: 'Critical error getting initial session'
            }
          });
        }
      };
      
      getInitialSession();
      
      // Subscribe to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (shouldLog) {
          console.log(`[AuthSessionProvider] Auth state changed: ${event}`);
        }
        
        // Handle auth events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user || null);
          
          // Log significant events to Sentry
          if (event === 'SIGNED_IN' && session?.user) {
            // Set user context with masked email for privacy
            Sentry.setUser({ 
              id: session.user.id, 
              email: session.user.email ? `${session.user.email.substring(0, 3)}***` : undefined 
            });
            
            Sentry.captureMessage('User signed in', {
              level: 'info',
              tags: { event, component: 'AuthSessionProvider' },
              extra: { 
                userId: `${session.user.id.substring(0, 6)}...`,
                operation: 'authStateChange'
              }
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          Sentry.setUser(null);
          Sentry.captureMessage('User signed out', {
            level: 'info',
            tags: { event, component: 'AuthSessionProvider' },
            extra: { operation: 'authStateChange' }
          });
        }
        
        // Handle errors in session
        const sessionWithError = session as (typeof session & { error?: any });
        if (sessionWithError?.error) {
          const sessionError = new Error(sessionWithError.error.message || 'Unknown session error');
          setError(sessionError);
          
          Sentry.captureException(sessionError, {
            tags: { component: 'AuthSessionProvider', event, type: 'sessionError' },
            extra: { 
              userId: sessionWithError.user?.id ? `${sessionWithError.user.id.substring(0, 6)}...` : 'none',
              errorName: sessionWithError.error.name,
              operation: 'authStateChange'
            }
          });
        } else {
          setError(null);
        }
      });
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [preloadedUser, shouldLog]);
  
  return (
    <AuthSessionContext.Provider value={{ user, isLoading, error }}>
      {children}
    </AuthSessionContext.Provider>
  );
};

export const useAuthSession = (): AuthSessionContextType => {
  const context = useContext(AuthSessionContext);
  if (context === undefined) {
    throw new Error('useAuthSession must be used within an AuthSessionProvider');
  }
  return context;
};
