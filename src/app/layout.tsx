import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthSessionProvider } from '@/providers/auth-session-provider';
import QueryClientProvider from '@/providers/query-client-provider';
import { Toaster } from '@/components/ui/toaster';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createClient } from '@/lib/supabase/server';
import { getServerAuthState } from '@/features/auth/services/auth-state.service';
import { getServerLogger } from '@/lib/logger';
import { WebVitalsProvider } from '@/components/monitoring/web-vitals-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const logger = getServerLogger('RootLayout');

export const metadata: Metadata = {
  title: 'PassForge',
  description: 'Secure password management for everyone',
};

/**
 * Optimized root layout for the PassForge application.
 * Sets up global styles, fonts, and context providers.
 * Uses centralized auth state service to prevent authentication loading states.
 *
 * @param {object} props - The component's props.
 * @param {React.ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The root layout structure.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<JSX.Element> {
  try {
    const { user, error } = await getServerAuthState();
    
    if (error) {
      // Error already logged in getServerAuthState, just add context
      logger.warn('Error getting auth state in root layout', {
        error: error.message,
        stack: error.stack,
        operation: 'RootLayout'
      });
    }
    
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthSessionProvider preloadedUser={user}>
              <QueryClientProvider>
                <WebVitalsProvider>
                  {children}
                  <Toaster />
                  {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
                </WebVitalsProvider>
              </QueryClientProvider>
            </AuthSessionProvider>
          </ThemeProvider>
        </body>
      </html>
    );
  } catch (err) {
    logger.error('Critical error in root layout', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      operation: 'RootLayout'
    });
    
    // Fallback rendering without auth
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryClientProvider>
              <WebVitalsProvider>
                {children}
                <Toaster />
                {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
              </WebVitalsProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </body>
      </html>
    );
  }
}
