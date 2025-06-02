
// src/features/user-auth-data/actions/profile.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { UserProfileSchema, type UserProfile } from "../schemas/profile.schema"; // Assuming UserProfile is exported
import { getServerLogger } from '@/lib/logger';

const logger = getServerLogger('ProfileActions');

interface UpdateProfileResult {
  data?: UserProfile;
  error?: string;
}

// Define a type that includes the base Profile and the potential data URI fields
type UpdateProfileData = Partial<UserProfile> & {
  avatarDataUri?: string | null;
  bannerDataUri?: string | null; // CORRECTED: Was bannerImgDataUri, now matches form field
};

/**
 * Extracts the storage path from a Supabase public URL.
 * e.g., https://<project>.supabase.co/storage/v1/object/public/profiles/avatars/user-id.png -> avatars/user-id.png
 */
function getStoragePathFromUrl(publicUrl: string, bucketName: string): string | null {
  try {
    const url = new URL(publicUrl);
    // Pathname will be like /storage/v1/object/public/profiles/avatars/user-id.png
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


/**
 * Server Action to update the current user's profile information.
 * Handles text-based fields and image uploads (avatar and banner).
 * @returns An object containing the updated profile data or an error message.
 */
export async function updateUserProfile(
  data: UpdateProfileData): Promise<UpdateProfileResult> {
  logger.info("updateUserProfile action started.", {
    providedFields: Object.keys(data),
    hasAvatarDataUri: data.avatarDataUri ? data.avatarDataUri.substring(0, 30) + '...' : data.avatarDataUri,
    hasBannerDataUri: data.bannerDataUri ? data.bannerDataUri.substring(0, 30) + '...' : data.bannerDataUri, // CORRECTED
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

  let currentAvatarDbPath: string | null = null;
  let currentBannerDbPath: string | null = null;
  try {
    logger.info(`Fetching current profile for user ID: ${user.id} to check existing images.`);
    const { data: currentProfileData, error: fetchCurrentProfileError } = await supabase
      .from('profiles')
      .select('avatar_url, banner_img_url')
      .eq('id', user.id)
      .single();

    if (fetchCurrentProfileError && fetchCurrentProfileError.code !== 'PGRST116') {
      logger.error("Error fetching current profile for image deletion check.", { userId: user.id, error: fetchCurrentProfileError.message });
    }
    if (currentProfileData?.avatar_url) {
      currentAvatarDbPath = getStoragePathFromUrl(currentProfileData.avatar_url, 'profiles');
      logger.info(`Found existing avatar_url for user ${user.id}`, { url: currentProfileData.avatar_url, path: currentAvatarDbPath });
    }
    if (currentProfileData?.banner_img_url) {
      currentBannerDbPath = getStoragePathFromUrl(currentProfileData.banner_img_url, 'profiles');
      logger.info(`Found existing banner_img_url for user ${user.id}`, { url: currentProfileData.banner_img_url, path: currentBannerDbPath });
    }
  } catch (e) {
    logger.error("Unexpected error fetching current profile for image deletion check.", { userId: user.id, error: (e as Error).message });
  }


  const {
    id, email, createdAt, updatedAt, role,
    stripeCustomerId, subscriptionStatus, subscriptionTier,
    subscriptionPeriod, subscriptionStartDate, subscriptionEndDate,
    avatarDataUri,
    bannerDataUri, // CORRECTED: Was bannerImgDataUri
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

  userDataToUpdate.updated_at = new Date().toISOString();

  logger.info(`Processing avatar for user ID: ${user.id}. avatarDataUri value: ${typeof avatarDataUri}, current DB path: ${currentAvatarDbPath}`);
  if (typeof avatarDataUri === 'string' && avatarDataUri.startsWith('data:image')) {
    logger.info(`New avatarDataUri received for user ${user.id}. Length: ${avatarDataUri.length}`);
    if (currentAvatarDbPath) {
      logger.info(`Attempting to delete old avatar for user ID: ${user.id}`, { path: currentAvatarDbPath });
      const { error: deleteOldAvatarError } = await supabase.storage
        .from('profiles')
        .remove([currentAvatarDbPath]);
      if (deleteOldAvatarError) {
        logger.warn(`Failed to delete old avatar for user ID: ${user.id}`, { path: currentAvatarDbPath, error: deleteOldAvatarError.message });
      } else {
        logger.info(`Successfully deleted old avatar for user ID: ${user.id}`, { path: currentAvatarDbPath });
      }
    }

    try {
      const base64Data = avatarDataUri.split(';base64,').pop();
      if (!base64Data) throw new Error("Invalid avatar Data URI format.");
      const buffer = Buffer.from(base64Data, 'base64');
      const fileExtension = avatarDataUri.substring('data:image/'.length, avatarDataUri.indexOf(';base64'));
      const filePath = `avatars/${user.id}.${fileExtension}`; 
      const contentType = `image/${fileExtension}`;
      logger.info(`Attempting to upload new avatar for user ID: ${user.id}`, { filePath, contentType, bufferLength: buffer.length });

      const { data: uploadDataResponse, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, buffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: contentType
        });

      if (uploadError) {
        logger.error(`Supabase storage.upload ERROR for avatar user ${user.id}`, { filePath, error: uploadError });
        throw uploadError;
      }
      logger.info(`Supabase storage.upload SUCCESS for avatar user ${user.id}`, { uploadDataResponse });

      const { data: publicUrlData } = supabase.storage.from('profiles').getPublicUrl(filePath);
      if (publicUrlData?.publicUrl) {
        userDataToUpdate.avatar_url = publicUrlData.publicUrl;
        logger.info(`Avatar public URL retrieved successfully for user ID: ${user.id}`, { url: publicUrlData.publicUrl });
      } else {
         logger.warn(`Failed to get public URL for new avatar for user ID: ${user.id}, path: ${filePath}`);
      }
    } catch (uploadCatchError: any) {
      logger.error(`Avatar upload process failed for user ID: ${user.id}`, { errorName: uploadCatchError.name, errorMessage: uploadCatchError.message, stack: uploadCatchError.stack });
      return { error: `Failed to upload avatar: ${uploadCatchError.message}` };
    }
  } else if (avatarDataUri === null) {
      logger.info(`Avatar marked for removal (avatarDataUri is null) for user ID: ${user.id}.`);
      if (currentAvatarDbPath) {
        logger.info(`Attempting to remove existing avatar from storage for user ID: ${user.id}`, { path: currentAvatarDbPath });
        const { error: deleteExistingAvatarError } = await supabase.storage
          .from('profiles')
          .remove([currentAvatarDbPath]);
        if (deleteExistingAvatarError) {
          logger.warn(`Failed to remove existing avatar from storage for user ID: ${user.id}`, { path: currentAvatarDbPath, error: deleteExistingAvatarError.message });
        } else {
          logger.info(`Successfully removed existing avatar from storage for user ID: ${user.id}`, { path: currentAvatarDbPath });
        }
      } else {
        logger.info(`No existing avatar in DB to remove from storage for user ${user.id}.`);
      }
      userDataToUpdate.avatar_url = null;
      logger.info(`Avatar DB URL will be set to null for user ID: ${user.id}.`);
  }


  logger.info(`Processing banner for user ID: ${user.id}. bannerDataUri value: ${typeof bannerDataUri}, current DB path: ${currentBannerDbPath}`);
  if (typeof bannerDataUri === 'string' && bannerDataUri.startsWith('data:image')) { // New banner uploaded
    logger.info(`New bannerDataUri received for user ${user.id}. Length: ${bannerDataUri.length}`);
    if (currentBannerDbPath) {
      logger.info(`Attempting to delete old banner for user ID: ${user.id}`, { path: currentBannerDbPath });
      const { error: deleteOldBannerError } = await supabase.storage
        .from('profiles')
        .remove([currentBannerDbPath]);
      if (deleteOldBannerError) {
        logger.warn(`Failed to delete old banner for user ID: ${user.id}`, { path: currentBannerDbPath, error: deleteOldBannerError.message });
      } else {
        logger.info(`Successfully deleted old banner for user ID: ${user.id}`, { path: currentBannerDbPath });
      }
    }
    try {
      const base64Data = bannerDataUri.split(';base64,').pop();
      if (!base64Data) throw new Error("Invalid banner Data URI format.");
      const buffer = Buffer.from(base64Data, 'base64');
      const fileExtension = bannerDataUri.substring('data:image/'.length, bannerDataUri.indexOf(';base64'));
      const filePath = `banners/${user.id}.${fileExtension}`; // Correct path for banners
      const contentType = `image/${fileExtension}`;
      logger.info(`Attempting to upload new banner for user ID: ${user.id}`, { filePath, contentType, bufferLength: buffer.length });

      const { data: uploadDataResponse, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, buffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: contentType
        });

      if (uploadError) {
        logger.error(`Supabase storage.upload ERROR for banner user ${user.id}`, { filePath, error: uploadError });
        throw uploadError;
      }
      logger.info(`Supabase storage.upload SUCCESS for banner user ${user.id}`, { uploadDataResponse });

      const { data: publicUrlData } = supabase.storage.from('profiles').getPublicUrl(filePath);
      if (publicUrlData?.publicUrl) {
        userDataToUpdate.banner_img_url = publicUrlData.publicUrl; // DB field name is banner_img_url
        logger.info(`Banner public URL retrieved successfully for user ID: ${user.id}`, { url: publicUrlData.publicUrl });
      } else {
         logger.warn(`Failed to get public URL for banner for user ID: ${user.id}, path: ${filePath}`);
      }
    } catch (uploadCatchError: any) {
      logger.error(`Banner upload process failed for user ID: ${user.id}`, { errorName: uploadCatchError.name, errorMessage: uploadCatchError.message, stack: uploadCatchError.stack });
      return { error: `Failed to upload banner: ${uploadCatchError.message}` };
    }
  } else if (bannerDataUri === null) { // Banner explicitly removed
      logger.info(`Banner marked for removal (bannerDataUri is null) for user ID: ${user.id}.`);
      if (currentBannerDbPath) {
        logger.info(`Attempting to remove existing banner from storage for user ID: ${user.id}`, { path: currentBannerDbPath });
        const { error: deleteExistingBannerError } = await supabase.storage
          .from('profiles')
          .remove([currentBannerDbPath]);
        if (deleteExistingBannerError) {
          logger.warn(`Failed to remove existing banner from storage for user ID: ${user.id}`, { path: currentBannerDbPath, error: deleteExistingBannerError.message });
        } else {
          logger.info(`Successfully removed existing banner from storage for user ID: ${user.id}`, { path: currentBannerDbPath });
        }
      } else {
        logger.info(`No existing banner in DB to remove from storage for user ${user.id}.`);
      }
      userDataToUpdate.banner_img_url = null; // DB field name is banner_img_url
      logger.info(`Banner DB URL will be set to null for user ID: ${user.id}.`);
  }

  // Check if there's anything to update besides 'updated_at'
  const fieldsToUpdateCount = Object.keys(userDataToUpdate).filter(key => key !== 'updated_at').length;

  if (fieldsToUpdateCount === 0) {
    // This condition means only updated_at is present, and no image interactions (new upload or explicit removal) were performed.
    // Or image interactions happened but resulted in no change to DB URLs (e.g. remove non-existent image)
    logger.info(`No actual data fields to update for user ID: ${user.id} (excluding images not explicitly changed or updated). Returning current profile if fetched.`);
    // Re-fetch to return the latest state if no DB write was made
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

    