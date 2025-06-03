
"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Separator } from "@/components/ui";
import { signUpNewUser, signInWithGoogleRedirectAction, signInWithAzureRedirectAction } from "@/features/auth/actions";
import { useToast } from "@/hooks";
import { PassForgeLogo, GoogleLogo, MicrosoftLogo } from "@/components/icons";
import { UserPlus, Mail, KeyRound, Loader2, Eye, EyeOff, User } from "lucide-react";
import * as Sentry from '@sentry/nextjs';

/**
 * A button component that displays a loading spinner while the form action is pending.
 * @returns {JSX.Element} The submit button.
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
      Create Account
    </Button>
  );
}

/**
 * A button component for Google Sign-Up.
 * @returns {JSX.Element} The Google Sign-Up button.
 */
function GoogleSignUpButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" className="w-full" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <GoogleLogo className="mr-2 h-5 w-5" />
      )}
      Sign up with Google
    </Button>
  );
}

/**
 * A button component for Microsoft Sign-Up.
 * @returns {JSX.Element} The Microsoft Sign-Up button.
 */
function MicrosoftSignUpButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" className="w-full" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <MicrosoftLogo className="mr-2 h-5 w-5" />
      )}
      Sign up with Microsoft
    </Button>
  );
}

// List of common user-facing error messages or informational messages that shouldn't be sent to Sentry as system errors.
const USER_FACING_REGISTER_MESSAGES = [
  "invalid email address",
  "password cannot be empty",
  "password must be at least 8 characters long",
  "first name is required",
  "last name is required",
  "passwords do not match",
  "please correct the errors in the form",
  "account already confirmed. you can now log in.",
  "sign up initiated! please check your email to confirm your account before logging in.",
  "sign up process initiated. please check your email."
];

/**
 * Renders the registration form.
 * Allows new users to sign up with their first name, last name, email, and password, or via social providers.
 * Uses Server Actions to handle account creation.
 * Displays success or error messages using toasts.
 * Includes password visibility toggles for password and confirm password fields.
 * On successful sign-up initiation, displays a message prompting email confirmation.
 *
 * @returns {JSX.Element} The registration form component.
 */
export function RegisterForm(): JSX.Element {
  const router = useRouter();
  const { toast } = useToast();
  const initialState = { message: null, success: false, errorFields: null };
  const [state, formAction] = useActionState(signUpNewUser, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast({
          title: "Account Created!",
          description: state.message,
        });
        // Form re-renders to show success message (see below)
      } else {
        toast({
          title: "Registration Failed",
          description: state.message,
          variant: "destructive",
        });
        const isUserFacingError = USER_FACING_REGISTER_MESSAGES.some(sub => 
          state.message!.toLowerCase().includes(sub)
        );
        if (!isUserFacingError && !state.errorFields) {
          Sentry.captureMessage('Registration action failed with unexpected server message', {
            level: 'error',
            extra: { 
              action: 'signUpNewUser', 
              formStateMessage: state.message,
              emailUsed: (document.getElementById('email') as HTMLInputElement)?.value?.substring(0,3) + '...'
            }
          });
        }
      }
    }
  }, [state, toast, router]);

  if (state?.success) {
    return (
     <div className="w-full animate-fade-in">
       <Card className="w-full shadow-xl">
         <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
             <PassForgeLogo className="h-12 w-12 text-primary" />
           </div>
           <CardTitle className="text-3xl font-bold">Confirm Your Email</CardTitle>
           <CardDescription>{state.message}</CardDescription>
         </CardHeader>
         <CardContent>
           <Button onClick={() => router.push('/login')} className="w-full">
             Go to Login
           </Button>
         </CardContent>
       </Card>
        <footer className="mt-8 text-center text-sm text-muted-foreground">
         &copy; {new Date().getFullYear()} PassForge. All rights reserved.
       </footer>
     </div>
    )
 }

  return (
    <div className="w-full animate-fade-in">
      <Card className="w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PassForgeLogo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription>Join PassForge today. It's free!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           {/* Social Sign Up Buttons */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <form action={signInWithGoogleRedirectAction} className="w-full sm:flex-1">
                  <GoogleSignUpButton />
                </form>
                <form action={signInWithAzureRedirectAction} className="w-full sm:flex-1">
                  <MicrosoftSignUpButton />
                </form>
              </div>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or sign up with your email
                </span>
              </div>
            </div>
            
          {/* Email/Password Form */}
          <form action={formAction} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="space-y-2 flex-1">
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-foreground"
                  >
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      required
                      className="pl-10 focus:ring-accent focus:placeholder-transparent"
                      aria-describedby={state?.errorFields?.firstName ? "firstName-error" : undefined}
                    />
                  </div>
                  {state?.errorFields?.firstName && <p id="firstName-error" className="text-sm text-destructive">{state.errorFields.firstName}</p>}
                </div>
                <div className="space-y-2 flex-1">
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-foreground"
                  >
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      required
                      className="pl-10 focus:ring-accent focus:placeholder-transparent"
                      aria-describedby={state?.errorFields?.lastName ? "lastName-error" : undefined}
                    />
                  </div>
                  {state?.errorFields?.lastName && <p id="lastName-error" className="text-sm text-destructive">{state.errorFields.lastName}</p>}
                </div>
            </div>
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
                  aria-describedby={state?.errorFields?.email ? "email-error" : undefined}
                />
              </div>
               {state?.errorFields?.email && <p id="email-error" className="text-sm text-destructive">{state.errorFields.email}</p>}
            </div>
            <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground"
                >
                  Password
                </label>
              <div className="relative">
                 <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="pl-10 pr-10 focus:ring-accent focus:placeholder-transparent"
                  aria-describedby={state?.errorFields?.password ? "password-error" : undefined}
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
              {state?.errorFields?.password && <p id="password-error" className="text-sm text-destructive">{state.errorFields.password}</p>}
            </div>
             <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground"
              >
                Confirm Password
              </label>
              <div className="relative">
                 <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="pl-10 pr-10 focus:ring-accent focus:placeholder-transparent"
                  aria-describedby={state?.errorFields?.confirmPassword ? "confirmPassword-error" : undefined}
                />
                 <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {state?.errorFields?.confirmPassword && <p id="confirmPassword-error" className="text-sm text-destructive">{state.errorFields.confirmPassword}</p>}
            </div>
            <SubmitButton />
          </form>
        </CardContent>
         <CardFooter className="flex-col items-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Log In
              </Link>
            </p>
        </CardFooter>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} PassForge. All rights reserved.
      </footer>
    </div>
  );
}

    