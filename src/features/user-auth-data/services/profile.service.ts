'use server';

import { createClient } from '@/lib/supabase/server';
import { getServerLogger } from '@/lib/logger';
import { cache } from 'react';
import { type UserProfile } from '../schemas/profile.schema';

const logger = getServerLogger('ProfileService');

/**
 * Cached server function to get user profile
 * Uses React cache() to deduplicate requests within the same render cycle
 * 
 * Note: All warn/error level logs are automatically sent to Sentry
 * via the SentryWinstonTransport configured in winston.config.ts
 */
export const getCurrentUserProfile = cache(async (userId: string): Promise<UserProfile | null> => {
  if (!userId) {
    logger.info('Profile fetch attempted with no userId', {
      operation: 'getCurrentUserProfile'
    });
    return null;
  }
  
  try {
    const supabase = await createClient();
    
    // Fetch profile data from the 'profiles' table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      // Mask userId for privacy in logs
      const maskedUserId = `${userId.substring(0, 6)}...`;
      
      logger.warn('Error fetching user profile', {
        userId: maskedUserId,
        error: profileError.message,
        code: profileError.code,
        operation: 'getCurrentUserProfile'
      });
      return null;
    }
    
    // Get user email from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      const maskedUserId = `${userId.substring(0, 6)}...`;
      logger.warn('Error fetching auth user for profile', {
        userId: maskedUserId,
        error: authError.message,
        operation: 'getCurrentUserProfile'
      });
      return null;
    }
    
    if (!profileData) {
      const maskedUserId = `${userId.substring(0, 6)}...`;
      logger.info('No profile data found for user', {
        userId: maskedUserId,
        operation: 'getCurrentUserProfile'
      });
      return null;
    }
    
    // Combine data into UserProfile format
    const combinedProfile: UserProfile = {
      id: userId,
      email: user?.email || null,
      firstName: profileData.first_name || null,
      lastName: profileData.last_name || null,
      gender: profileData.gender || null,
      ageCategory: profileData.age_category || null,
      specificAge: profileData.specific_age || null,
      language: profileData.language || 'en',
      avatarUrl: profileData.avatar_url || null,
      bannerUrl: profileData.banner_img_url || null,
      bio: profileData.bio || null,
      role: profileData.role || 'user',
      stripeCustomerId: profileData.stripe_customer_id || null,
      subscriptionStatus: profileData.subscription_status || null,
      subscriptionTier: profileData.subscription_tier || null,
      subscriptionPeriod: profileData.subscription_period || null,
      subscriptionStartDate: profileData.subscription_start_date || null,
      subscriptionEndDate: profileData.subscription_end_date || null,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at
    };
    
    // Mask userId for privacy in logs
    const maskedUserId = `${userId.substring(0, 6)}...`;
    logger.info('Profile fetched successfully', {
      userId: maskedUserId,
      operation: 'getCurrentUserProfile',
      hasData: !!combinedProfile
    });
    
    return combinedProfile;
  } catch (err) {
    // Mask userId for privacy in logs
    const maskedUserId = `${userId.substring(0, 6)}...`;
    
    logger.error('Critical error fetching user profile', {
      userId: maskedUserId,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      operation: 'getCurrentUserProfile'
    });
    return null;
  }
});

/**
 * Get user profile by user ID with proper error handling and caching
 * This function is designed to work with the existing profile query patterns
 */
export const getUserProfile = cache(async (userId: string): Promise<UserProfile | null> => {
  return getCurrentUserProfile(userId);
});
