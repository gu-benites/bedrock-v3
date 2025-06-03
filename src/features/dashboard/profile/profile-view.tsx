// src/features/dashboard/profile/profile-view.tsx
'use client';

import React, { useEffect, useId, useState, useCallback } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form'; // Added Controller
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/features/auth/hooks';
import type { UserProfile } from '@/features/user-auth-data/schemas';
import { useQueryClient } from '@tanstack/react-query';

import { useProfileUpdate, ProfileFormSchema, ProfileFormValues, languageOptions, ageCategoryOptions } from './hooks/use-profile-update';
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
import {
  Avatar as ShadcnAvatar,
  AvatarFallback, AvatarImage
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { UserCircle2, Mail, Save, Loader2, Ban } from 'lucide-react';
import { useCharacterLimit } from '@/hooks';
import { ProfileBannerUploader, ProfileAvatarUploader } from './components';

import * as Sentry from '@sentry/nextjs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const MAX_BIO_LENGTH = 180;
import { ProfileAccountInfo, ProfileSubscriptionDetails } from './components';

// Form type including client-side data URIs
type ProfileFormValues = UserProfile & {
  avatarDataUri?: string | null;
  bannerDataUri?: string | null;
};

// Extend UserProfileSchema for form validation, making client-side URI fields optional
const ProfileFormSchema = UserProfileSchema.extend({
    avatarDataUri: z.string().optional().nullable(),
    bannerDataUri: z.string().optional().nullable(),
});

export function ProfileView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    user,
    profile, // This is the original profile data from useAuth
    isLoadingAuth,
    isSessionLoading,
    sessionError,
    profileError,
  } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: profile || {},
  });

  const bioFormValue = form.watch('bio');
  const {
    value: bioDisplayValue,
    characterCount: bioCharacterCount,
    handleChange: handleBioChangeInternal,
    updateValue: updateBioDisplayValue,
    maxLength: bioMaxLength,
  } = useCharacterLimit({
    maxLength: MAX_BIO_LENGTH,
    initialValue: profile?.bio || "",
  });

  const { mutate, isPending, isError, error } = useProfileUpdate({
    user,
    profile,
    form,
    queryClient,
    toast,
    updateBioDisplayValue,
    onError: (error: Error) => { // Pass custom onError to hook
      toast({ title: "Update Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
      Sentry.captureException(error, {
        tags: { context: 'profileUpdateMutation' },
        extra: { userId: user?.id },
      });
    },
    onSettled: () => {
      // You could add local component logic here if needed after mutation settles
    }
  });
  useEffect(() => {
    if (profile) {
      const newAvatarUrl = profile.avatarUrl ? `${profile.avatarUrl.split('?')[0]}?t=${new Date().getTime()}` : null;
      const newBannerUrl = profile.bannerUrl ? `${profile.bannerUrl.split('?')[0]}?t=${new Date().getTime()}` : null;
      clientLogger.info('Profile data available. Resetting form.', {
        profileId: profile.id,
        newAvatarUrl,
        newBannerUrl,
        originalBannerUrl: profile.bannerUrl
      });
      form.reset({
        ...profile,
        avatarUrl: newAvatarUrl,
        bannerUrl: newBannerUrl,
        avatarDataUri: undefined, 
        bannerDataUri: undefined,
      });
      updateBioDisplayValue(profile.bio || "");
    } else if (user && !isLoadingAuth && !profileError) {
        const initialFormValues = {
            id: user.id, email: user.email,
            firstName: (user.user_metadata?.first_name as string) || "",
            lastName: (user.user_metadata?.last_name as string) || "",
            avatarUrl: (user.user_metadata?.avatar_url as string) || null,
            bannerUrl: null, bio: "", language: "en", ageCategory: null, specificAge: null,
            role: 'user', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            avatarDataUri: undefined,
            bannerDataUri: undefined,
        };
        form.reset(initialFormValues as ProfileFormValues);
        updateBioDisplayValue("");
    }
  }, [profile, user, form, updateBioDisplayValue, isLoadingAuth, profileError]);

  useEffect(() => {
    if (bioDisplayValue !== bioFormValue) {
      form.setValue('bio', bioDisplayValue, { shouldDirty: true, shouldValidate: true });
    }
  }, [bioDisplayValue, bioFormValue, form]);


  const getInitials = useCallback(() => {
    if (!user && !profile && !form.getValues('firstName')) return <UserCircle2 size={32} />;
    const formValues = form.getValues();
    const first = formValues.firstName || profile?.firstName || (user?.user_metadata?.first_name as string)?.[0] || '';
    const last = formValues.lastName || profile?.lastName || (user?.user_metadata?.last_name as string)?.[0] || '';
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || <UserCircle2 size={32} />;
  }, [user, profile, form]);


  const currentFormValues = form.watch();
  const displayName = currentFormValues.firstName || currentFormValues.lastName
    ? `${currentFormValues.firstName || ''} ${currentFormValues.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User Profile';


  const onSubmit = (data: ProfileFormValues) => {
    mutation.mutate(data);
  };

  const handleCancel = () => {
    clientLogger.info('handleCancel called.');
    if (profile) {
      const resetBannerUrl = profile.bannerUrl ? `${profile.bannerUrl.split('?')[0]}?t=${new Date().getTime()}` : null;
      clientLogger.info('Canceling: Resetting form with original profile and timestamped bannerUrl.', { resetBannerUrl });
      form.reset({
        ...profile,
        avatarUrl: profile.avatarUrl ? `${profile.avatarUrl.split('?')[0]}?t=${new Date().getTime()}` : null,
        bannerUrl: resetBannerUrl,
        avatarDataUri: undefined, 
        bannerDataUri: undefined,
      });
      updateBioDisplayValue(profile.bio || "");
    } else if (user) {
        clientLogger.info('Canceling: No profile, resetting form with user data.');
        const initialResetValues = {
            id: user.id, email: user.email,
            firstName: (user.user_metadata?.first_name as string) || "",
            lastName: (user.user_metadata?.last_name as string) || "",
            avatarUrl: (user.user_metadata?.avatar_url as string) || null,
            bannerUrl: null, bio: "", language: "en", ageCategory: null, specificAge: null,
            role: 'user', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            avatarDataUri: undefined,
            bannerDataUri: undefined,
        };
        form.reset(initialResetValues as ProfileFormValues);
        updateBioDisplayValue("");
    }
    toast({ title: "Changes Canceled", description: "Your changes have been discarded."});
  };

  const idPrefix = useId();

  if (isSessionLoading) {
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

  if (profileError && user && !profile && !isLoadingAuth) {
     Sentry.captureMessage('ProfileView: Profile data error on initial load, but user session exists.', {
      level: 'error', extra: { userId: user.id, errorMessage: profileError.message },
    });
    toast({
        title: "Profile Data Issue",
        description: `Could not load your existing profile details (${profileError.message}). You can try creating or updating your profile by saving changes.`,
        variant: "destructive",
        duration: 7000
    });
  }


  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden">
          <ProfileBannerUploader
            key={form.watch('bannerUrl') || 'no-banner-key'} // Key to force re-mount
            control={form.control}
            name="bannerDataUri" 
            defaultImage={form.watch('bannerUrl')}
            disabled={mutation.isPending}
          />

          <div className="relative px-6 pb-6 flex flex-col items-center text-center">
            <ProfileAvatarUploader
              key={form.watch('avatarUrl') || 'no-avatar-key'} // Key to force re-mount
              control={form.control}
              name="avatarDataUri" 
              defaultImage={form.watch('avatarUrl')}
              displayName={displayName}
              getInitialsFn={getInitials}
              disabled={mutation.isPending}
            />
            <CardTitle className="text-2xl font-semibold mt-3">{displayName}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {currentFormValues.role ? currentFormValues.role.charAt(0).toUpperCase() + currentFormValues.role.slice(1) : (profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'User')}
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
                          <Input id={`${idPrefix}-first-name`} placeholder="Your first name" {...field} value={field.value || ""} disabled={mutation.isPending} />
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
                          <Input id={`${idPrefix}-last-name`} placeholder="Your last name" {...field} value={field.value || ""} disabled={mutation.isPending}/>
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
                  render={({ field: formFieldControl }) => (
                    <FormItem className="space-y-2">
                      <FormLabel htmlFor={`${idPrefix}-bio`}>Biography</FormLabel>
                      <FormControl>
                        <Textarea
                          id={`${idPrefix}-bio`}
                          placeholder="Write a few sentences about yourself"
                          value={bioDisplayValue}
                          onChange={(e) => {
                              handleBioChangeInternal(e);
                              formFieldControl.onChange(e.target.value);
                          }}
                          maxLength={bioMaxLength}
                          className="min-h-[80px] resize-none"
                          disabled={mutation.isPending}
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
                        <FormLabel>Preferred Language</FormLabel>{/* @ts-ignore */}
                        <Select onValueChange={field.onChange} defaultValue={field.value || undefined} value={field.value || undefined} disabled={mutation.isPending}>
                          <FormControl>
                            <SelectTrigger>
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
                        <FormLabel>Age Category</FormLabel>{/* @ts-ignore */}<Select onValueChange={field.onChange} defaultValue={field.value || undefined} value={field.value || undefined} disabled={mutation.isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select age category" /></SelectTrigger></FormControl><SelectContent>{ageCategoryOptions.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
                 <FormField control={form.control} name="specificAge" render={({ field }) => (
                    <FormItem  className="space-y-2"><FormLabel>Specific Age (Optional)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} value={field.value ?? ""} placeholder="Your age" disabled={mutation.isPending}/></FormControl><FormMessage /></FormItem>
                )} />

              <ProfileSubscriptionDetails currentFormValues={currentFormValues} />
              <ProfileAccountInfo currentFormValues={currentFormValues} user={user} />
            </div>
          </CardContent>

          <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={mutation.isPending || !form.formState.isDirty}>
              <Ban className="mr-2 h-4 w-4"/> Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !form.formState.isDirty}>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </Card>
      </form>
    </FormProvider>
  );
}
