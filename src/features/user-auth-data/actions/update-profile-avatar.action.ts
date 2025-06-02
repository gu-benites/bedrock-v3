// src/features/user-auth-data/actions/update-profile-avatar.action.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { UserProfileSchema, type UserProfile } from "../schemas/profile.schema";
import { getServerLogger } from '@/lib/logger';
import { getStoragePathFromUrl, handleImageProcessing } from "./utils/profile-image.utils";

const logger = getServerLogger('UpdateProfileAvatarAction');

interface UpdateProfileImageResult {
  updatedProfile?: UserProfile;
  error?: string;
}

export async function updateProfileAvatar(
  avatarDataUri: string | null | undefined
): Promise<UpdateProfileImageResult> {
  logger.info("updateProfileAvatar action started.", { hasAvatarDataUri: avatarDataUri ? 'Provided' : avatarDataUri });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    logger.error("Authentication error.", { error: authError.message });
    return { error: `Authentication error: ${authError.message}` };
  }
  if (!user) {
    logger.warn("No authenticated user found.");
    return { error: "User not authenticated." };
  }

  let currentAvatarPath: string | null = null;
  try {
    const { data: currentProfileData, error: fetchError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: no rows found, which is fine
      logger.error("Error fetching current avatar_url.", { userId: user.id, error: fetchError.message });
      // Non-fatal for upload, but old image might not be deleted if it exists
    }
    if (currentProfileData?.avatar_url) {
      currentAvatarPath = getStoragePathFromUrl(currentProfileData.avatar_url, 'profiles', logger);
    }
  } catch (e) {
    logger.error("Unexpected error fetching current avatar_url.", { userId: user.id, error: (e as Error).message });
  }
  
  const avatarResult = await handleImageProcessing({
    supabase,
    userId: user.id,
    dataUri: avatarDataUri,
    currentImagePathInStorage: currentAvatarPath,
    imageType: 'avatar',
    baseFolderPath: 'avatars',
    loggerInstance: logger,
  });

  if (avatarResult.error) {
    return { error: avatarResult.error };
  }

  // Only update if there's a change to the avatar_url
  if (avatarResult.newImageUrl !== undefined) {
    const userDataToUpdate: { avatar_url: string | null; updated_at: string } = {
      avatar_url: avatarResult.newImageUrl,
      updated_at: new Date().toISOString(),
    };

    logger.info(`Attempting to update avatar_url in DB for user ID: ${user.id}`, { newUrl: avatarResult.newImageUrl });
    const { data: updatedProfileData, error: updateError } = await supabase
      .from("profiles")
      .update(userDataToUpdate)
      .eq("id", user.id)
      .select() // Select all fields to return the full profile
      .single();

    if (updateError) {
      logger.error(`Failed to update avatar_url in DB for user ID: ${user.id}`, { error: updateError.message });
      return { error: `Failed to update profile: ${updateError.message}` };
    }
    if (!updatedProfileData) {
      logger.error(`Profile DB update for avatar for user ID: ${user.id} did not return data.`);
      return { error: "Profile update for avatar failed to return data." };
    }
    
    const mappedProfile: UserProfile = {
        id: updatedProfileData.id,
        email: user.email || '', // Assuming email is from auth user
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
        logger.error('Updated profile data (avatar) failed validation.', { errors: validationResult.error.flatten() });
        return { error: 'Updated profile data (avatar) is invalid.' };
    }
    logger.info(`Avatar updated successfully for user ID: ${user.id}`);
    return { updatedProfile: validationResult.data };

  } else {
    // No change to avatar, fetch current profile to return consistent data structure
    logger.info(`No change to avatar for user ID: ${user.id}. Fetching current profile.`);
     const { data: currentFullProfile, error: fetchCurrentError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchCurrentError) {
        logger.error(`Error fetching current profile after no avatar change for user ${user.id}`, { error: fetchCurrentError.message });
        return { error: "No avatar change, but failed to re-fetch profile." };
    }
     if (!currentFullProfile) {
        logger.error(`Could not find profile for user ${user.id} after no avatar change.`);
        return { error: "User profile not found after no avatar change." };
    }
     const mappedCurrentProfile: UserProfile = { /* ... map all fields ... */ 
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
        return { updatedProfile: validatedCurrentProfile.data };
    } else {
        logger.error(`Fetched current profile after no avatar change for user ${user.id}, but it failed validation.`, { errors: validatedCurrentProfile.error.flatten() });
        return { error: "Failed to retrieve a valid current profile after no avatar change." };
    }
  }
}
