// src/features/dashboard/profile/hooks/use-profile-update.ts
'use client';

import { UseFormReturn } from 'react-hook-form';
import { useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { User } from '@supabase/supabase-js'; // Assuming Supabase User type
import { UserProfileSchema, type UserProfile } from '@/features/user-auth-data/schemas';
import {
    updateProfileTextDetails,
    updateProfileAvatar,
    updateProfileBanner,
} from '@/features/user-auth-data/actions';
import { useToast } from '@/hooks/use-toast';
import { UseCharacterLimitReturn } from '@/hooks'; // Assuming type exists
import * as Sentry from '@sentry/nextjs';

// Placeholder for a client-side logger
const clientLogger = {
    info: (message: string, context?: any) => console.log(`[ProfileUpdateHookINFO] ${message}`, context),
    warn: (message: string, context?: any) => console.warn(`[ProfileUpdateHookWARN] ${message}`, context),
    error: (message: string, context?: any) => console.error(`[ProfileUpdateHookERROR] ${message}`, context),
};

// Constants (can be moved later if needed elsewhere)
const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
];

const ageCategoryOptions = [
    { value: 'child', label: 'Child' },
    { value: 'teen', label: 'Teen' },
    { value: 'adult', label: 'Adult' },
    { value: 'senior', label: 'Senior' },
];

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


interface UseProfileUpdateOptions {
    user: User | null | undefined;
    profile: UserProfile | null | undefined;
    form: UseFormReturn<ProfileFormValues>;
    queryClient: QueryClient;
    toast: ReturnType<typeof useToast>['toast'];
    updateBioDisplayValue: UseCharacterLimitReturn['updateValue'];
}

export function useProfileUpdate({
    user,
    profile,
    form,
    queryClient,
    toast,
    updateBioDisplayValue,
}: UseProfileUpdateOptions) {

    const { mutate, isPending, isError, error } = useMutation<
        UserProfile | undefined, // Success data type from the last successful action
        Error,                   // Error type
        ProfileFormValues        // Variables type (data passed to mutate)
    >({
        mutationFn: async (formData: ProfileFormValues) => {
            clientLogger.info('mutationFn started. FormData (URIs snipped):', {
                ...formData,
                avatarDataUri: formData.avatarDataUri ? formData.avatarDataUri.substring(0, 50) + '...' : formData.avatarDataUri,
                bannerDataUri: formData.bannerDataUri ? formData.bannerDataUri.substring(0, 50) + '...' : formData.bannerDataUri,
            });

            let latestProfileData: UserProfile | undefined = profile || undefined;
            const errors: string[] = [];

            const { avatarDataUri, bannerDataUri, ...textDataFromForm } = formData;

            const textDetailsPayload: Partial<UserProfile> = {};
            const originalProfileForComparison = profile || {};
            let textFieldsChanged = false;

            (Object.keys(UserProfileSchema.shape) as Array<keyof UserProfile>).forEach(key => {
                if (!['id', 'email', 'avatarUrl', 'bannerUrl', 'createdAt', 'updatedAt', 'role',
                    'stripeCustomerId', 'subscriptionStatus', 'subscriptionTier', 'subscriptionPeriod',
                    'subscriptionStartDate', 'subscriptionEndDate'].includes(key)) {
                    if (formData[key] !== undefined && formData[key] !== (originalProfileForComparison as any)[key]) {
                        (textDetailsPayload as any)[key] = formData[key];
                        textFieldsChanged = true;
                    }
                }
            });

            if (textFieldsChanged) {
                clientLogger.info('Text fields changed. Calling updateProfileTextDetails with payload:', textDetailsPayload);
                const textResult = await updateProfileTextDetails(textDetailsPayload as any);
                clientLogger.info('updateProfileTextDetails result:', textResult);
                if (textResult.error) errors.push(`Text update error: ${textResult.error}`);
                if (textResult.data) latestProfileData = textResult.data;
            } else {
                clientLogger.info('No text fields changed.');
            }

            if (formData.avatarDataUri !== undefined) {
                clientLogger.info('Avatar data URI provided. Calling updateProfileAvatar.');
                const avatarResult = await updateProfileAvatar(formData.avatarDataUri);
                clientLogger.info('updateProfileAvatar result:', avatarResult);
                if (avatarResult.error) errors.push(`Avatar update error: ${avatarResult.error}`);
                if (avatarResult.updatedProfile) latestProfileData = avatarResult.updatedProfile;
            } else {
                clientLogger.info('Avatar data URI is undefined. Skipping avatar update.');
            }

            if (formData.bannerDataUri !== undefined) {
                clientLogger.info('Banner data URI provided. Calling updateProfileBanner.');
                const bannerResult = await updateProfileBanner(formData.bannerDataUri);
                clientLogger.info('updateProfileBanner result:', bannerResult);
                if (bannerResult.error) errors.push(`Banner update error: ${bannerResult.error}`);
                if (bannerResult.updatedProfile) latestProfileData = bannerResult.updatedProfile;
            } else {
                clientLogger.info('Banner data URI is undefined. Skipping banner update.');
            }

            if (errors.length > 0) {
                clientLogger.error('Errors during mutation:', errors);
                // Combine errors into a single message for the user toast
                const errorMessage = `Profile update failed: ${errors.join('; ')}`;
                throw new Error(errorMessage); // Throw to trigger onError
            }

            clientLogger.info('mutationFn finished. Returning latestProfileData:', latestProfileData);
            return latestProfileData;
        },
        onMutate: () => {
            clientLogger.info('onMutate triggered.');
        },
        onSuccess: (data: UserProfile | undefined) => {
            clientLogger.info('onSuccess triggered. Data from mutation:', data);
            if (data) {
                toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
                queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
                // Update form fields and bio with fresh data from the mutation response
                 const resetBannerUrl = data.bannerUrl ? `${data.bannerUrl.split('?')[0]}?t=${new Date().getTime()}` : null;
                form.reset({
                    ...data,
                    avatarUrl: data.avatarUrl ? `${data.avatarUrl.split('?')[0]}?t=${new Date().getTime()}` : null,
                    bannerUrl: resetBannerUrl,
                    avatarDataUri: undefined,
                    bannerDataUri: undefined,
                });
                updateBioDisplayValue(data.bio || "");

            } else if (!isError) {
                // This case happens if mutationFn returns undefined without throwing an error.
                // It implies no changes were deemed necessary or the process finished without new data.
                toast({ title: "Profile Processed", description: "No effective changes were made to your profile." });
                 queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
                 // It's still good practice to re-fetch or reset form to ensure consistency,
                 // especially if server might have made implicit changes or for cache coherence.
                 if (profile) { // Use the original profile data for reset if no new data was returned
                    const resetBannerUrl = profile.bannerUrl ? `${profile.bannerUrl.split('?')[0]}?t=${new Date().getTime()}` : null;
                    clientLogger.info('onSuccess (no data but no error): Resetting form with original profile and timestamped bannerUrl.', { resetBannerUrl });
                    form.reset({
                        ...profile,
                        avatarUrl: profile.avatarUrl ? `${profile.avatarUrl.split('?')[0]}?t=${new Date().getTime()}` : null,
                        bannerUrl: resetBannerUrl,
                        avatarDataUri: undefined,
                        bannerDataUri: undefined,
                    });
                    updateBioDisplayValue(profile.bio || "");
                } else {
                     // If no profile was available initially, reset to empty/default user data
                    clientLogger.info('onSuccess (no data, no error, no original profile): Resetting form with default user data.');
                     const initialResetValues = {
                        id: user?.id, email: user?.email,
                        firstName: (user?.user_metadata?.first_name as string) || "",
                        lastName: (user?.user_metadata?.last_name as string) || "",
                        avatarUrl: (user?.user_metadata?.avatar_url as string) || null,
                        bannerUrl: null, bio: "", language: "en", ageCategory: null, specificAge: null,
                        role: 'user', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                        avatarDataUri: undefined,
                        bannerDataUri: undefined,
                    };
                    form.reset(initialResetValues as ProfileFormValues);
                    updateBioDisplayValue("");
                }
            }
        },
        onError: (error: Error) => {
            clientLogger.error('onError triggered. Error:', error);
            toast({ title: "Update Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
            Sentry.captureException(error, {
                tags: { context: 'profileUpdateMutation' },
                extra: { userId: user?.id },
            });
            // Note: Form state remains dirty/with errors by default, allowing user to fix and resubmit.
            // No explicit form reset here.
        },
        onSettled: () => {
            clientLogger.info('onSettled triggered.');
            // Potentially re-enable form fields if they were disabled onMutate
        }
    });

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
            };
            form.reset(initialResetValues as ProfileFormValues);
            updateBioDisplayValue("");
        }
        toast({ title: "Changes Canceled", description: "Your changes have been discarded."});
    };

    return {
        mutate, isPending, isError, error, handleCancel
    };
}