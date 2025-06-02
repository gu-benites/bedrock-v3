
// src/features/user-auth-data/actions/profile.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { UserProfileSchema, type UserProfile } from "../schemas/profile.schema";
import { getServerLogger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js'; // For explicit typing
import type { Logger as WinstonLogger } from 'winston'; // For explicit typing

const logger = getServerLogger('ProfileActions');

interface UpdateProfileResult {
  data?: UserProfile;
  error?: string;
}

type UpdateProfileData = Partial<UserProfile> & {
  avatarDataUri?: string | null;
  bannerDataUri?: string | null;
};

/**
 * Extracts the storage path from a Supabase public URL.
 */
function getStoragePathFromUrl(publicUrl: string, bucketName: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathSegments = url.pathname.split('/');
    const bucketIndex = pathSegments.indexOf(bucketName);
    if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
      return pathSegments.slice(bucketIndex + 1).join('/');
    }
    logger.warn('Could not find bucket name in public URL path', { publicUrl, bucketName });
    return null;
  } catch (e) {
    logger.warn('Failed to parse URL for storage path extraction', { publicUrl, error: (e as Error).message });
    return null;
  }
}

interface ProcessImageOptions {
  supabase: SupabaseClient;
  userId: string;
  dataUri: string | null | undefined;
  currentImagePathInStorage: string | null;
  imageType: 'avatar' | 'banner';
  baseFolderPath: 'avatars' | 'banners'; // More specific type
  loggerInstance: WinstonLogger; // Pass logger
}

interface ProcessImageResult {
  newImageUrl?: string | null; // string if uploaded, null if removed, undefined if no change/non-critical error
  error?: string; // Critical error message for this image
}

/**
 * Internal helper to process image upload or removal for avatar or banner.
 */
async function _handleImageProcessing({
  supabase,
  userId,
  dataUri,
  currentImagePathInStorage,
  imageType,
  baseFolderPath,
  loggerInstance,
}: ProcessImageOptions): Promise<ProcessImageResult> {
  loggerInstance.info(`Processing ${imageType} for user ID: ${userId}. DataURI provided: ${!!dataUri}, current DB path: ${currentImagePathInStorage}`);

  // Case 1: New image data URI is provided (upload or replace)
  if (typeof dataUri === 'string' && dataUri.startsWith('data:image')) {
    loggerInstance.info(`New ${imageType} DataURI received for user ${userId}. Length: ${dataUri.length}`);
    if (currentImagePathInStorage) {
      loggerInstance.info(`Attempting to delete old ${imageType} for user ID: ${userId}`, { path: currentImagePathInStorage });
      const { error: deleteOldImageError } = await supabase.storage
        .from('profiles')
        .remove([currentImagePathInStorage]);
      if (deleteOldImageError) {
        loggerInstance.warn(`Failed to delete old ${imageType} for user ID: ${userId}`, { path: currentImagePathInStorage, error: deleteOldImageError.message });
        // Non-critical, proceed with upload
      } else {
        loggerInstance.info(`Successfully deleted old ${imageType} for user ID: ${userId}`, { path: currentImagePathInStorage });
      }
    }

    try {
      const base64Data = dataUri.split(';base64,').pop();
      if (!base64Data) throw new Error(`Invalid ${imageType} Data URI format.`);
      const buffer = Buffer.from(base64Data, 'base64');
      const fileExtension = dataUri.substring(dataUri.indexOf('/') + 1, dataUri.indexOf(';base64'));
      const filePath = `${baseFolderPath}/${userId}.${fileExtension}`;
      const contentType = `image/${fileExtension}`;
      loggerInstance.info(`Attempting to upload new ${imageType} for user ID: ${userId}`, { filePath, contentType, bufferLength: buffer.length });

      const { data: uploadDataResponse, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, buffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: contentType,
        });

      if (uploadError) {
        loggerInstance.error(`Supabase storage.upload ERROR for ${imageType} user ${userId}`, { filePath, error: uploadError });
        return { error: `Failed to upload ${imageType}: ${uploadError.message}` };
      }
      loggerInstance.info(`Supabase storage.upload SUCCESS for ${imageType} user ${userId}`, { uploadDataResponse });

      const { data: publicUrlData } = supabase.storage.from('profiles').getPublicUrl(filePath);
      if (publicUrlData?.publicUrl) {
        loggerInstance.info(`${imageType} public URL retrieved successfully for user ID: ${userId}`, { url: publicUrlData.publicUrl });
        return { newImageUrl: publicUrlData.publicUrl };
      } else {
        loggerInstance.warn(`Failed to get public URL for new ${imageType} for user ID: ${userId}, path: ${filePath}`);
        return { error: `Uploaded ${imageType}, but failed to get public URL.` };
      }
    } catch (uploadCatchError: any) {
      loggerInstance.error(`${imageType} upload process failed for user ID: ${userId}`, { errorName: uploadCatchError.name, errorMessage: uploadCatchError.message, stack: uploadCatchError.stack });
      return { error: `Failed to upload ${imageType}: ${uploadCatchError.message}` };
    }
  }
  // Case 2: Image explicitly marked for removal (dataUri is null)
  else if (dataUri === null) {
    loggerInstance.info(`${imageType} marked for removal (dataUri is null) for user ID: ${userId}.`);
    if (currentImagePathInStorage) {
      loggerInstance.info(`Attempting to remove existing ${imageType} from storage for user ID: ${userId}`, { path: currentImagePathInStorage });
      const { error: deleteExistingImageError } = await supabase.storage
        .from('profiles')
        .remove([currentImagePathInStorage]);
      if (deleteExistingImageError) {
        loggerInstance.warn(`Failed to remove existing ${imageType} from storage for user ID: ${userId}`, { path: currentImagePathInStorage, error: deleteExistingImageError.message });
        // Non-critical for DB update, but image remains in storage.
        // Return undefined for newImageUrl so DB isn't set to null if storage removal fails
        return { error: `Failed to remove ${imageType} from storage, DB update for this image aborted.` };
      } else {
        loggerInstance.info(`Successfully removed existing ${imageType} from storage for user ID: ${userId}`, { path: currentImagePathInStorage });
        return { newImageUrl: null }; // Signal DB field should be set to null
      }
    } else {
      loggerInstance.info(`No existing ${imageType} in DB to remove from storage for user ${userId}.`);
      return { newImageUrl: null }; // Still signal DB field should be null as removal was intended
    }
  }
  // Case 3: No change actioned for this image (dataUri is undefined or empty string)
  else {
    loggerInstance.info(`No action required for ${imageType} for user ID: ${userId} (dataUri is undefined or not a new image string).`);
    return {}; // No new URL, no removal, no error for this image
  }
}


/**
 * Server Action to update the current user's profile information.
 * Handles text-based fields and image uploads (avatar and banner).
 * @returns An object containing the updated profile data or an error message.
 */
export async function updateUserProfile(
  data: UpdateProfileData): Promise<UpdateProfileResult> {
  logger.info("updateUserProfile action started.", {
    providedFields: Object.keys(data),
    hasAvatarDataUri: data.avatarDataUri ? 'Provided' : data.avatarDataUri, // Log null/undefined
    hasBannerDataUri: data.bannerDataUri ? 'Provided' : data.bannerDataUri,
  });

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    logger.error("Authentication error in updateUserProfile.", { error: authError.message });
    return { error: `Authentication error: ${authError.message}` };
  }
  if (!user) {
    logger.warn("No authenticated user found in updateUserProfile.");
    return { error: "User not authenticated." };
  }

  let currentAvatarPath: string | null = null;
  let currentBannerPath: string | null = null;
  try {
    logger.info(`Fetching current profile for user ID: ${user.id} to check existing images.`);
    const { data: currentProfileData, error: fetchCurrentProfileError } = await supabase
      .from('profiles')
      .select('avatar_url, banner_img_url') // Fetching both for efficiency
      .eq('id', user.id)
      .single(); // Use single as profile should exist or it's an insert (handled by RLS or later upsert logic)

    if (fetchCurrentProfileError && fetchCurrentProfileError.code !== 'PGRST116') { // PGRST116: no rows found
      logger.error("Error fetching current profile for image checks.", { userId: user.id, error: fetchCurrentProfileError.message });
      // Decide if this is fatal or if we can proceed assuming no existing images. For now, proceed.
    }
    if (currentProfileData) {
      if (currentProfileData.avatar_url) {
        currentAvatarPath = getStoragePathFromUrl(currentProfileData.avatar_url, 'profiles');
      }
      if (currentProfileData.banner_img_url) {
        currentBannerPath = getStoragePathFromUrl(currentProfileData.banner_img_url, 'profiles');
      }
    }
  } catch (e) {
    logger.error("Unexpected error fetching current profile for image checks.", { userId: user.id, error: (e as Error).message });
  }

  const {
    id, email, createdAt, updatedAt, role,
    stripeCustomerId, subscriptionStatus, subscriptionTier,
    subscriptionPeriod, subscriptionStartDate, subscriptionEndDate,
    avatarDataUri, bannerDataUri,
    avatarUrl, // Prevent direct update from form data if avatarDataUri is used
    bannerUrl, // Prevent direct update from form data if bannerDataUri is used
    ...updatableData
  } = data;
  
  const userDataToUpdate: Record<string, any> = {};

  if (updatableData.firstName !== undefined) userDataToUpdate.first_name = updatableData.firstName;
  if (updatableData.lastName !== undefined) userDataToUpdate.last_name = updatableData.lastName;
  if (updatableData.gender !== undefined) userDataToUpdate.gender = updatableData.gender;
  if (updatableData.ageCategory !== undefined) userDataToUpdate.age_category = updatableData.ageCategory;
  if (updatableData.specificAge !== undefined) userDataToUpdate.specific_age = updatableData.specificAge;
  if (updatableData.language !== undefined) userDataToUpdate.language = updatableData.language;
  if (updatableData.bio !== undefined) userDataToUpdate.bio = updatableData.bio;


  // Process Avatar
  const avatarResult = await _handleImageProcessing({
    supabase, userId: user.id, dataUri: avatarDataUri,
    currentImagePathInStorage: currentAvatarPath,
    imageType: 'avatar', baseFolderPath: 'avatars', loggerInstance: logger,
  });

  if (avatarResult.error) return { error: avatarResult.error };
  if (avatarResult.newImageUrl !== undefined) { // If null or a URL, it's an intentional change
    userDataToUpdate.avatar_url = avatarResult.newImageUrl;
  }

  // Process Banner
  const bannerResult = await _handleImageProcessing({
    supabase, userId: user.id, dataUri: bannerDataUri,
    currentImagePathInStorage: currentBannerPath,
    imageType: 'banner', baseFolderPath: 'banners', loggerInstance: logger,
  });

  if (bannerResult.error) return { error: bannerResult.error };
  if (bannerResult.newImageUrl !== undefined) { // If null or a URL, it's an intentional change
    userDataToUpdate.banner_img_url = bannerResult.newImageUrl;
  }

  // Only add updated_at if there are actual changes to commit to the DB
  if (Object.keys(userDataToUpdate).length > 0) {
    userDataToUpdate.updated_at = new Date().toISOString();
  } else {
    logger.info(`No actual data fields to update for user ID: ${user.id} (text fields or image URLs). Fetching current profile to return.`);
    // Re-fetch to return the latest state if no DB write was made (or intended)
    const { data: currentProfileForReturn, error: fetchErrorForReturn } = await supabase.from("profiles").select().eq("id", user.id).single();
    if (fetchErrorForReturn && fetchErrorForReturn.code !== 'PGRST116') {
      logger.error(`Error fetching profile for no-op update return for user ${user.id}`, { error: fetchErrorForReturn.message });
      return { error: "Profile update attempted, but no changes made and failed to re-fetch profile." };
    }
    if (currentProfileForReturn) {
      const mappedProfile: UserProfile = {
          id: currentProfileForReturn.id, email: user.email || '', firstName: currentProfileForReturn.first_name,
          lastName: currentProfileForReturn.last_name, gender: currentProfileForReturn.gender,
          ageCategory: currentProfileForReturn.age_category, specificAge: currentProfileForReturn.specific_age,
          language: currentProfileForReturn.language, avatarUrl: currentProfileForReturn.avatar_url,
          bannerUrl: currentProfileForReturn.banner_img_url, 
          bio: currentProfileForReturn.bio, role: currentProfileForReturn.role,
          stripeCustomerId: currentProfileForReturn.stripe_customer_id,
          subscriptionStatus: currentProfileForReturn.subscription_status,
          subscriptionTier: currentProfileForReturn.subscription_tier,
          subscriptionPeriod: currentProfileForReturn.subscription_period,
          subscriptionStartDate: currentProfileForReturn.subscription_start_date,
          subscriptionEndDate: currentProfileForReturn.subscription_end_date,
          createdAt: currentProfileForReturn.created_at, updatedAt: currentProfileForReturn.updated_at,
      };
      const validatedProfile = UserProfileSchema.safeParse(mappedProfile);
      if (validatedProfile.success) {
          logger.info(`Returning current (unchanged or re-fetched) profile for user ${user.id}.`);
          return { data: validatedProfile.data };
      } else {
          logger.error(`Fetched current profile for no-op update for user ${user.id}, but it failed validation.`, { errors: validatedProfile.error.flatten() });
          return { error: "Failed to retrieve a valid current profile after no-op update." };
      }
    }
    logger.warn(`No changes to apply, and could not retrieve current profile for user ${user.id}.`);
    return { error: "No changes to apply, and could not retrieve current profile." };
  }

  logger.info(`Attempting to update profile in DB for user ID: ${user.id}`, { fieldsToUpdate: Object.keys(userDataToUpdate) });

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update(userDataToUpdate)
    .eq("id", user.id)
    .select()
    .single();

  if (updateError) {
    logger.error(`Failed to update profile in DB for user ID: ${user.id}`, { error: updateError.message, details: updateError.details, code: updateError.code });
    return { error: `Failed to update profile: ${updateError.message}` };
  }

  if (!updatedProfile) {
    logger.error(`Profile DB update for user ID: ${user.id} did not return data.`, { updateError });
    return { error: "Profile update failed to return data." };
  }

  const resultProfile: UserProfile = {
    id: updatedProfile.id,
    email: user.email || '',
    firstName: updatedProfile.first_name,
    lastName: updatedProfile.last_name,
    gender: updatedProfile.gender,
    ageCategory: updatedProfile.age_category,
    specificAge: updatedProfile.specific_age,
    language: updatedProfile.language,
    avatarUrl: updatedProfile.avatar_url,
    bannerUrl: updatedProfile.banner_img_url, 
    bio: updatedProfile.bio,
    role: updatedProfile.role,
    stripeCustomerId: updatedProfile.stripe_customer_id,
    subscriptionStatus: updatedProfile.subscription_status,
    subscriptionTier: updatedProfile.subscription_tier,
    subscriptionPeriod: updatedProfile.subscription_period,
    subscriptionStartDate: updatedProfile.subscription_start_date,
    subscriptionEndDate: updatedProfile.subscription_end_date,
    createdAt: updatedProfile.created_at,
    updatedAt: updatedProfile.updated_at,
  };
  
  const validationResult = UserProfileSchema.safeParse(resultProfile);
  if (!validationResult.success) {
      logger.error('Updated profile data failed validation after mapping.', { errors: validationResult.error.flatten() });
      return { error: 'Updated profile data is invalid.' };
  }

  logger.info(`Profile updated successfully in DB for user ID: ${user.id}`);
  return { data: validationResult.data };
}

    