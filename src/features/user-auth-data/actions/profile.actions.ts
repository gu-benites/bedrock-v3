// src/features/user-auth-data/actions/profile.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { UserProfileSchema, type UserProfile } from "../schemas/profile.schema";
import { getServerLogger } from '@/lib/logger'; // Re-added import

const logger = getServerLogger('UpdateProfileTextAction'); // Re-added instantiation

interface UpdateProfileTextResult {
  data?: UserProfile;
  error?: string;
}

// Define the type for data specifically for text details
type UpdateProfileTextData = Pick<
  Partial<UserProfile>, 
  'firstName' | 'lastName' | 'gender' | 'ageCategory' | 'specificAge' | 'language' | 'bio'
>;


export async function updateProfileTextDetails(
  data: UpdateProfileTextData
): Promise<UpdateProfileTextResult> {
  logger.info("updateProfileTextDetails action started.", { providedFields: Object.keys(data) }); // Uncommented logger call

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    logger.error("Authentication error.", { error: authError.message }); // Uncommented logger call
    return { error: `Authentication error: ${authError.message}` };
  }
  if (!user) {
    logger.warn("No authenticated user found."); // Uncommented logger call
    return { error: "User not authenticated." };
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
    logger.info(`No text details to update for user ID: ${user.id}. Fetching current profile.`); // Uncommented logger call
    // Fetch current profile to return if no changes.
    const { data: currentProfileData, error: fetchError } = await supabase.from("profiles").select().eq("id", user.id).single();
    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error(`Error fetching profile for no-op update return for user ${user.id}`, { error: fetchError.message }); // Uncommented logger call
      return { error: "No changes made and failed to re-fetch profile." };
    }
     if (!currentProfileData) { // Should not happen if user exists and profile is expected
        logger.error(`Could not find profile for user ${user.id} after no-op text update.`); // Uncommented logger call
        return { error: "User profile not found." };
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
      logger.error(`Fetched current profile for no-op text update for user ${user.id}, but it failed validation.`, { errors: validatedProfile.error.flatten() }); // Uncommented logger call
      return { error: "Failed to retrieve a valid current profile after no-op text update." };
    }
  }
  
  userDataToUpdate.updated_at = new Date().toISOString();

  logger.info(`Attempting to update profile text details in DB for user ID: ${user.id}`, { fieldsToUpdate: Object.keys(userDataToUpdate) }); // Uncommented logger call

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update(userDataToUpdate)
    .eq("id", user.id)
    .select() // Select all fields to return the full profile
    .single();

  if (updateError) {
    logger.error(`Failed to update profile text details in DB for user ID: ${user.id}`, { error: updateError.message }); // Uncommented logger call
    return { error: `Failed to update profile: ${updateError.message}` };
  }

  if (!updatedProfile) {
    logger.error(`Profile text details DB update for user ID: ${user.id} did not return data.`); // Uncommented logger call
    return { error: "Profile update failed to return data." };
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
      logger.error('Updated profile text data failed validation after mapping.', { errors: validationResult.error.flatten() }); // Uncommented logger call
      return { error: 'Updated profile text data is invalid.' };
  }

  logger.info(`Profile text details updated successfully for user ID: ${user.id}`); // Uncommented logger call
  return { data: validationResult.data };
}
