
"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Input, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Separator } from "@/components/ui";
import { signInWithPassword, signInWithGoogleRedirectAction, signInWithAzureRedirectAction } from "@/features/auth/actions";
import { useToast } from "@/hooks";
import { PassForgeLogo, GoogleLogo, MicrosoftLogo } from "@/components/icons";
import { LogIn, Mail, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import * as Sentry from '@sentry/nextjs';
import { useSearchParams } from "next/navigation";
import OneTapComponent from './one-tap-component'; 

/**
 * A button component that displays a loading spinner while the form action is pending.
 * @returns {JSX.Element} The submit button.
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
      Log In
    </Button>
  );
}

/**
 * A button component for Google Sign-In.
 * @returns {JSX.Element} The Google Sign-In button.
 */
function GoogleSignInButton() {
  const { pending } = useFormStatus(); 
  return (
    <Button type="submit" variant="outline" className="w-full" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <GoogleLogo className="mr-2 h-5 w-5" />
      )}
      Sign in with Google
    </Button>
  );
}

/**
 * A button component for Microsoft Sign-In.
 * @returns {JSX.Element} The Microsoft Sign-In button.
 */
function MicrosoftSignInButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" className="w-full" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <MicrosoftLogo className="mr-2 h-5 w-5" />
      )}
      Sign in with Microsoft
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
  const searchParams = useSearchParams();
  const initialStatePassword = { message: null, success: false, errorFields: null };
  const [statePassword, formActionPassword] = useActionState(signInWithPassword, initialStatePassword);
  
  const [showPassword, setShowPassword] = useState(false);
  const [googleClientIdExists, setGoogleClientIdExists] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
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

  useEffect(() => {
    if (statePassword?.message) {
      if (statePassword.success) {
        toast({
          title: "Success!",
          description: statePassword.message,
        });
      } else {
        toast({
          title: "Login Failed",
          description: statePassword.message,
          variant: "destructive",
        });
        const isUserFacingError = USER_FACING_ERROR_SUBSTRINGS.some(sub => 
          statePassword.message!.toLowerCase().includes(sub)
        );
        if (!isUserFacingError && !statePassword.errorFields) {
          Sentry.captureMessage('Login action failed with unexpected server message', {
            level: 'error',
            extra: { 
              action: 'signInWithPassword', 
              formStateMessage: statePassword.message,
              emailUsed: (document.getElementById('email') as HTMLInputElement)?.value?.substring(0,3) + '...'
            }
          });
        }
      }
    }
  }, [statePassword, toast]);

  return (
    <>
      {googleClientIdExists && <OneTapComponent />}
      <div className="w-full animate-fade-in">
        <Card className="w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <PassForgeLogo className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Welcome Back!</CardTitle>
            <CardDescription>Log in to your PassForge account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Social Logins First */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <form action={signInWithGoogleRedirectAction} className="w-full sm:flex-1">
                  <GoogleSignInButton />
                </form>
                <form action={signInWithAzureRedirectAction} className="w-full sm:flex-1">
                  <MicrosoftSignInButton />
                </form>
              </div>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form action={formActionPassword} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="pl-10 focus:ring-accent focus:placeholder-transparent"
                    aria-describedby={statePassword?.errorFields?.email ? "email-error" : undefined}
                  />
                </div>
                 {statePassword?.errorFields?.email && <p id="email-error" className="text-sm text-destructive">{statePassword.errorFields.email}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                   <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="pl-10 pr-10 focus:ring-accent focus:placeholder-transparent"
                    aria-describedby={statePassword?.errorFields?.password ? "password-error" : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
                {statePassword?.errorFields?.password && <p id="password-error" className="text-sm text-destructive">{statePassword.errorFields.password}</p>}
              </div>
              <SubmitButton />
            </form>
          </CardContent>
           <CardFooter className="flex-col items-center text-sm pt-4">
              <p className="text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary font-medium hover:underline">
                  Sign Up
                </Link>
              </p>
          </CardFooter>
        </Card>
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} PassForge. All rights reserved.
        </footer>
      </div>
    </>
  );
}
