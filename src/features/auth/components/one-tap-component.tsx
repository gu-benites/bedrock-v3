'use client'

import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

interface CredentialResponse {
  credential: string;
  select_by: string;
}

declare global {
  interface Window {
    google: any;
  }
}

interface OneTapComponentProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  showButton?: boolean;
}

// Global state to prevent multiple initializations
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

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
  const [currentNonce, setCurrentNonce] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Get Google Client ID
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Generate nonce to use for Google ID token sign-in
  const generateNonce = useCallback(async (): Promise<[string, string]> => {
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
    const encoder = new TextEncoder();
    const encodedNonce = encoder.encode(nonce);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return [nonce, hashedNonce];
  }, []);

  // Handle Google Sign-In callback
  const handleGoogleSignIn = useCallback(async (response: CredentialResponse) => {
    if (!currentNonce) {
      console.error('No nonce available for Google sign-in');
      onError?.('Authentication error occurred');
      return;
    }

    try {
      console.log('Processing Google One Tap sign-in...');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
        nonce: currentNonce, // Use the raw (non-hashed) nonce
      });

      if (error) {
        console.error('Supabase authentication error:', error);
        onError?.(error.message || 'Failed to sign in with Google');
        toast({
          title: "Sign-in Failed",
          description: error.message || 'Failed to sign in with Google. Please try again.',
          variant: "destructive"
        });
        return;
      }

      console.log('Successfully signed in with Google One Tap');
      onSuccess?.();
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Google.",
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error during Google sign-in:', error);
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
    if (!isScriptLoaded || !googleClientId || disabled) {
      return;
    }

    // Prevent multiple simultaneous initializations
    if (initializationPromise) {
      return;
    }

    const initializeGoogleOneTap = async () => {
      // Double-check if already initialized
      if (isInitialized) {
        return;
      }

      try {
        console.log('Initializing Google One Tap...');

        if (!window.google?.accounts?.id) {
          console.error('Google GSI library not available');
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
          console.error('Error checking session:', sessionError);
        }

        if (sessionData.session) {
          console.log('User already signed in, skipping One Tap');
          return;
        }

        // Validate environment for localhost
        const currentOrigin = window.location.origin;
        console.log('Current origin:', currentOrigin);

        if (currentOrigin.includes('localhost') && !googleClientId.includes('localhost')) {
          console.warn('Google Client ID may not be configured for localhost development');
        }

        // Generate nonce
        const [nonce, hashedNonce] = await generateNonce();
        setCurrentNonce(nonce);

        // Initialize Google One Tap with more conservative settings
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleSignIn,
          nonce: hashedNonce,
          use_fedcm_for_prompt: false, // Disable FedCM temporarily to test
          auto_select: false,
          context: 'signin',
          ux_mode: 'popup',
          cancel_on_tap_outside: true,
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

        // Show One Tap prompt with better error handling
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            const reason = notification.getNotDisplayedReason();
            console.warn('One Tap not displayed:', reason);

            // Handle specific reasons
            if (reason === 'browser_not_supported') {
              console.warn('Browser does not support Google One Tap');
            } else if (reason === 'invalid_client') {
              console.error('Google authentication configuration error - check Client ID');
              onError?.('Google authentication configuration error');
            } else if (reason === 'opt_out_or_no_session') {
              console.log('User opted out or no session available');
            } else if (reason === 'secure_http_required') {
              console.error('HTTPS required for Google One Tap');
            } else {
              console.warn('One Tap not displayed, reason:', reason);
            }
          } else if (notification.isSkippedMoment()) {
            console.log('One Tap skipped:', notification.getSkippedReason());
          } else if (notification.isDismissedMoment()) {
            console.log('One Tap dismissed:', notification.getDismissedReason());
          }
        });

        isInitialized = true;
        console.log('Google One Tap initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Google One Tap:', error);
        onError?.('Failed to initialize Google authentication');
      }
    };

    initializationPromise = initializeGoogleOneTap();
    initializationPromise.finally(() => {
      initializationPromise = null;
    });

  }, [isScriptLoaded, googleClientId, disabled, handleGoogleSignIn, generateNonce, supabase, showButton, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      isInitialized = false;
      initializationPromise = null;
    };
  }, []);

  // Don't render if Google Client ID is not configured
  if (!googleClientId) {
    console.warn('Google Client ID not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable.');
    return null;
  }

  // Debug information
  console.log('Google One Tap Component Debug Info:', {
    googleClientId: googleClientId ? `${googleClientId.substring(0, 20)}...` : 'NOT_SET',
    isScriptLoaded,
    disabled,
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'SSR',
    isInitialized
  });

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Google GSI script loaded successfully');
          setIsScriptLoaded(true);
        }}
        onError={(error) => {
          console.error('Failed to load Google GSI script:', error);
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
