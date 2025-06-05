// src/features/auth/components/one-tap-component.tsx
'use client'

import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import type { CredentialResponse } from '@/types/google-one-tap'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

// Client-side logger for Google One Tap
const clientLogger = {
  info: (message: string, ...args: any[]) => console.log(`[OneTap INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[OneTap ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[OneTap WARN] ${message}`, ...args),
};

// Global singleton to prevent multiple initializations
let isGoogleOneTapInitialized = false;
let initializationPromise: Promise<void> | null = null;

interface OneTapComponentProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  showButton?: boolean;
}

const OneTapComponent = ({
  onSuccess,
  onError,
  disabled = false,
  showButton = false
}: OneTapComponentProps) => {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentNonce, setCurrentNonce] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializationRef = useRef(false);

  // Get Google Client ID
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Generate nonce to use for Google ID token sign-in
  const generateNonce = useCallback(async (): Promise<[string, string]> => {
    try {
      const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
      const encoder = new TextEncoder();
      const encodedNonce = encoder.encode(nonce);
      const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      clientLogger.info('Generated nonce for Google One Tap');
      return [nonce, hashedNonce];
    } catch (error) {
      clientLogger.error('Failed to generate nonce', error);
      throw new Error('Failed to generate security nonce');
    }
  }, []);

  // Handle Google Sign-In callback
  const handleGoogleSignIn = useCallback(async (response: CredentialResponse) => {
    if (!currentNonce) {
      clientLogger.error('No nonce available for Google sign-in');
      onError?.('Authentication error occurred');
      return;
    }

    try {
      clientLogger.info('Processing Google One Tap sign-in...');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
        nonce: currentNonce, // Use the raw (non-hashed) nonce
      });

      if (error) {
        clientLogger.error('Supabase authentication error:', error);
        onError?.(error.message || 'Failed to sign in with Google');
        toast({
          title: "Sign-in Failed",
          description: error.message || 'Failed to sign in with Google. Please try again.',
          variant: "destructive"
        });
        return;
      }

      clientLogger.info('Successfully signed in with Google One Tap');
      onSuccess?.();
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Google.",
        variant: "default"
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      clientLogger.error('Error during Google sign-in:', error);
      onError?.(errorMessage);
      toast({
        title: "Sign-in Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  }, [currentNonce, supabase, router, onSuccess, onError, toast]);

  // Initialize Google One Tap
  useEffect(() => {
    if (!isScriptLoaded || !googleClientId || disabled || initializationRef.current || isGoogleOneTapInitialized) {
      return;
    }

    const initializeGoogleOneTap = async () => {
      // Prevent multiple simultaneous initializations
      if (initializationPromise) {
        await initializationPromise;
        return;
      }

      initializationPromise = (async () => {
        try {
          clientLogger.info('Initializing Google One Tap...');

          if (!window.google?.accounts?.id) {
            clientLogger.error('Google GSI library not available');
            return;
          }

          // Cancel any existing prompts first
          try {
            window.google.accounts.id.cancel();
          } catch (error) {
            // Ignore errors from canceling non-existent prompts
          }

        // Check if user is already signed in
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          clientLogger.error('Error checking session:', sessionError);
        }

        if (sessionData.session) {
          clientLogger.info('User already signed in, skipping One Tap');
          return;
        }

        // Generate nonce
        const [nonce, hashedNonce] = await generateNonce();
        setCurrentNonce(nonce);

        // Initialize Google One Tap with a small delay to ensure clean state
        setTimeout(() => {
          try {
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              callback: handleGoogleSignIn,
              nonce: hashedNonce, // Use the hashed nonce for Google's initialization
              use_fedcm_for_prompt: true,
              auto_select: false, // Don't auto-select to give user control
              context: 'signin',
              ux_mode: 'popup',
              cancel_on_tap_outside: false,
              itp_support: true,
            });

            // Render button if requested
            if (showButton && buttonRef.current) {
              window.google.accounts.id.renderButton(buttonRef.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'pill',
                logo_alignment: 'left',
              });
            }

            // Show One Tap prompt with a small delay
            setTimeout(() => {
              window.google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed()) {
                  const reason = notification.getNotDisplayedReason();
                  clientLogger.warn('One Tap not displayed:', reason);

                  // Handle specific reasons
                  if (reason === 'browser_not_supported') {
                    onError?.('Your browser does not support Google One Tap');
                  } else if (reason === 'invalid_client') {
                    onError?.('Google authentication configuration error');
                  }
                } else if (notification.isSkippedMoment()) {
                  clientLogger.info('One Tap skipped:', notification.getSkippedReason());
                } else if (notification.isDismissedMoment()) {
                  clientLogger.info('One Tap dismissed:', notification.getDismissedReason());
                }
              });
            }, 100);

            setIsInitialized(true);
            initializationRef.current = true;
            isGoogleOneTapInitialized = true;
            clientLogger.info('Google One Tap initialized successfully');
          } catch (initError) {
            clientLogger.error('Error during Google One Tap initialization:', initError);
            onError?.('Failed to initialize Google authentication');
          }
        }, 100);

        } catch (error) {
          clientLogger.error('Failed to initialize Google One Tap:', error);
          onError?.('Failed to initialize Google authentication');
        } finally {
          initializationPromise = null;
        }
      })();

      await initializationPromise;
    };

    // Only initialize once
    if (!initializationRef.current) {
      initializeGoogleOneTap();
    }
  }, [isScriptLoaded, googleClientId, disabled, handleGoogleSignIn, generateNonce, supabase, showButton, onError]);

  // Cleanup on unmount and prevent multiple initializations
  useEffect(() => {
    return () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      initializationRef.current = false;
      isGoogleOneTapInitialized = false;
      initializationPromise = null;
    };
  }, []);

  // Don't render if Google Client ID is not configured
  if (!googleClientId) {
    clientLogger.warn('Google Client ID not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable.');
    return null;
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          clientLogger.info('Google GSI script loaded successfully');
          setIsScriptLoaded(true);
        }}
        onError={(error) => {
          clientLogger.error('Failed to load Google GSI script:', error);
          onError?.('Failed to load Google authentication');
        }}
      />

      {/* Optional Sign In With Google button */}
      {showButton && (
        <div
          ref={buttonRef}
          className="flex justify-center mt-4"
          style={{ minHeight: '44px' }}
        />
      )}

      {/* One Tap will automatically show its prompt when initialized */}
    </>
  );
};

export default OneTapComponent;
