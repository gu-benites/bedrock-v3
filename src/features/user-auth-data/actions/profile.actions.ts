// src/features/user-auth-data/actions/profile.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { UserProfileSchema, type UserProfile } from "../schemas/profile.schema";
import { getServerLogger } from '@/lib/logger'; // Re-added import
import { type ImageProcessingError } from "../utils/profile-image.utils";

const logger = getServerLogger('ProfileActions'); // Enhanced logger name

// Enhanced error types for better frontend consumption
export interface ProfileActionError {
  code: 'AUTH_ERROR' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'NOT_FOUND' | 'IMAGE_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details?: any;
  field?: string; // For field-specific errors
}

// Enhanced result interfaces
interface UpdateProfileTextResult {
  data?: UserProfile;
  error?: string;
  errorDetails?: ProfileActionError;
}

interface UpdateProfileImageResult {
  data?: UserProfile;
  error?: string;
  errorDetails?: ProfileActionError | ImageProcessingError;
}

// Utility function to create structured errors
function createProfileError(
  code: ProfileActionError['code'],
  message: string,
  details?: any,
  field?: string
): ProfileActionError {
  return { code, message, details, field };
}

// Enhanced error handling wrapper
async function handleProfileAction<T>(
  actionName: string,
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`[${actionName}] Unexpected error`, { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });

    // Re-throw with enhanced error information
    throw createProfileError(
      'UNKNOWN_ERROR',
      `An unexpected error occurred during ${actionName}: ${errorMessage}`,
      { originalError: errorMessage }
    );
  }
}

// Define the type for data specifically for text details
type UpdateProfileTextData = Pick<
  Partial<UserProfile>, 
  'firstName' | 'lastName' | 'gender' | 'ageCategory' | 'specificAge' | 'language' | 'bio'
>;


export async function updateProfileTextDetails(
  data: UpdateProfileTextData
): Promise<UpdateProfileTextResult> {
  return handleProfileAction('updateProfileTextDetails', async () => {
    logger.info("updateProfileTextDetails action started.", { providedFields: Object.keys(data) });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      const errorDetails = createProfileError(
        'AUTH_ERROR',
        'Authentication failed. Please log in again.',
        { originalError: authError.message }
      );
      logger.error("Authentication error.", errorDetails);
      return { error: errorDetails.message, errorDetails };
    }

    if (!user) {
      const errorDetails = createProfileError(
        'AUTH_ERROR',
        'User not authenticated. Please log in.',
        { context: 'updateProfileTextDetails' }
      );
      logger.warn("No authenticated user found.", errorDetails);
      return { error: errorDetails.message, errorDetails };
    }

  const userDataToUpdate: Record<string, any> = {};

  // Map camelCase form field names to snake_case database column names
  if (data.firstName !== undefined) userDataToUpdate.first_name = data.firstName;
  if (data.lastName !== undefined) userDataToUpdate.last_name = data.lastName;
  if (data.gender !== undefined) userDataToUpdate.gender = data.gender;
  if (data.ageCategory !== undefined) userDataToUpdate.age_category = data.ageCategory;
  if (data.specificAge !== undefined) userDataToUpdate.specific_age = data.specificAge;
  if (data.language !== undefined) userDataToUpdate.language = data.language;
  if (data.bio !== undefined) userDataToUpdate.bio = data.bio;

    if (Object.keys(userDataToUpdate).length === 0) {
      logger.info(`No text details to update for user ID: ${user.id}. Fetching current profile.`);
      // Fetch current profile to return if no changes.
      const { data: currentProfileData, error: fetchError } = await supabase.from("profiles").select().eq("id", user.id).single();
      if (fetchError && fetchError.code !== 'PGRST116') {
        const errorDetails = createProfileError(
          'DATABASE_ERROR',
          'Failed to fetch current profile data.',
          { originalError: fetchError.message, userId: user.id }
        );
        logger.error(`Error fetching profile for no-op update return for user ${user.id}`, errorDetails);
        return { error: errorDetails.message, errorDetails };
      }

      if (!currentProfileData) {
        const errorDetails = createProfileError(
          'NOT_FOUND',
          'User profile not found.',
          { userId: user.id, context: 'no-op update' }
        );
        logger.error(`Could not find profile for user ${user.id} after no-op text update.`, errorDetails);
        return { error: errorDetails.message, errorDetails };
      }
    const mappedProfile: UserProfile = { /* map all fields */
        id: currentProfileData.id, email: user.email || '', firstName: currentProfileData.first_name,
        lastName: currentProfileData.last_name, gender: currentProfileData.gender,
        ageCategory: currentProfileData.age_category, specificAge: currentProfileData.specific_age,
        language: currentProfileData.language, avatarUrl: currentProfileData.avatar_url,
        bannerUrl: currentProfileData.banner_img_url, bio: currentProfileData.bio, role: currentProfileData.role,
        stripeCustomerId: currentProfileData.stripe_customer_id, subscriptionStatus: currentProfileData.subscription_status,
        subscriptionTier: currentProfileData.subscription_tier, subscriptionPeriod: currentProfileData.subscription_period,
        subscriptionStartDate: currentProfileData.subscription_start_date, subscriptionEndDate: currentProfileData.subscription_end_date,
        createdAt: currentProfileData.created_at, updatedAt: currentProfileData.updated_at,
    };
      const validatedProfile = UserProfileSchema.safeParse(mappedProfile);
      if (validatedProfile.success) {
        return { data: validatedProfile.data };
      } else {
        const errorDetails = createProfileError(
          'VALIDATION_ERROR',
          'Current profile data is invalid.',
          { validationErrors: validatedProfile.error.flatten(), userId: user.id }
        );
        logger.error(`Fetched current profile for no-op text update for user ${user.id}, but it failed validation.`, errorDetails);
        return { error: errorDetails.message, errorDetails };
      }
    }
  
    userDataToUpdate.updated_at = new Date().toISOString();

    logger.info(`Attempting to update profile text details in DB for user ID: ${user.id}`, { fieldsToUpdate: Object.keys(userDataToUpdate) });

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(userDataToUpdate)
      .eq("id", user.id)
      .select() // Select all fields to return the full profile
      .single();

    if (updateError) {
      const errorDetails = createProfileError(
        'DATABASE_ERROR',
        'Failed to update profile in database.',
        { originalError: updateError.message, userId: user.id, fieldsToUpdate: Object.keys(userDataToUpdate) }
      );
      logger.error(`Failed to update profile text details in DB for user ID: ${user.id}`, errorDetails);
      return { error: errorDetails.message, errorDetails };
    }

    if (!updatedProfile) {
      const errorDetails = createProfileError(
        'DATABASE_ERROR',
        'Profile update completed but no data was returned.',
        { userId: user.id, fieldsToUpdate: Object.keys(userDataToUpdate) }
      );
      logger.error(`Profile text details DB update for user ID: ${user.id} did not return data.`, errorDetails);
      return { error: errorDetails.message, errorDetails };
    }

  // Map back to UserProfile type (camelCase)
  const resultProfile: UserProfile = {
    id: updatedProfile.id,
    email: user.email || '', // Email from auth user
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
      const errorDetails = createProfileError(
        'VALIDATION_ERROR',
        'Updated profile data failed validation.',
        { validationErrors: validationResult.error.flatten(), userId: user.id }
      );
      logger.error('Updated profile text data failed validation after mapping.', errorDetails);
      return { error: errorDetails.message, errorDetails };
    }

    logger.info(`Profile text details updated successfully for user ID: ${user.id}`);
    return { data: validationResult.data };
  });
}


