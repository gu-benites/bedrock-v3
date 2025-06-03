// src/features/user-auth-data/actions/update-profile-banner.action.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { UserProfileSchema, type UserProfile } from "../schemas/profile.schema";
import { getServerLogger } from '@/lib/logger'; // Re-added import
import { getStoragePathFromUrl, handleImageProcessing } from "../utils/profile-image.utils"; 

const logger = getServerLogger('UpdateProfileBannerAction'); // Re-added instantiation

interface UpdateProfileImageResult {
  updatedProfile?: UserProfile;
  error?: string;
}

export async function updateProfileBanner(
  bannerDataUri: string | null | undefined
): Promise<UpdateProfileImageResult> {
  logger.info(`[UpdateProfileBannerAction] Action started. BannerDataUri (first 50 chars): ${bannerDataUri ? bannerDataUri.substring(0, 50) + '...' : bannerDataUri}`); // Uncommented logger call

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    logger.error("[UpdateProfileBannerAction] Authentication error.", { error: authError.message }); // Uncommented logger call
    return { error: `Authentication error: ${authError.message}` };
  }
  if (!user) {
    logger.warn("[UpdateProfileBannerAction] No authenticated user found."); // Uncommented logger call
    return { error: "User not authenticated." };
  }
  logger.info(`[UpdateProfileBannerAction] Authenticated user: ${user.id}`); // Uncommented logger call

  let currentBannerPath: string | null = null;
  try {
    logger.info(`[UpdateProfileBannerAction] Fetching current banner_img_url for user ${user.id}`); // Uncommented logger call
    const { data: currentProfileData, error: fetchError } = await supabase
      .from('profiles')
      .select('banner_img_url')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error(`[UpdateProfileBannerAction] Error fetching current banner_img_url for user ${user.id}.`, { error: fetchError.message }); // Uncommented logger call
    }
    if (currentProfileData?.banner_img_url) {
      currentBannerPath = getStoragePathFromUrl(currentProfileData.banner_img_url, 'profiles', logger);
      logger.info(`[UpdateProfileBannerAction] Current banner path for user ${user.id}: ${currentBannerPath}`); // Uncommented logger call
    } else {
      logger.info(`[UpdateProfileBannerAction] No current banner_img_url found for user ${user.id}.`); // Uncommented logger call
    }
  } catch (e) {
    logger.error(`[UpdateProfileBannerAction] Unexpected error fetching current banner_img_url for user ${user.id}.`, { error: (e as Error).message }); // Uncommented logger call
  }

  logger.info(`[UpdateProfileBannerAction] Calling handleImageProcessing for banner. User: ${user.id}. currentBannerPath: ${currentBannerPath}`); // Uncommented logger call
  const bannerResult = await handleImageProcessing({
    supabase,
    userId: user.id,
    dataUri: bannerDataUri,
    currentImagePathInStorage: currentBannerPath,
    imageType: 'banner',
    baseFolderPath: 'banners',
    loggerInstance: logger,
  });
  logger.info(`[UpdateProfileBannerAction] handleImageProcessing for banner result:`, bannerResult); // Uncommented logger call

  if (bannerResult.error) {
    return { error: bannerResult.error };
  }

  if (bannerResult.newImageUrl !== undefined) {
    const userDataToUpdate: { banner_img_url: string | null; updated_at: string } = {
      banner_img_url: bannerResult.newImageUrl,
      updated_at: new Date().toISOString(),
    };

    logger.info(`[UpdateProfileBannerAction] Attempting to update banner_img_url in DB for user ID: ${user.id}`, { newUrl: bannerResult.newImageUrl }); // Uncommented logger call
    const { data: updatedProfileData, error: updateError } = await supabase
      .from("profiles")
      .update(userDataToUpdate)
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      logger.error(`[UpdateProfileBannerAction] Failed to update banner_img_url in DB for user ID: ${user.id}`, { error: updateError.message }); // Uncommented logger call
      return { error: `Failed to update profile: ${updateError.message}` };
    }
     if (!updatedProfileData) {
      logger.error(`[UpdateProfileBannerAction] Profile DB update for banner for user ID: ${user.id} did not return data.`); // Uncommented logger call
      return { error: "Profile update for banner failed to return data." };
    }
    logger.info(`[UpdateProfileBannerAction] DB update for banner_img_url successful for user ID: ${user.id}. Updated data:`, updatedProfileData); // Uncommented logger call

     const mappedProfile: UserProfile = { 
        id: updatedProfileData.id, email: user.email || '', firstName: updatedProfileData.first_name,
        lastName: updatedProfileData.last_name, gender: updatedProfileData.gender,
        ageCategory: updatedProfileData.age_category, specificAge: updatedProfileData.specific_age,
        language: updatedProfileData.language, avatarUrl: updatedProfileData.avatar_url,
        bannerUrl: updatedProfileData.banner_img_url, bio: updatedProfileData.bio, role: updatedProfileData.role,
        stripeCustomerId: updatedProfileData.stripe_customer_id, subscriptionStatus: updatedProfileData.subscription_status,
        subscriptionTier: updatedProfileData.subscription_tier, subscriptionPeriod: updatedProfileData.subscription_period,
        subscriptionStartDate: updatedProfileData.subscription_start_date, subscriptionEndDate: updatedProfileData.subscription_end_date,
        createdAt: updatedProfileData.created_at, updatedAt: updatedProfileData.updated_at,
    };
    const validationResult = UserProfileSchema.safeParse(mappedProfile);
    if (!validationResult.success) {
        logger.error('[UpdateProfileBannerAction] Updated profile data (banner) failed validation.', { errors: validationResult.error.flatten() }); // Uncommented logger call
        return { error: 'Updated profile data (banner) is invalid.' };
    }
    logger.info(`[UpdateProfileBannerAction] Banner updated and profile validated successfully for user ID: ${user.id}`); // Uncommented logger call
    return { updatedProfile: validationResult.data };
  } else {
    logger.info(`[UpdateProfileBannerAction] No change to banner_img_url needed for user ID: ${user.id}. Fetching current full profile.`); // Uncommented logger call
    const { data: currentFullProfile, error: fetchCurrentError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchCurrentError) {
        logger.error(`[UpdateProfileBannerAction] Error fetching current profile after no banner change for user ${user.id}`, { error: fetchCurrentError.message }); // Uncommented logger call
        return { error: "No banner change, but failed to re-fetch profile." };
    }
    if (!currentFullProfile) {
        logger.error(`[UpdateProfileBannerAction] Could not find profile for user ${user.id} after no banner change.`); // Uncommented logger call
        return { error: "User profile not found after no banner change." };
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
        logger.info(`[UpdateProfileBannerAction] Successfully fetched current profile for user ${user.id} after no banner change.`); // Uncommented logger call
        return { updatedProfile: validatedCurrentProfile.data };
    } else {
        logger.error(`[UpdateProfileBannerAction] Fetched current profile after no banner change for user ${user.id}, but it failed validation.`, { errors: validatedCurrentProfile.error.flatten() }); // Uncommented logger call
        return { error: "Failed to retrieve a valid current profile after no banner change." };
    }
  }
}
