// src/features/user-auth-data/utils/error-messages.utils.ts

import { type ProfileActionError } from '../actions/profile.actions';

/**
 * Get user-friendly error message for profile action errors
 */
export function getProfileActionErrorMessage(error: ProfileActionError): string {
  switch (error.code) {
    case 'AUTH_ERROR':
      return 'Authentication failed. Please log in again.';
    case 'VALIDATION_ERROR':
      if (error.field) {
        return `Invalid ${error.field}. Please check your input and try again.`;
      }
      return 'Invalid data provided. Please check your input and try again.';
    case 'DATABASE_ERROR':
      return 'A database error occurred. Please try again later.';
    case 'NOT_FOUND':
      return 'Profile not found. Please refresh the page and try again.';
    case 'IMAGE_ERROR':
      return 'Image processing failed. Please try a different image.';
    case 'NETWORK_ERROR':
      return 'Network error occurred. Please check your connection and try again.';
    case 'UNKNOWN_ERROR':
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
}
