'use server';

import { getCurrentUserProfile } from '../services/profile.service';
import { type UserProfile } from '../schemas/profile.schema';

/**
 * Optimized server action to get user profile by ID
 * Uses the cached profile service for efficient data fetching
 * Designed to work as a queryFn for TanStack Query
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return getCurrentUserProfile(userId);
}

/**
 * Server action to get the currently authenticated user's profile
 * This maintains compatibility with existing query patterns
 */
export async function getCurrentUserProfileOptimized(): Promise<UserProfile | null> {
  // This will be called by the client-side hook which will provide the userId
  // For now, we'll throw an error to indicate this should be called with a userId
  throw new Error('getCurrentUserProfileOptimized should be called with a specific userId. Use getUserProfile(userId) instead.');
}
