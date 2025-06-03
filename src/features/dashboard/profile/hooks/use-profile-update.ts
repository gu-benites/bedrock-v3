// src/features/dashboard/profile/hooks/use-profile-update.ts
'use client';

import { useFormReturn } from 'react-hook-form';
import { useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { User } from '@supabase/supabase-js'; 
import { UserProfileSchema, type UserProfile } from '@/features/user-auth-data/schemas';
import {
    updateProfileTextDetails,
    updateProfileAvatar,
    updateProfileBanner,
} from '@/features/user-auth-data/actions';
import { useToast as useShadcnToast } from '@/hooks/use-toast'; // Renamed to avoid conflict with local toast
import { UseCharacterLimitReturn } from '@/hooks'; 
import * as Sentry from '@sentry/nextjs';

const clientLogger = {
    info: (message: string, context?: any) => console.log(`[ProfileUpdateHookINFO] ${message}`, context),
    warn: (message: string, context?: any) => console.warn(`[ProfileUpdateHookWARN] ${message}`, context),
    error: (message: string, context?: any) => console.error(`[ProfileUpdateHookERROR] ${message}`, context),
};

export const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
];

export const ageCategoryOptions = [
    { value: 'child', label: 'Child' },
    { value: 'teen', label: 'Teen' },
    { value: 'adult', label: 'Adult' },
    { value: 'senior', label: 'Senior' },
];

export type ProfileFormValues = UserProfile & {
    avatarDataUri?: string | null;
    bannerDataUri?: string | null;
};

export const ProfileFormSchema = UserProfileSchema.extend({
    avatarDataUri: z.string().optional().nullable(),
    bannerDataUri: z.string().optional().nullable(),
});


interface UseProfileUpdateOptions {
    user: User | null | undefined;
    profile: UserProfile | null | undefined; // Original profile data for comparison or context
    queryClient: QueryClient;
    toast: ReturnType<typeof useShadcnToast>['toast'];
    // Removed form and updateBioDisplayValue from direct hook options
    // They will be handled by the calling component in its onSuccess callback
}

export function useProfileUpdate({
    user,
    profile: originalProfile, // Renamed for clarity within the hook
    queryClient,
    toast,
}: UseProfileUpdateOptions) {

    const { mutate, isPending, error, ...rest } = useMutation<
        UserProfile | undefined, 
        Error,                   
        ProfileFormValues        
    >({
        mutationFn: async (formData: ProfileFormValues) => {
            clientLogger.info('mutationFn started. FormData (URIs snipped):', {
                ...formData,
                avatarDataUri: formData.avatarDataUri ? formData.avatarDataUri.substring(0, 50) + '...' : formData.avatarDataUri,
                bannerDataUri: formData.bannerDataUri ? formData.bannerDataUri.substring(0, 50) + '...' : formData.bannerDataUri,
            });

            let latestProfileData: UserProfile | undefined = originalProfile || undefined;
            const errors: string[] = [];

            const { avatarDataUri, bannerDataUri, ...textDataFromForm } = formData;

            const textDetailsPayload: Partial<UserProfile> = {};
            const originalProfileForComparison = originalProfile || {};
            let textFieldsChanged = false;

            (Object.keys(UserProfileSchema.shape) as Array<keyof UserProfile>).forEach(key => {
                if (!['id', 'email', 'avatarUrl', 'bannerUrl', 'createdAt', 'updatedAt', 'role',
                    'stripeCustomerId', 'subscriptionStatus', 'subscriptionTier', 'subscriptionPeriod',
                    'subscriptionStartDate', 'subscriptionEndDate'].includes(key)) {
                    
                    const formValue = (formData as any)[key];
                    const originalValue = (originalProfileForComparison as any)[key];

                    // Handle null vs empty string for optional fields, and basic comparison
                    const formValueForCompare = formValue === "" ? null : formValue;
                    const originalValueForCompare = originalValue === "" ? null : originalValue;
                    
                    if (formValueForCompare !== originalValueForCompare) {
                        (textDetailsPayload as any)[key] = formValue; // Send what's in the form
                        textFieldsChanged = true;
                    }
                }
            });

            if (textFieldsChanged) {
                clientLogger.info('Text fields changed. Calling updateProfileTextDetails with payload:', textDetailsPayload);
                const textResult = await updateProfileTextDetails(textDetailsPayload as any); // Cast as any to satisfy Pick
                clientLogger.info('updateProfileTextDetails result:', textResult);
                if (textResult.error) errors.push(`Text update error: ${textResult.error}`);
                if (textResult.data) latestProfileData = textResult.data;
            } else {
                clientLogger.info('No text fields changed.');
            }

            // Check if avatarDataUri is explicitly provided (not undefined)
            // A value of `null` means remove, `string` means update, `undefined` means no change intended by user action
            if (formData.avatarDataUri !== undefined) {
                clientLogger.info('Avatar data URI provided or explicitly null. Calling updateProfileAvatar.');
                const avatarResult = await updateProfileAvatar(formData.avatarDataUri);
                clientLogger.info('updateProfileAvatar result:', avatarResult);
                if (avatarResult.error) errors.push(`Avatar update error: ${avatarResult.error}`);
                if (avatarResult.updatedProfile) latestProfileData = avatarResult.updatedProfile;
            } else {
                clientLogger.info('Avatar data URI is undefined. Skipping avatar update action.');
            }

            if (formData.bannerDataUri !== undefined) {
                clientLogger.info('Banner data URI provided or explicitly null. Calling updateProfileBanner.');
                const bannerResult = await updateProfileBanner(formData.bannerDataUri);
                clientLogger.info('updateProfileBanner result:', bannerResult);
                if (bannerResult.error) errors.push(`Banner update error: ${bannerResult.error}`);
                if (bannerResult.updatedProfile) latestProfileData = bannerResult.updatedProfile;
            } else {
                clientLogger.info('Banner data URI is undefined. Skipping banner update action.');
            }

            if (errors.length > 0) {
                clientLogger.error('Errors during mutation:', errors);
                const errorMessage = `Profile update failed: ${errors.join('; ')}`;
                throw new Error(errorMessage); 
            }

            // If no specific updates were made (no text changes, no image changes signaled)
            // and no errors, it's possible latestProfileData is still the originalProfile or undefined.
            // We should ensure we return something, preferably the most up-to-date profile if possible.
            if (!textFieldsChanged && formData.avatarDataUri === undefined && formData.bannerDataUri === undefined && errors.length === 0) {
                 clientLogger.info('mutationFn finished. No changes were made. Returning original profile data if available.');
                 // In this case, the onSuccess in ProfileView will reset the form to its original state,
                 // which is correct as no changes were pushed.
                 return originalProfile || undefined;
            }
            
            clientLogger.info('mutationFn finished. Returning latestProfileData:', latestProfileData);
            return latestProfileData;
        },
        onSuccess: (data: UserProfile | undefined) => {
            clientLogger.info('useProfileUpdate - Global onSuccess triggered. Data:', data);
            if (user?.id) {
                queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
                logger.info(`Invalidated userProfile query for user: ${user.id}`);
            }
            // Generic success toast (optional, as component might show a more specific one)
            // toast({ title: "Profile Update Processed", description: "Your changes have been processed." });
        },
        onError: (error: Error) => {
            clientLogger.error('useProfileUpdate - Global onError triggered. Error:', error);
            toast({ title: "Update Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
            Sentry.captureException(error, {
                tags: { context: 'profileUpdateMutationHook' },
                extra: { userId: user?.id },
            });
        },
    });

    return {
        performUpdate: mutate, // Expose the mutate function
        isPending,
        error,
        ...rest, // Includes isError, status, etc.
    };
}
