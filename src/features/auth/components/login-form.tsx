
"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { signInWithPasswordAction, signInWithGoogleRedirectAction, signInWithAzureRedirectAction } from "@/features/auth/actions";
import { useToast } from "@/hooks";
import { Loader2, Eye, EyeOff } from "lucide-react";
import * as Sentry from '@sentry/nextjs';
import { useSearchParams } from "next/navigation";
import OneTapComponent from './one-tap-component';


/**
 * A button component that displays a loading spinner while the form action is pending.
 * @returns {JSX.Element} The submit button.
 */
function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" className="w-full" disabled={isPending}>
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Login
    </Button>
  );
}




// List of common user-facing error messages that shouldn't be sent to Sentry as system errors.
const USER_FACING_ERROR_SUBSTRINGS = [
  "invalid email address",
  "password is required",
  "invalid login credentials",
  "please check your credentials",
  "oauth_init_failed",
  "oauth_no_url",
  "azure_oauth_init_failed",
  "azure_oauth_no_url"
];

/**
 * Renders the login form.
 * Allows users to sign in with their email and password or via Google or Microsoft.
 * Uses Server Actions to handle authentication.
 * Displays success or error messages using toasts and handles redirection on success.
 * Includes a password visibility toggle.
 * Integrates Google One-Tap sign-in.
 *
 * @returns {JSX.Element} The login form component.
 */
export default function LoginForm(): JSX.Element {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Remove unused useActionState for now - we'll handle form submission manually
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [googleClientIdExists, setGoogleClientIdExists] = useState(false);



  useEffect(() => {
    if (process.env['NEXT_PUBLIC_GOOGLE_CLIENT_ID']) {
      setGoogleClientIdExists(true);
    }
  }, []);

  useEffect(() => {
    const oauthError = searchParams.get('error');
    const oauthMessage = searchParams.get('message');
    if (oauthError) {
      let title = "OAuth Sign-In Failed";
      if (oauthError.includes('google')) title = "Google Sign-In Failed";
      if (oauthError.includes('azure')) title = "Microsoft Sign-In Failed";
      
      toast({
        title: title,
        description: oauthMessage || "An error occurred during OAuth Sign-In.",
        variant: "destructive",
      });
      Sentry.captureMessage(`OAuth Error on Login Page: ${oauthError}`, {
        level: 'warning',
        extra: { errorMessage: oauthMessage },
      });
    }
  }, [searchParams, toast]);

  // Handle form submission manually
  const handlePasswordSubmit = async (formData: FormData) => {
    setIsPending(true);
    setError(null);

    try {
      const result = await signInWithPasswordAction(formData);

      if (result?.success) {
        toast({
          title: "Success!",
          description: result.message || "Successfully signed in",
        });
        router.push('/dashboard');
      } else if (result?.message) {
        setError(result.message);
        toast({
          title: "Login Failed",
          description: result.message,
          variant: "destructive",
        });

        const isUserFacingError = USER_FACING_ERROR_SUBSTRINGS.some(sub =>
          result.message!.toLowerCase().includes(sub)
        );
        if (!isUserFacingError && !result.errorFields) {
          Sentry.captureMessage('Login action failed with unexpected server message', {
            level: 'error',
            extra: {
              action: 'signInWithPassword',
              formStateMessage: result.message,
              emailUsed: (document.getElementById('email') as HTMLInputElement)?.value?.substring(0,3) + '...'
            }
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  // Wrapper functions for social login actions
  const handleGoogleRedirect = async () => {
    try {
      await signInWithGoogleRedirectAction();
    } catch (error) {
      console.error('Google redirect error:', error);
    }
  };

  const handleAzureRedirect = async () => {
    try {
      await signInWithAzureRedirectAction();
    } catch (error) {
      console.error('Azure redirect error:', error);
    }
  };

  // Handle Google One Tap success
  const handleGoogleOneTapSuccess = () => {
    toast({
      title: "Welcome!",
      description: "Successfully signed in with Google.",
    });
  };

  // Handle Google One Tap error
  const handleGoogleOneTapError = (error: string) => {
    setError(error);
    toast({
      title: "Sign-in Failed",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <>
      {/* Google One Tap - only render once at the top level */}
      {googleClientIdExists && (
        <OneTapComponent
          onSuccess={handleGoogleOneTapSuccess}
          onError={handleGoogleOneTapError}
          disabled={isPending}
          showButton={false} // Don't show button here, we have it in the form
        />
      )}
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Login with your Microsoft or Google account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handlePasswordSubmit}>
              <div className="grid gap-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleAzureRedirect}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" fill="currentColor"/>
                      </svg>
                    )}
                    Login with Microsoft
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleRedirect}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                    Login with Google
                  </Button>
                </div>
                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-card text-muted-foreground relative z-10 px-2">
                    Or continue with
                  </span>
                </div>
                <div className="grid gap-6">
                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                      {error}
                    </div>
                  )}
                  <div className="grid gap-3">
                    <label htmlFor="email">Email</label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      disabled={isPending}
                    />
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <label htmlFor="password">Password</label>
                      <Link
                        href="/forgot-password"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        disabled={isPending}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        disabled={isPending}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                  <SubmitButton isPending={isPending} />
                </div>
                <div className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="underline underline-offset-4">
                    Sign up
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="text-muted-foreground text-center text-xs text-balance">
          By clicking continue, you agree to our{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </Link>
          .
        </div>
      </div>
    </>
  );
}
