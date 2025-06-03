// src/features/dashboard/profile/profile-view.tsx
'use client';

import React, { useEffect, useId, useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form'; 
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/features/auth/hooks';
import type { UserProfile } from '@/features/user-auth-data/schemas';
import { useQueryClient } from '@tanstack/react-query';

import { 
  useProfileUpdate, 
  ProfileFormSchema, // Schema for validation
  type ProfileFormValues, // Type for form values
  languageOptions, 
  ageCategoryOptions 
} from './hooks/use-profile-update';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Keep for non-Form fields if any, or direct styling
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { UserCircle2, Mail, Save, Loader2, Ban } from 'lucide-react';
import { useCharacterLimit } from '@/hooks';
import { ProfileBannerUploader, ProfileAvatarUploader, ProfileAccountInfo, ProfileSubscriptionDetails } from './components';

import * as Sentry from '@sentry/nextjs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const clientLogger = {
    info: (message: string, context?: any) => console.log(`[ProfileViewINFO] ${message}`, context),
    warn: (message: string, context?: any) => console.warn(`[ProfileViewWARN] ${message}`, context),
    error: (message: string, context?: any) => console.error(`[ProfileViewERROR] ${message}`, context),
};

const MAX_BIO_LENGTH = 180;

export function ProfileView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    user,
    profile: originalProfile, // Renamed to avoid conflict with form state
    isLoadingAuth,
    isSessionLoading,
    sessionError,
    profileError,
  } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: originalProfile || { // Initialize with empty strings or defaults for controlled components
        firstName: "", lastName: "", bio: "", language: "en", 
        ageCategory: null, specificAge: null,
        avatarUrl: null, bannerUrl: null,
        // other fields from UserProfile can be defaulted here
    },
  });
  
  const bioFormValue = form.watch('bio'); // Watch for live updates to bio in the form
  const {
    value: bioDisplayValue, // This is the state managed by useCharacterLimit
    characterCount: bioCharacterCount,
    handleChange: handleBioChangeInternal, // Internal handler of useCharacterLimit
    updateValue: updateBioDisplayValue, // Function to programmatically update useCharacterLimit
    maxLength: bioMaxLength,
  } = useCharacterLimit({
    maxLength: MAX_BIO_LENGTH,
    initialValue: originalProfile?.bio || "",
  });

  // This effect syncs the form's bio field with the bioDisplayValue from the character limit hook
  useEffect(() => {
    if (bioDisplayValue !== bioFormValue) {
      form.setValue('bio', bioDisplayValue, { shouldDirty: true, shouldValidate: true });
    }
  }, [bioDisplayValue, bioFormValue, form]);

  // Effect to reset the form when the originalProfile from useAuth changes
  useEffect(() => {
    clientLogger.info('ProfileView: originalProfile or user changed, resetting form.', {
        hasOriginalProfile: !!originalProfile,
        userId: user?.id,
        isLoadingAuth,
        profileError: profileError?.message
    });
    if (originalProfile) {
      const newAvatarUrl = originalProfile.avatarUrl ? `${originalProfile.avatarUrl.split('?')[0]}?t=${new Date().getTime()}` : null;
      const newBannerUrl = originalProfile.bannerUrl ? `${originalProfile.bannerUrl.split('?')[0]}?t=${new Date().getTime()}` : null;
      clientLogger.info('ProfileView: Resetting form with originalProfile data.', {
        profileId: originalProfile.id,
        newAvatarUrl,
        newBannerUrl,
      });
      form.reset({
        ...originalProfile,
        avatarUrl: newAvatarUrl,
        bannerUrl: newBannerUrl,
        avatarDataUri: undefined, 
        bannerDataUri: undefined,
      });
      updateBioDisplayValue(originalProfile.bio || "");
    } else if (user && !isLoadingAuth && !profileError) {
        // This case handles when a user is authenticated but might not have a profile yet (e.g., new user)
        // Or if profile fetching failed but we still want to show a basic form.
        clientLogger.info('ProfileView: No originalProfile, resetting form with user metadata or defaults.');
        const initialFormValues: ProfileFormValues = {
            id: user.id, email: user.email || '', // Email is from auth, not editable
            firstName: (user.user_metadata?.first_name as string) || "",
            lastName: (user.user_metadata?.last_name as string) || "",
            avatarUrl: (user.user_metadata?.avatar_url as string) || null,
            // Default other fields
            gender: null, ageCategory: null, specificAge: null, language: "en",
            bannerUrl: null, bio: "", role: 'user', 
            createdAt: new Date().toISOString(), // Placeholder
            updatedAt: new Date().toISOString(), // Placeholder
            // Ensure all UserProfile fields have a default
            stripeCustomerId: null, subscriptionStatus: null, subscriptionTier: null,
            subscriptionPeriod: null, subscriptionStartDate: null, subscriptionEndDate: null,
            avatarDataUri: undefined,
            bannerDataUri: undefined,
        };
        form.reset(initialFormValues);
        updateBioDisplayValue(""); // Reset bio display as well
    }
     // If isLoadingAuth is true, or sessionError exists, form reset is deferred until data is stable.
  }, [originalProfile, user, form, updateBioDisplayValue, isLoadingAuth, profileError]);

  // Define the success handler for the mutation
  const handleSuccessfulUpdate = (updatedData?: UserProfile) => {
    clientLogger.info('ProfileView: handleSuccessfulUpdate called.', { updatedData });
    toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
    if (updatedData) {
      // Reset the form with the new data returned from the server action
      // This ensures the form reflects the true state after update, including new image URLs
      const newAvatarUrl = updatedData.avatarUrl ? `${updatedData.avatarUrl.split('?')[0]}?t=${new Date().getTime()}` : null;
      const newBannerUrl = updatedData.bannerUrl ? `${updatedData.bannerUrl.split('?')[0]}?t=${new Date().getTime()}` : null;
      form.reset({
          ...updatedData,
          avatarUrl: newAvatarUrl,
          bannerUrl: newBannerUrl,
          avatarDataUri: undefined, // Clear the data URI fields as they've been processed
          bannerDataUri: undefined,
      });
      updateBioDisplayValue(updatedData.bio || "");
    } else if (originalProfile) {
        // If mutation didn't return data (e.g., no actual change was made on server), reset to original state
        const currentAvatarUrl = originalProfile.avatarUrl ? `${originalProfile.avatarUrl.split('?')[0]}?t=${new Date().getTime()}` : null;
        const currentBannerUrl = originalProfile.bannerUrl ? `${originalProfile.bannerUrl.split('?')[0]}?t=${new Date().getTime()}` : null;
        form.reset({
            ...originalProfile,
            avatarUrl: currentAvatarUrl,
            bannerUrl: currentBannerUrl,
            avatarDataUri: undefined,
            bannerDataUri: undefined,
        });
        updateBioDisplayValue(originalProfile.bio || "");
    }
    // queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] }); // Invalidation is now in the hook's onSuccess
  };
  
  const { performUpdate, isPending } = useProfileUpdate({
    user,
    profile: originalProfile,
    queryClient,
    toast,
  });

  const onSubmit = (data: ProfileFormValues) => {
    clientLogger.info('[ProfileView] onSubmit triggered. FormData (URIs snipped):', {
      ...data,
      avatarDataUri: data.avatarDataUri ? data.avatarDataUri.substring(0, 50) + '...' : data.avatarDataUri,
      bannerDataUri: data.bannerDataUri ? data.bannerDataUri.substring(0, 50) + '...' : data.bannerDataUri,
    });
    performUpdate(data, { onSuccess: handleSuccessfulUpdate });
  };

  const getInitials = useCallback(() => {
    if (!user && !originalProfile && !form.getValues('firstName')) return <UserCircle2 size={32} />;
    const formValues = form.getValues();
    const first = formValues.firstName || originalProfile?.firstName || (user?.user_metadata?.first_name as string)?.[0] || '';
    const last = formValues.lastName || originalProfile?.lastName || (user?.user_metadata?.last_name as string)?.[0] || '';
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || <UserCircle2 size={32} />;
  }, [user, originalProfile, form]);

  const currentFormValues = form.watch();
  const displayName = currentFormValues.firstName || currentFormValues.lastName
    ? `${currentFormValues.firstName || ''} ${currentFormValues.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User Profile';

  const handleCancel = () => {
    clientLogger.info('[ProfileView] handleCancel called.');
    if (originalProfile) {
        const resetBannerUrl = originalProfile.bannerUrl ? `${originalProfile.bannerUrl.split('?')[0]}?t=${new Date().getTime()}` : null;
        clientLogger.info('Canceling: Resetting form with original profile and timestamped bannerUrl.', { resetBannerUrl });
        form.reset({
            ...originalProfile,
            avatarUrl: originalProfile.avatarUrl ? `${originalProfile.avatarUrl.split('?')[0]}?t=${new Date().getTime()}` : null,
            bannerUrl: resetBannerUrl,
            avatarDataUri: undefined, 
            bannerDataUri: undefined,
        });
        updateBioDisplayValue(originalProfile.bio || "");
    } else if (user) {
        clientLogger.info('Canceling: No originalProfile, resetting form with user data or defaults.');
        const initialResetValues: ProfileFormValues = {
            id: user.id, email: user.email || '',
            firstName: (user.user_metadata?.first_name as string) || "",
            lastName: (user.user_metadata?.last_name as string) || "",
            avatarUrl: (user.user_metadata?.avatar_url as string) || null,
            bannerUrl: null, bio: "", language: "en", ageCategory: null, specificAge: null,
            role: 'user', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            stripeCustomerId: null, subscriptionStatus: null, subscriptionTier: null,
            subscriptionPeriod: null, subscriptionStartDate: null, subscriptionEndDate: null,
            avatarDataUri: undefined, bannerDataUri: undefined,
        };
        form.reset(initialResetValues);
        updateBioDisplayValue("");
    }
    toast({ title: "Changes Canceled", description: "Your changes have been discarded."});
  };

  const idPrefix = useId();

  if (isSessionLoading || isLoadingAuth && !originalProfile && !profileError) { // Show skeleton if session or initial profile is loading
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden animate-pulse">
        <Skeleton className="h-32 sm:h-40 md:h-48 w-full rounded-t-lg" />
        <div className="relative px-6 pb-6 flex flex-col items-center text-center">
          <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-background shadow-lg -mt-10 sm:-mt-12" />
          <Skeleton className="h-7 w-40 mt-4 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
        <CardContent className="px-6 pb-6 pt-0 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full rounded-md" /></div>
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full rounded-md" /></div>
          </div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full rounded-md" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-24 w-full rounded-md" /></div>
          <div className="flex justify-end gap-2 pt-4 border-t mt-6">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessionError) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Session Error</AlertTitle><AlertDescription>{sessionError.message || 'An error occurred while loading your session. Please try refreshing.'}</AlertDescription>
      </Alert>
    );
  }

  if (!user && !isSessionLoading) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Not Authenticated</AlertTitle><AlertDescription>Please log in to view and edit your profile. You may need to refresh the page.</AlertDescription>
      </Alert>
    );
  }
  
  // This condition now means user exists, session is not loading, but profileError occurred AND originalProfile is still null/undefined
  if (profileError && user && !originalProfile) {
     Sentry.captureMessage('ProfileView: Profile data error on initial load, but user session exists.', {
      level: 'error', extra: { userId: user.id, errorMessage: profileError.message },
    });
    // Toast is shown from useEffect that resets form if profileError is present.
    // We can still render the form allowing the user to *create* their profile if it's missing or errored.
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden">
           <ProfileBannerUploader
            key={form.watch('bannerUrl') || 'no-banner-key'} 
            control={form.control}
            name="bannerDataUri"
            defaultImage={form.watch('bannerUrl')}
            disabled={isPending}
          />

          <div className="relative px-6 pb-6 flex flex-col items-center text-center">
            <ProfileAvatarUploader
              key={form.watch('avatarUrl') || 'no-avatar-key'} 
              control={form.control}
              name="avatarDataUri" 
              defaultImage={form.watch('avatarUrl')}
              displayName={displayName}
              getInitialsFn={getInitials}
              disabled={isPending}
            />
            <CardTitle className="text-2xl font-semibold mt-3">{displayName}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {currentFormValues.role ? currentFormValues.role.charAt(0).toUpperCase() + currentFormValues.role.slice(1) : (originalProfile?.role ? originalProfile.role.charAt(0).toUpperCase() + originalProfile.role.slice(1) : 'User')}
            </CardDescription>
          </div>

          <CardContent className="px-6 pb-6 pt-0 space-y-6">
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-2">
                        <FormLabel htmlFor={`${idPrefix}-first-name`}>First name</FormLabel>
                        <FormControl>
                          <Input id={`${idPrefix}-first-name`} placeholder="Your first name" {...field} value={field.value || ""} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-2">
                        <FormLabel htmlFor={`${idPrefix}-last-name`}>Last name</FormLabel>
                        <FormControl>
                          <Input id={`${idPrefix}-last-name`} placeholder="Your last name" {...field} value={field.value || ""} disabled={isPending}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel htmlFor={`${idPrefix}-email`}>Email</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                              id={`${idPrefix}-email`}
                              type="email"
                              placeholder="your.email@example.com"
                              {...field}
                              value={field.value || user?.email || ""}
                              readOnly
                              disabled
                              className="pl-10 cursor-not-allowed bg-muted/50"
                          />
                        </FormControl>
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <FormDescription>Your email address cannot be changed here.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field: formFieldControlBio }) => ( // Renamed field to avoid conflict
                    <FormItem className="space-y-2">
                      <FormLabel htmlFor={`${idPrefix}-bio`}>Biography</FormLabel>
                      <FormControl>
                        <Textarea
                          id={`${idPrefix}-bio`}
                          placeholder="Write a few sentences about yourself"
                          value={bioDisplayValue} // Display value from character limit hook
                          onChange={(e) => {
                              handleBioChangeInternal(e); // Update character limit hook's state
                              formFieldControlBio.onChange(e.target.value); // Also update RHF state
                          }}
                          maxLength={bioMaxLength}
                          className="min-h-[80px] resize-none"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormDescription className={cn("text-right text-xs tabular-nums", bioCharacterCount === bioMaxLength ? "text-destructive" : "text-muted-foreground")}>
                        {bioMaxLength - bioCharacterCount} characters left
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-6 !mt-6 !mb-4"/>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Preferred Language</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isPending}>
                          <FormControl>
                            <SelectTrigger id={`${idPrefix}-language`}>
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languageOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                  )} />
                  <FormField
                    control={form.control}
                    name="ageCategory"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Age Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isPending}>
                            <FormControl>
                                <SelectTrigger id={`${idPrefix}-ageCategory`}>
                                    <SelectValue placeholder="Select age category" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {ageCategoryOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                  )} />
                </div>
                 <FormField control={form.control} name="specificAge" render={({ field }) => (
                    <FormItem  className="space-y-2">
                        <FormLabel htmlFor={`${idPrefix}-specificAge`}>Specific Age (Optional)</FormLabel>
                        <FormControl>
                            <Input 
                                id={`${idPrefix}-specificAge`} 
                                type="number" 
                                {...field} 
                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} 
                                value={field.value ?? ""} 
                                placeholder="Your age" 
                                disabled={isPending}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <ProfileSubscriptionDetails currentFormValues={currentFormValues} />
                <ProfileAccountInfo currentFormValues={currentFormValues} user={user} />
            </div>
          </CardContent>

          <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending || (!form.formState.isDirty && !form.getValues('avatarDataUri') && !form.getValues('bannerDataUri'))}>
              <Ban className="mr-2 h-4 w-4"/> Cancel
            </Button>
            <Button type="submit" disabled={isPending || (!form.formState.isDirty && !form.getValues('avatarDataUri') && !form.getValues('bannerDataUri'))}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </Card>
      </form>
    </FormProvider>
  );
}
