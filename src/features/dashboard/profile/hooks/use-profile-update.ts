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
    type ProfileActionError
} from '@/features/user-auth-data/actions';
import { getProfileActionErrorMessage } from '@/features/user-auth-data/utils/error-messages.utils';
import { useToast as useShadcnToast } from '@/hooks/use-toast'; // Renamed to avoid conflict with local toast
import { UseCharacterLimitReturn } from '@/hooks';
import { type ImageProcessingError, getImageValidationErrorMessage } from '@/features/user-auth-data/utils/image-validation.utils';
import * as Sentry from '@sentry/nextjs';
import { useState, useCallback } from 'react';

const clientLogger = {
    info: (message: string, context?: any) => console.log(`[ProfileUpdateHookINFO] ${message}`, context),
    warn: (message: string, context?: any) => console.warn(`[ProfileUpdateHookWARN] ${message}`, context),
    error: (message: string, context?: any) => console.error(`[ProfileUpdateHookERROR] ${message}`, context),
};

// Simplified language options with 4 core languages
export const languageOptions = [
    { value: 'pt', label: 'Português', flag: '🇵🇹' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
];

// Simplified age category options with 5 core categories
export const ageCategoryOptions = [
    { value: 'baby', label: 'Baby (0-23)', description: 'Ages 0 to 23 months' },
    { value: 'child', label: 'Child (2-12)', description: 'Ages 2 to 12 years' },
    { value: 'teen', label: 'Teen (13-17)', description: 'Ages 13 to 17 years' },
    { value: 'adult', label: 'Adult (18-64)', description: 'Ages 18 to 64 years' },
    { value: 'senior', label: 'Senior (65+)', description: 'Ages 65 and above' },
];

// Simplified gender options with 2 traditional options (no icons)
export const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
];

export type ProfileFormValues = UserProfile & {
    avatarDataUri?: string | null;
    bannerDataUri?: string | null;
};

export const ProfileFormSchema = UserProfileSchema.extend({
    avatarDataUri: z.string().optional().nullable(),
    bannerDataUri: z.string().optional().nullable(),
});

// Enhanced error tracking types
export interface ProfileUpdateError {
    type: 'text' | 'avatar' | 'banner' | 'validation' | 'network' | 'unknown';
    message: string;
    details?: ProfileActionError | ImageProcessingError;
    field?: string;
}

// Progress tracking types
export interface ProfileUpdateProgress {
    step: 'validating' | 'updating-text' | 'updating-avatar' | 'updating-banner' | 'finalizing' | 'complete';
    message: string;
    progress: number; // 0-100
}

interface UseProfileUpdateOptions {
    user: User | null | undefined;
    profile: UserProfile | null | undefined; // Original profile data for comparison or context
    queryClient: QueryClient;
    toast: ReturnType<typeof useShadcnToast>['toast'];
    onProgress?: (progress: ProfileUpdateProgress) => void; // Progress callback
    onError?: (error: ProfileUpdateError) => void; // Enhanced error callback
    // Removed form and updateBioDisplayValue from direct hook options
    // They will be handled by the calling component in its onSuccess callback
}

export function useProfileUpdate({
    user,
    profile: originalProfile, // Renamed for clarity within the hook
    queryClient,
    toast,
    onProgress,
    onError,
}: UseProfileUpdateOptions) {
    // Enhanced state tracking
    const [imageErrors, setImageErrors] = useState<Record<string, ProfileUpdateError>>({});
    const [currentProgress, setCurrentProgress] = useState<ProfileUpdateProgress | null>(null);

    // Helper function to report progress
    const reportProgress = useCallback((progress: ProfileUpdateProgress) => {
        setCurrentProgress(progress);
        onProgress?.(progress);
        clientLogger.info(`Progress: ${progress.step} - ${progress.message} (${progress.progress}%)`);
    }, [onProgress]);

    // Helper function to handle errors
    const handleError = useCallback((error: ProfileUpdateError) => {
        setImageErrors(prev => ({
            ...prev,
            [error.type]: error
        }));
        onError?.(error);

        // Defensive error logging to avoid empty object issues
        const errorInfo = {
            type: error.type,
            message: error.message || 'Unknown error',
            details: error.details || 'No details available',
            field: error.field || 'No field specified'
        };
        clientLogger.error(`[ProfileUpdateHookERROR] Error in ${error.type}:`, errorInfo);
    }, [onError]);

    // Clear errors when starting new update
    const clearErrors = useCallback(() => {
        setImageErrors({});
        setCurrentProgress(null);
    }, []);

    const { mutate, isPending, error, ...rest } = useMutation<
        UserProfile | undefined,
        Error,
        ProfileFormValues
    >({
        mutationFn: async (formData: ProfileFormValues) => {
            // Clear previous errors and start progress tracking
            clearErrors();

            reportProgress({
                step: 'validating',
                message: 'Validating profile data...',
                progress: 0
            });

            clientLogger.info('mutationFn started. FormData (URIs snipped):', {
                ...formData,
                avatarDataUri: formData.avatarDataUri ? formData.avatarDataUri.substring(0, 50) + '...' : formData.avatarDataUri,
                bannerDataUri: formData.bannerDataUri ? formData.bannerDataUri.substring(0, 50) + '...' : formData.bannerDataUri,
            });

            let latestProfileData: UserProfile | undefined = originalProfile || undefined;
            const errors: ProfileUpdateError[] = [];
            let totalSteps = 0;
            let completedSteps = 0;

            const { avatarDataUri, bannerDataUri, ...textDataFromForm } = formData;

            // Calculate total steps for progress tracking
            const hasTextChanges = Object.keys(textDataFromForm).some(key => {
                if (['id', 'email', 'avatarUrl', 'bannerUrl', 'createdAt', 'updatedAt', 'role',
                    'stripeCustomerId', 'subscriptionStatus', 'subscriptionTier', 'subscriptionPeriod',
                    'subscriptionStartDate', 'subscriptionEndDate'].includes(key)) return false;

                const formValue = (formData as any)[key];
                const originalValue = (originalProfile as any)?.[key];
                const formValueForCompare = formValue === "" ? null : formValue;
                const originalValueForCompare = originalValue === "" ? null : originalValue;
                return formValueForCompare !== originalValueForCompare;
            });

            if (hasTextChanges) totalSteps++;
            if (formData.avatarDataUri !== undefined) totalSteps++;
            if (formData.bannerDataUri !== undefined) totalSteps++;

            if (totalSteps === 0) totalSteps = 1; // At least one step for validation

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
                reportProgress({
                    step: 'updating-text',
                    message: 'Updating profile information...',
                    progress: Math.round((completedSteps / totalSteps) * 100)
                });

                clientLogger.info('Text fields changed. Calling updateProfileTextDetails with payload:', textDetailsPayload);

                try {
                    const textResult = await updateProfileTextDetails(textDetailsPayload as any);
                    clientLogger.info('updateProfileTextDetails result:', textResult);

                    if (textResult.error) {
                        const error: ProfileUpdateError = {
                            type: 'text',
                            message: textResult.error,
                            details: textResult.errorDetails,
                        };
                        errors.push(error);
                        handleError(error);
                    }

                    if (textResult.data) {
                        latestProfileData = textResult.data;
                    }
                } catch (err) {
                    const error: ProfileUpdateError = {
                        type: 'text',
                        message: 'Failed to update profile information',
                        details: err instanceof Error ? { code: 'UNKNOWN_ERROR', message: err.message } as ProfileActionError : undefined
                    };
                    errors.push(error);
                    handleError(error);
                }

                completedSteps++;
            } else {
                clientLogger.info('No text fields changed.');
            }

            // Check if avatarDataUri is explicitly provided (not undefined)
            // A value of `null` means remove, `string` means update, `undefined` means no change intended by user action
            if (formData.avatarDataUri !== undefined) {
                reportProgress({
                    step: 'updating-avatar',
                    message: 'Updating profile picture...',
                    progress: Math.round((completedSteps / totalSteps) * 100)
                });

                clientLogger.info('Avatar data URI provided or explicitly null. Calling updateProfileAvatar.');

                try {
                    const avatarResult = await updateProfileAvatar(formData.avatarDataUri);
                    clientLogger.info('updateProfileAvatar result:', avatarResult);

                    if (avatarResult.error) {
                        const error: ProfileUpdateError = {
                            type: 'avatar',
                            message: avatarResult.error,
                            details: avatarResult.errorDetails,
                        };
                        errors.push(error);
                        handleError(error);
                    }

                    if (avatarResult.updatedProfile) {
                        latestProfileData = avatarResult.updatedProfile;
                    }
                } catch (err) {
                    const error: ProfileUpdateError = {
                        type: 'avatar',
                        message: 'Failed to update profile picture',
                        details: err instanceof Error ? { code: 'UNKNOWN_ERROR', message: err.message } as ProfileActionError : undefined
                    };
                    errors.push(error);
                    handleError(error);
                }

                completedSteps++;
            } else {
                clientLogger.info('Avatar data URI is undefined. Skipping avatar update action.');
            }

            if (formData.bannerDataUri !== undefined) {
                reportProgress({
                    step: 'updating-banner',
                    message: 'Updating banner image...',
                    progress: Math.round((completedSteps / totalSteps) * 100)
                });

                clientLogger.info('Banner data URI provided or explicitly null. Calling updateProfileBanner.');

                try {
                    const bannerResult = await updateProfileBanner(formData.bannerDataUri);
                    clientLogger.info('updateProfileBanner result:', {
                        hasError: !!bannerResult.error,
                        errorMessage: bannerResult.error,
                        hasErrorDetails: !!bannerResult.errorDetails,
                        errorDetails: bannerResult.errorDetails,
                        hasUpdatedProfile: !!bannerResult.updatedProfile,
                        resultKeys: Object.keys(bannerResult)
                    });

                    if (bannerResult.error) {
                        const error: ProfileUpdateError = {
                            type: 'banner',
                            message: bannerResult.error || 'Unknown banner error',
                            details: bannerResult.errorDetails,
                        };
                        errors.push(error);
                        handleError(error);
                    }

                    if (bannerResult.updatedProfile) {
                        latestProfileData = bannerResult.updatedProfile;
                    }
                } catch (err) {
                    const error: ProfileUpdateError = {
                        type: 'banner',
                        message: 'Failed to update banner image',
                        details: err instanceof Error ? { code: 'UNKNOWN_ERROR', message: err.message } as ProfileActionError : undefined
                    };
                    errors.push(error);
                    handleError(error);
                }

                completedSteps++;
            } else {
                clientLogger.info('Banner data URI is undefined. Skipping banner update action.');
            }

            // Finalize progress
            reportProgress({
                step: 'finalizing',
                message: 'Finalizing changes...',
                progress: 95
            });

            if (errors.length > 0) {
                clientLogger.error('Errors during mutation:', errors);

                // Create a comprehensive error message
                const errorMessages = errors.map(err => {
                    if (err.details && 'code' in err.details) {
                        return getProfileActionErrorMessage(err.details as ProfileActionError);
                    } else if (err.details && 'code' in err.details) {
                        return getImageValidationErrorMessage(err.details as ImageProcessingError);
                    }
                    return err.message;
                });

                const errorMessage = `Profile update failed: ${errorMessages.join('; ')}`;
                throw new Error(errorMessage);
            }

            // If no specific updates were made (no text changes, no image changes signaled)
            // and no errors, it's possible latestProfileData is still the originalProfile or undefined.
            if (!textFieldsChanged && formData.avatarDataUri === undefined && formData.bannerDataUri === undefined && errors.length === 0) {
                reportProgress({
                    step: 'complete',
                    message: 'No changes to save',
                    progress: 100
                });

                clientLogger.info('mutationFn finished. No changes were made. Returning original profile data if available.');
                return originalProfile || undefined;
            }

            reportProgress({
                step: 'complete',
                message: 'Profile updated successfully',
                progress: 100
            });

            clientLogger.info('mutationFn finished. Returning latestProfileData:', latestProfileData);
            return latestProfileData;
        },
        onSuccess: (data: UserProfile | undefined) => {
            clientLogger.info('useProfileUpdate - Global onSuccess triggered. Data:', data);
            if (user?.id) {
                queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] }); // Corrected line
                clientLogger.info(`Invalidated userProfile query for user: ${user.id}`);
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
        imageErrors, // Expose image-specific errors
        currentProgress, // Expose current progress
        clearErrors, // Expose error clearing function
        ...rest, // Includes isError, status, etc.
    };
}
