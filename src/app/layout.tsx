
// Providers like ThemeProvider handle their own client boundaries.
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Added Inter
import '../styles/globals.css';
import { Toaster } from "@/components/ui";
import { AuthSessionProvider, QueryClientProvider, ThemeProvider } from '@/providers';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createClient } from '@/lib/supabase/server';

const inter = Inter({
  variable: '--font-sans', // Changed to --font-sans for Tailwind compatibility
  subsets: ['latin'],
  display: 'swap',
});

// Add basic metadata, which is good practice for Server Component layouts
export const metadata: Metadata = {
  title: 'PassForge',
  description: 'Secure password management by PassForge.',
};

/**
 * Root layout for the PassForge application.
 * Sets up global styles, fonts, and context providers.
 * Fetches user data server-side to prevent authentication loading states.
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthSessionProvider preloadedUser={user}> {/* Auth provider wraps QueryClientProvider */}
            <QueryClientProvider>
              {children}
              <Toaster />
              {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
