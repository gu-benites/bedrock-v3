
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
  bannerImgDataUri?: string | null; // Changed from bannerDataUri to match schema/form
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
    hasAvatarDataUri: !!data.avatarDataUri,
    hasBannerImgDataUri: !!data.bannerImgDataUri,
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
  // Fetch current profile to get existing avatar_url and banner_img_url for deletion logic
  try {
    const { data: currentProfileData, error: fetchCurrentProfileError } = await supabase
      .from('profiles')
      .select('avatar_url, banner_img_url') // Only select necessary fields
      .eq('id', user.id)
      .single();

    if (fetchCurrentProfileError && fetchCurrentProfileError.code !== 'PGRST116') { // PGRST116: Row not found, which is fine
      logger.error("Error fetching current profile for image deletion check.", { userId: user.id, error: fetchCurrentProfileError.message });
      // Don't fail the whole update yet, but log this. Deletion might not occur.
    }
    if (currentProfileData?.avatar_url) {
      currentAvatarDbPath = getStoragePathFromUrl(currentProfileData.avatar_url, 'profiles');
    }
    // Similarly for banner_img_url if we were handling it now
  } catch (e) {
    logger.error("Unexpected error fetching current profile for image deletion check.", { userId: user.id, error: (e as Error).message });
  }


  // Prepare data for update, excluding fields not directly on the 'profiles' table or managed elsewhere
  const {
    id,            // Managed by Supabase auth
    email,         // Managed by Supabase auth, usually not updated here
    createdAt,     // Set by database
    updatedAt,     // Will be set now
    role,          // Potentially managed by admin or specific logic
    stripeCustomerId, // Usually managed by billing integration
    subscriptionStatus,
    subscriptionTier,
    subscriptionPeriod,
    subscriptionStartDate, // Usually managed by billing integration
    subscriptionEndDate, // Usually managed by billing integration
    avatarDataUri, // Handled as base64 for upload
    bannerImgDataUri, // Handled as base64 for upload
    avatarUrl, // Prevent direct update of avatarUrl from form data if avatarDataUri is used
    bannerUrl, // Prevent direct update of bannerUrl from form data if bannerImgDataUri is used
    ...updatableData // The rest of the fields are candidates for update
  } = data;
  
  const userDataToUpdate: Record<string, any> = {};

  // Map camelCase updatableData to snake_case for database
  if (updatableData.firstName !== undefined) userDataToUpdate.first_name = updatableData.firstName;
  if (updatableData.lastName !== undefined) userDataToUpdate.last_name = updatableData.lastName;
  if (updatableData.gender !== undefined) userDataToUpdate.gender = updatableData.gender;
  if (updatableData.ageCategory !== undefined) userDataToUpdate.age_category = updatableData.ageCategory;
  if (updatableData.specificAge !== undefined) userDataToUpdate.specific_age = updatableData.specificAge;
  if (updatableData.language !== undefined) userDataToUpdate.language = updatableData.language;
  if (updatableData.bio !== undefined) userDataToUpdate.bio = updatableData.bio;


  userDataToUpdate.updated_at = new Date().toISOString();

  // --- Handle Avatar Upload ---
  if (avatarDataUri) { // New avatar uploaded
    if (currentAvatarDbPath) {
      logger.info(`Attempting to delete old avatar for user ID: ${user.id}`, { path: currentAvatarDbPath });
      const { error: deleteOldAvatarError } = await supabase.storage
        .from('profiles')
        .remove([currentAvatarDbPath]);
      if (deleteOldAvatarError) {
        logger.warn(`Failed to delete old avatar for user ID: ${user.id}`, { path: currentAvatarDbPath, error: deleteOldAvatarError.message });
        // Non-fatal, continue with upload
      } else {
        logger.info(`Successfully deleted old avatar for user ID: ${user.id}`, { path: currentAvatarDbPath });
      }
    }

    try {
      const base64Data = avatarDataUri.split(';base64,').pop();
      if (!base64Data) throw new Error("Invalid avatar Data URI format.");
      const buffer = Buffer.from(base64Data, 'base64');
      const fileExtension = avatarDataUri.substring('data:image/'.length, avatarDataUri.indexOf(';base64'));
      const filePath = `avatars/${user.id}.${fileExtension}`; // Store with user ID and extension

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, buffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: `image/${fileExtension}`
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('profiles').getPublicUrl(filePath);
      if (publicUrlData?.publicUrl) {
        userDataToUpdate.avatar_url = publicUrlData.publicUrl;
        logger.info(`Avatar uploaded successfully for user ID: ${user.id}`, { url: publicUrlData.publicUrl });
      } else {
         logger.warn(`Failed to get public URL for new avatar for user ID: ${user.id}`);
      }

    } catch (uploadError: any) {
      logger.error(`Avatar upload failed for user ID: ${user.id}`, { error: uploadError.message });
      return { error: `Failed to upload avatar: ${uploadError.message}` };
    }
  } else if (avatarDataUri === null) { // Avatar explicitly removed
      if (currentAvatarDbPath) {
        logger.info(`Attempting to remove existing avatar for user ID: ${user.id}`, { path: currentAvatarDbPath });
        const { error: deleteExistingAvatarError } = await supabase.storage
          .from('profiles')
          .remove([currentAvatarDbPath]);
        if (deleteExistingAvatarError) {
          logger.warn(`Failed to remove existing avatar from storage for user ID: ${user.id}`, { path: currentAvatarDbPath, error: deleteExistingAvatarError.message });
          // Non-fatal, will still set DB URL to null
        } else {
          logger.info(`Successfully removed existing avatar from storage for user ID: ${user.id}`, { path: currentAvatarDbPath });
        }
      }
      userDataToUpdate.avatar_url = null;
      logger.info(`Avatar marked for removal for user ID: ${user.id}. DB URL will be set to null.`);
  }
  // If avatarDataUri is undefined (not "" or null), it means no change was made to the avatar by the user, so we don't touch userDataToUpdate.avatar_url here.
  // It will retain its existing value or be overwritten if avatarUrl was part of 'data' (which we now filter out).

  // --- Handle Banner Upload (Placeholder for similar logic) ---
  if (bannerImgDataUri) {
    // TODO: Implement banner upload logic similar to avatar, including deleting old banner
    // For now, just log and potentially update if bannerUrl was directly in 'data' (which it shouldn't be)
    try {
      // Extract base64 data
      const base64Data = bannerImgDataUri.split(';base64,').pop();
      if (!base64Data) throw new Error("Invalid banner Data URI format.");
      const buffer = Buffer.from(base64Data, 'base64');
      const fileExtension = bannerImgDataUri.substring('data:image/'.length, bannerImgDataUri.indexOf(';base64'));
      const filePath = `banners/${user.id}.${fileExtension}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, buffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: `image/${fileExtension}`
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('profiles').getPublicUrl(filePath);
      if (publicUrlData?.publicUrl) {
        userDataToUpdate.banner_img_url = publicUrlData.publicUrl;
        logger.info(`Banner uploaded successfully for user ID: ${user.id}`);
      } else {
         logger.warn(`Failed to get public URL for banner for user ID: ${user.id}`);
      }

    } catch (uploadError: any) {
      logger.error(`Banner upload failed for user ID: ${user.id}`, { error: uploadError.message });
      return { error: `Failed to upload banner: ${uploadError.message}` };
    }
  } else if (bannerImgDataUri === null) { // If bannerImgDataUri is explicitly null, remove banner
      // TODO: Implement deletion of old banner from storage if currentProfileDb.banner_img_url exists
      userDataToUpdate.banner_img_url = null;
      logger.info(`Banner marked for removal for user ID: ${user.id}. DB URL will be set to null.`);
  }


  // Only proceed with database update if there are fields to update
  if (Object.keys(userDataToUpdate).length === 1 && userDataToUpdate.updated_at) {
      // Only updated_at is present, meaning no actual profile data changed by the user
      // This can happen if only images were interacted with but resulted in no change (e.g., upload failed, or removed an already null image)
      // Or if no data fields were provided other than the URI fields which resolved to no change
      // We should still return success if image operations occurred and were logged, but maybe with current profile
      // For now, let's just return the current profile if no actual DB fields changed other than updated_at
      logger.info(`No actual data fields to update for user ID: ${user.id}, other than potentially images. Returning current profile if fetched.`);
      const { data: currentProfileForReturn, error: fetchErrorForReturn } = await supabase.from("profiles").select().eq("id", user.id).single();
      if (fetchErrorForReturn) {
        logger.error(`Error fetching profile for no-op update return for user ${user.id}`, { error: fetchErrorForReturn.message });
        return { error: "Profile update attempted, but no changes made and failed to re-fetch profile." };
      }
      if (currentProfileForReturn) {
        const mappedProfile = {
            id: currentProfileForReturn.id, email: user.email, firstName: currentProfileForReturn.first_name,
            lastName: currentProfileForReturn.last_name, gender: currentProfileForReturn.gender,
            ageCategory: currentProfileForReturn.age_category, specificAge: currentProfileForReturn.specific_age,
            language: currentProfileForReturn.language, avatarUrl: currentProfileForReturn.avatar_url,
            bannerUrl: currentProfileForReturn.banner_img_url, // Correct mapping
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
            return { data: validatedProfile.data };
        }
      }
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

  // Map back to camelCase for consistency with UserProfileSchema
  const resultProfile: UserProfile = {
    id: updatedProfile.id,
    email: user.email,
    firstName: updatedProfile.first_name,
    lastName: updatedProfile.last_name,
    gender: updatedProfile.gender,
    ageCategory: updatedProfile.age_category,
    specificAge: updatedProfile.specific_age,
    language: updatedProfile.language,
    avatarUrl: updatedProfile.avatar_url,
    bannerUrl: updatedProfile.banner_img_url, // Corrected from bannerImgUrl
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
