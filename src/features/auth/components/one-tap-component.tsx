// src/features/auth/components/one-tap-component.tsx
'use client'

import Script from 'next/script'
import { createClient } from '@/lib/supabase/client' // Ensure this is your browser client
import type { CredentialResponse } from 'google-one-tap'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getServerLogger } from '@/lib/logger'; // Using server logger for client-side is not ideal, but for consistency if no client logger exists

// Using a simple console log for client-side, or you'd integrate a client-side logging solution
const clientLogger = {
  info: (message: string, ...args: any[]) => console.log(`[OneTap INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[OneTap ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[OneTap WARN] ${message}`, ...args),
};

const OneTapComponent = () => {
  const [supabase] = useState(() => createClient()); // Stable Supabase client instance
  const router = useRouter();
  const [isGsiScriptReady, setIsGsiScriptReady] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setGoogleClientId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  }, []);

  const generateNonce = async (): Promise<string[]> => {
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
    const encoder = new TextEncoder();
    const encodedNonce = encoder.encode(nonce);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return [nonce, hashedNonce];
  };

  useEffect(() => {
    if (!isGsiScriptReady || !googleClientId) {
      if (googleClientId === undefined && !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        // Only log warning once if client ID is definitively missing
        clientLogger.warn('Google Client ID not found. Google One-Tap will not initialize.');
      }
      return;
    }

    const initializeGoogleOneTap = async () => {
      clientLogger.info('Attempting to initialize Google One Tap...');

      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        clientLogger.error('Google GSI library not fully loaded on window object.');
        return;
      }

      const [nonce, hashedNonce] = await generateNonce();
      clientLogger.info('Generated Nonce (raw, hashed):', nonce.substring(0,5)+'...', hashedNonce.substring(0,5)+'...');

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        clientLogger.error('Error getting session before One-Tap init:', sessionError);
      }
      if (sessionData.session) {
        clientLogger.info('User already has a session. Skipping One-Tap display, redirecting to dashboard.');
        router.push('/dashboard');
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: CredentialResponse) => {
            clientLogger.info('Google One-Tap callback received.');
            try {
              const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
                nonce, // Use the raw (non-hashed) nonce here
              });

              if (error) {
                clientLogger.error('Error logging in with Google One Tap (Supabase signInWithIdToken):', error);
                // Optionally, provide user feedback here, e.g., via a toast
                throw error;
              }
              clientLogger.info('Successfully logged in with Google One Tap. Session data:', data);
              router.push('/dashboard'); // Redirect to dashboard on success
            } catch (error) {
              clientLogger.error('Caught error during One-Tap Supabase auth:', error);
            }
          },
          nonce: hashedNonce, // Use the hashed nonce for Google's initialization
          use_fedcm_for_prompt: true,
          auto_select: true, // Attempt to sign in automatically if conditions are met
          // context: 'signin', // Optional: can be 'signin', 'signup', or 'use'
          // ux_mode: 'popup', // Default is popup, can be 'redirect'
        });

        clientLogger.info('Google One-Tap initialized. Prompting...');
        window.google.accounts.id.prompt((notification: any) => {
          // This notification callback provides insights into the prompt's display status.
          // Useful for debugging why a prompt might not be showing.
          if (notification.isNotDisplayed()) {
            clientLogger.warn('Google One-Tap prompt was not displayed.', { reason: notification.getNotDisplayedReason() });
          } else if (notification.isSkippedMoment()) {
            clientLogger.info('Google One-Tap prompt was skipped.', { reason: notification.getSkippedReason() });
          } else if (notification.isDismissedMoment()) {
            clientLogger.info('Google One-Tap prompt was dismissed by user.', { reason: notification.getDismissedReason() });
          } else {
            clientLogger.info('Google One-Tap prompt displayed or other moment.', { moment_type: notification.getMomentType() });
          }
        });

      } catch (initError) {
        clientLogger.error('Error during google.accounts.id.initialize:', initError);
      }
    };

    initializeGoogleOneTap();

    // No specific cleanup for google.accounts.id.initialize or prompt is standard,
    // as it's meant to manage its lifecycle.
  }, [isGsiScriptReady, supabase, router, googleClientId]);


  if (!googleClientId) {
    // Don't render the script if the client ID is not configured.
    // This check happens after initial render due to how process.env works on client.
    // A console warning is logged in the useEffect.
    return null;
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => {
          clientLogger.info('Google GSI script ready.');
          setIsGsiScriptReady(true);
        }}
        onError={(e) => {
          clientLogger.error('Failed to load Google GSI script:', e);
        }}
      />
      {/* Google One-Tap does not require a specific div to render its default prompt UI.
          If using the Sign In With Google button, you would place its div here.
          <div id="g_id_onload" ...></div>
          <div class="g_id_signin" ...></div>
      */}
    </>
  );
}

export default OneTapComponent;
