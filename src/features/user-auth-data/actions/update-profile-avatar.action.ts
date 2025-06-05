// src/features/user-auth-data/actions/update-profile-avatar.action.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { UserProfileSchema, type UserProfile } from "../schemas/profile.schema";
import { getServerLogger } from '@/lib/logger'; // Re-added import
import { getStoragePathFromUrl, handleImageProcessing, type ImageProcessingError } from "../utils/profile-image.utils";
import { type ProfileActionError } from "./profile.actions";

const logger = getServerLogger('UpdateProfileAvatarAction'); // Re-added instantiation

interface UpdateProfileImageResult {
  updatedProfile?: UserProfile;
  error?: string;
  errorDetails?: ProfileActionError | ImageProcessingError;
}

export async function updateProfileAvatar(
  avatarDataUri: string | null | undefined
): Promise<UpdateProfileImageResult> {
  logger.info(`[UpdateProfileAvatarAction] Action started. AvatarDataUri (first 50 chars): ${avatarDataUri ? avatarDataUri.substring(0, 50) + '...' : avatarDataUri}`); // Uncommented logger call

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    const errorDetails: ProfileActionError = {
      code: 'AUTH_ERROR',
      message: 'Authentication failed. Please log in again.',
      details: { originalError: authError.message }
    };
    logger.error("[UpdateProfileAvatarAction] Authentication error.", errorDetails);
    return { error: errorDetails.message, errorDetails };
  }
  if (!user) {
    const errorDetails: ProfileActionError = {
      code: 'AUTH_ERROR',
      message: 'User not authenticated. Please log in.',
      details: { context: 'updateProfileAvatar' }
    };
    logger.warn("[UpdateProfileAvatarAction] No authenticated user found.", errorDetails);
    return { error: errorDetails.message, errorDetails };
  }
  logger.info(`[UpdateProfileAvatarAction] Authenticated user: ${user.id}`); // Uncommented logger call

  let currentAvatarPath: string | null = null;
  try {
    logger.info(`[UpdateProfileAvatarAction] Fetching current avatar_url for user ${user.id}`); // Uncommented logger call
    const { data: currentProfileData, error: fetchError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { 
      logger.error(`[UpdateProfileAvatarAction] Error fetching current avatar_url for user ${user.id}.`, { error: fetchError.message }); // Uncommented logger call
    }
    if (currentProfileData?.avatar_url) {
      currentAvatarPath = getStoragePathFromUrl(currentProfileData.avatar_url, 'profiles', logger);
      logger.info(`[UpdateProfileAvatarAction] Current avatar path for user ${user.id}: ${currentAvatarPath}`); // Uncommented logger call
    } else {
      logger.info(`[UpdateProfileAvatarAction] No current avatar_url found for user ${user.id}.`); // Uncommented logger call
    }
  } catch (e) {
    logger.error(`[UpdateProfileAvatarAction] Unexpected error fetching current avatar_url for user ${user.id}.`, { error: (e as Error).message }); // Uncommented logger call
  }
  
  logger.info(`[UpdateProfileAvatarAction] Calling handleImageProcessing for avatar. User: ${user.id}. currentAvatarPath: ${currentAvatarPath}`); // Uncommented logger call
  const avatarResult = await handleImageProcessing({
    supabase,
    userId: user.id,
    dataUri: avatarDataUri,
    currentImagePathInStorage: currentAvatarPath,
    imageType: 'avatar',
    baseFolderPath: 'avatars',
    loggerInstance: logger,
  });
  logger.info(`[UpdateProfileAvatarAction] handleImageProcessing for avatar result:`, avatarResult); // Uncommented logger call


  if (avatarResult.error) {
    return {
      error: avatarResult.error,
      errorDetails: avatarResult.errorDetails
    };
  }

  if (avatarResult.newImageUrl !== undefined) {
    const userDataToUpdate: { avatar_url: string | null; updated_at: string } = {
      avatar_url: avatarResult.newImageUrl,
      updated_at: new Date().toISOString(),
    };

    logger.info(`[UpdateProfileAvatarAction] Attempting to update avatar_url in DB for user ID: ${user.id}`, { newUrl: avatarResult.newImageUrl }); // Uncommented logger call
    const { data: updatedProfileData, error: updateError } = await supabase
      .from("profiles")
      .update(userDataToUpdate)
      .eq("id", user.id)
      .select() 
      .single();

    if (updateError) {
      const errorDetails: ProfileActionError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to update avatar image in database.',
        details: { originalError: updateError.message, userId: user.id }
      };
      logger.error(`[UpdateProfileAvatarAction] Failed to update avatar_url in DB for user ID: ${user.id}`, errorDetails);
      return { error: errorDetails.message, errorDetails };
    }
    if (!updatedProfileData) {
      const errorDetails: ProfileActionError = {
        code: 'DATABASE_ERROR',
        message: 'Avatar update completed but no data was returned.',
        details: { userId: user.id }
      };
      logger.error(`[UpdateProfileAvatarAction] Profile DB update for avatar for user ID: ${user.id} did not return data.`, errorDetails);
      return { error: errorDetails.message, errorDetails };
    }
    logger.info(`[UpdateProfileAvatarAction] DB update for avatar_url successful for user ID: ${user.id}. Updated data:`, updatedProfileData); // Uncommented logger call
    
    const mappedProfile: UserProfile = {
        id: updatedProfileData.id,
        email: user.email || '', 
        firstName: updatedProfileData.first_name,
        lastName: updatedProfileData.last_name,
        gender: updatedProfileData.gender,
        ageCategory: updatedProfileData.age_category,
        specificAge: updatedProfileData.specific_age,
        language: updatedProfileData.language,
        avatarUrl: updatedProfileData.avatar_url,
        bannerUrl: updatedProfileData.banner_img_url,
        bio: updatedProfileData.bio,
        role: updatedProfileData.role,
        stripeCustomerId: updatedProfileData.stripe_customer_id,
        subscriptionStatus: updatedProfileData.subscription_status,
        subscriptionTier: updatedProfileData.subscription_tier,
        subscriptionPeriod: updatedProfileData.subscription_period,
        subscriptionStartDate: updatedProfileData.subscription_start_date,
        subscriptionEndDate: updatedProfileData.subscription_end_date,
        createdAt: updatedProfileData.created_at,
        updatedAt: updatedProfileData.updated_at,
    };

    const validationResult = UserProfileSchema.safeParse(mappedProfile);
    if (!validationResult.success) {
      const errorDetails: ProfileActionError = {
        code: 'VALIDATION_ERROR',
        message: 'Updated avatar profile data failed validation.',
        details: { validationErrors: validationResult.error.flatten(), userId: user.id }
      };
      logger.error('[UpdateProfileAvatarAction] Updated profile data (avatar) failed validation.', errorDetails);
      return { error: errorDetails.message, errorDetails };
    }
    logger.info(`[UpdateProfileAvatarAction] Avatar updated and profile validated successfully for user ID: ${user.id}`); // Uncommented logger call
    return { updatedProfile: validationResult.data };

  } else {
    logger.info(`[UpdateProfileAvatarAction] No change to avatar_url needed for user ID: ${user.id}. Fetching current full profile.`); // Uncommented logger call
     const { data: currentFullProfile, error: fetchCurrentError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchCurrentError) {
        logger.error(`[UpdateProfileAvatarAction] Error fetching current profile after no avatar change for user ${user.id}`, { error: fetchCurrentError.message }); // Uncommented logger call
        return { error: "No avatar change, but failed to re-fetch profile." };
    }
     if (!currentFullProfile) {
        logger.error(`[UpdateProfileAvatarAction] Could not find profile for user ${user.id} after no avatar change.`); // Uncommented logger call
        return { error: "User profile not found after no avatar change." };
    }
     const mappedCurrentProfile: UserProfile = { 
        id: currentFullProfile.id, email: user.email || '', firstName: currentFullProfile.first_name,
        lastName: currentFullProfile.last_name, gender: currentFullProfile.gender,
        ageCategory: currentFullProfile.age_category, specificAge: currentFullProfile.specific_age,
        language: currentFullProfile.language, avatarUrl: currentFullProfile.avatar_url,
        bannerUrl: currentFullProfile.banner_img_url, bio: currentFullProfile.bio, role: currentFullProfile.role,
        stripeCustomerId: currentFullProfile.stripe_customer_id, subscriptionStatus: currentFullProfile.subscription_status,
        subscriptionTier: currentFullProfile.subscription_tier, subscriptionPeriod: currentFullProfile.subscription_period,
        subscriptionStartDate: currentFullProfile.subscription_start_date, subscriptionEndDate: currentFullProfile.subscription_end_date,
        createdAt: currentFullProfile.created_at, updatedAt: currentFullProfile.updated_at,
    };
    const validatedCurrentProfile = UserProfileSchema.safeParse(mappedCurrentProfile);
     if (validatedCurrentProfile.success) {
        logger.info(`[UpdateProfileAvatarAction] Successfully fetched current profile for user ${user.id} after no avatar change.`); // Uncommented logger call
        return { updatedProfile: validatedCurrentProfile.data };
    } else {
        logger.error(`[UpdateProfileAvatarAction] Fetched current profile after no avatar change for user ${user.id}, but it failed validation.`, { errors: validatedCurrentProfile.error.flatten() }); // Uncommented logger call
        return { error: "Failed to retrieve a valid current profile after no avatar change." };
    }
  }
}
