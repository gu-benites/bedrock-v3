// src/features/user-auth-data/utils/profile-image.utils.ts

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Logger as WinstonLogger } from 'winston';

// Configuration constants for image processing
export const IMAGE_PROCESSING_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_TYPES: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  UPLOAD_TIMEOUT: 30000, // 30 seconds
} as const;

export type SupportedImageType = typeof IMAGE_PROCESSING_CONFIG.SUPPORTED_TYPES[number];

// Enhanced error types for better error handling
export interface ImageProcessingError {
  code: 'INVALID_FORMAT' | 'FILE_TOO_LARGE' | 'UNSUPPORTED_TYPE' | 'UPLOAD_FAILED' | 'REMOVAL_FAILED' | 'NETWORK_ERROR';
  message: string;
  details?: any;
}

// Utility function to create structured errors
export function createImageError(code: ImageProcessingError['code'], message: string, details?: any): ImageProcessingError {
  return { code, message, details };
}

// Sleep utility for retry logic
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extracts the storage path from a Supabase public URL.
 */
export function getStoragePathFromUrl(publicUrl: string, bucketName: string, loggerInstance: WinstonLogger): string | null {
  try {
    const url = new URL(publicUrl);
    const pathSegments = url.pathname.split('/');
    const bucketIndex = pathSegments.indexOf(bucketName);
    if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
      return pathSegments.slice(bucketIndex + 1).join('/');
    }
    loggerInstance.warn('[getStoragePathFromUrl] Could not find bucket name in public URL path', { publicUrl, bucketName });
    return null;
  } catch (e) {
    loggerInstance.warn('[getStoragePathFromUrl] Failed to parse URL for storage path extraction', { publicUrl, error: (e as Error).message });
    return null;
  }
}

interface ProcessImageOptions {
  supabase: SupabaseClient;
  userId: string;
  dataUri: string | null | undefined; 
  currentImagePathInStorage: string | null; 
  imageType: 'avatar' | 'banner';
  baseFolderPath: 'avatars' | 'banners';
  loggerInstance: WinstonLogger;
}

export interface ProcessImageResult {
  newImageUrl?: string | null;
  error?: string;
  errorDetails?: ImageProcessingError;
}

/**
 * Retry wrapper for async operations with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = IMAGE_PROCESSING_CONFIG.RETRY_ATTEMPTS,
  baseDelay: number = IMAGE_PROCESSING_CONFIG.RETRY_DELAY,
  loggerInstance: WinstonLogger,
  operationName: string
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      loggerInstance.warn(`[withRetry] ${operationName} attempt ${attempt}/${maxAttempts} failed`, {
        error: lastError.message,
        attempt,
        maxAttempts
      });

      if (attempt === maxAttempts) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Internal helper to process image upload or removal for avatar or banner,
 * explicitly handling the deletion of the old image when a new one is uploaded.
 * Explicitly deletes from storage if dataUri is null and currentImagePathInStorage exists.
 */
export async function handleImageProcessing({
  supabase,
  userId,
  dataUri,
  currentImagePathInStorage,
  imageType,
  baseFolderPath,
  loggerInstance,
}: ProcessImageOptions): Promise<ProcessImageResult> {
  loggerInstance.info(`[handleImageProcessing] Start. User: ${userId}, Type: ${imageType}, DataURI provided: ${!!dataUri}, CurrentPath: ${currentImagePathInStorage}`);

  // Case 1: New image data URI is provided (upload or replace)
  if (typeof dataUri === 'string' && dataUri.startsWith('data:image')) {
    loggerInstance.info(`[handleImageProcessing] New ${imageType} DataURI received. User: ${userId}. DataURI (first 50 chars): ${dataUri.substring(0,50)}...`);
    
    // Explicitly delete the old image if it exists
    if (currentImagePathInStorage) {
      loggerInstance.info(`[handleImageProcessing] Attempting to remove existing ${imageType} from storage before upload. Path: ${currentImagePathInStorage}. User: ${userId}`);
      const { error: deleteExistingImageError } = await supabase.storage
        .from('profiles')
        .remove([currentImagePathInStorage]);

      if (deleteExistingImageError) {
        // Log a warning but don't block the new upload
        loggerInstance.warn(`[handleImageProcessing] Failed to remove old ${imageType} from storage before uploading new one. User: ${userId}`, { path: currentImagePathInStorage, error: deleteExistingImageError.message });
      } else {
        loggerInstance.info(`[handleImageProcessing] Successfully removed existing ${imageType} from storage before upload. Path: ${currentImagePathInStorage}. User: ${userId}`);
      }
    }
    try {
      // Enhanced validation with support for gif
      const mimeTypeMatch = dataUri.match(/^data:(image\/(png|jpeg|webp|gif));base64,/);
      if (!mimeTypeMatch || !mimeTypeMatch[1] || !mimeTypeMatch[2]) {
        const errorDetails = createImageError(
          'INVALID_FORMAT',
          `Invalid ${imageType} Data URI format or unsupported image type. Supported types: png, jpeg, webp, gif`,
          { dataUriPrefix: dataUri.substring(0, 50) }
        );
        loggerInstance.error(`[handleImageProcessing] ${errorDetails.message}. User: ${userId}`, errorDetails.details);
        return { error: errorDetails.message, errorDetails };
      }
      const contentType = mimeTypeMatch[1] as SupportedImageType;
      const fileExtension = mimeTypeMatch[2];
      loggerInstance.info(`[handleImageProcessing] Parsed ${imageType}. ContentType: ${contentType}, Extension: ${fileExtension}. User: ${userId}`);

      const base64Data = dataUri.split(';base64,').pop();
      if (!base64Data) {
        const errorDetails = createImageError(
          'INVALID_FORMAT',
          `Invalid ${imageType} Data URI format (missing base64 data)`,
          { dataUriPrefix: dataUri.substring(0, 50) }
        );
        loggerInstance.error(`[handleImageProcessing] ${errorDetails.message}. User: ${userId}`, errorDetails.details);
        return { error: errorDetails.message, errorDetails };
      }
      loggerInstance.info(`[handleImageProcessing] Extracted base64 data for ${imageType}. Length: ${base64Data.length}. User: ${userId}`);

      const buffer = Buffer.from(base64Data, 'base64');

      // Validate file size
      if (buffer.length > IMAGE_PROCESSING_CONFIG.MAX_FILE_SIZE) {
        const errorDetails = createImageError(
          'FILE_TOO_LARGE',
          `${imageType} file size (${Math.round(buffer.length / 1024 / 1024 * 100) / 100}MB) exceeds maximum allowed size (${IMAGE_PROCESSING_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB)`,
          { fileSize: buffer.length, maxSize: IMAGE_PROCESSING_CONFIG.MAX_FILE_SIZE }
        );
        loggerInstance.error(`[handleImageProcessing] ${errorDetails.message}. User: ${userId}`, errorDetails.details);
        return { error: errorDetails.message, errorDetails };
      }
      // Keep the same path structure, relying on the explicit deletion to clear the old file
      // with potentially a different extension.
      const filePath = `${baseFolderPath}/${userId}.${fileExtension}`;
      loggerInstance.info(`[handleImageProcessing] Determined filePath for new ${imageType}: ${filePath}. User: ${userId}`);
      loggerInstance.info(`[handleImageProcessing] Attempting to upload new ${imageType} to Supabase Storage with retry logic. User: ${userId}`, { filePath, contentType, bufferLength: buffer.length });

      // Upload with retry logic
      const uploadResult = await withRetry(
        async () => {
          const { data: uploadDataResponse, error: uploadError } = await supabase.storage
            .from('profiles')
            .upload(filePath, buffer, {
              cacheControl: '3600',
              upsert: true,
              contentType: contentType,
            });

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }

          return uploadDataResponse;
        },
        IMAGE_PROCESSING_CONFIG.RETRY_ATTEMPTS,
        IMAGE_PROCESSING_CONFIG.RETRY_DELAY,
        loggerInstance,
        `${imageType} upload`
      ).catch((error) => {
        const errorDetails = createImageError(
          'UPLOAD_FAILED',
          `Failed to upload ${imageType} after ${IMAGE_PROCESSING_CONFIG.RETRY_ATTEMPTS} attempts: ${error.message}`,
          { filePath, contentType, bufferLength: buffer.length, originalError: error.message }
        );
        loggerInstance.error(`[handleImageProcessing] ${errorDetails.message}. User: ${userId}`, errorDetails.details);
        return { error: errorDetails.message, errorDetails };
      });

      // Check if upload failed
      if (uploadResult && 'error' in uploadResult) {
        return uploadResult;
      }

      loggerInstance.info(`[handleImageProcessing] Supabase storage.upload SUCCESS for ${imageType}. User: ${userId}`, { uploadResult });

      loggerInstance.info(`[handleImageProcessing] Getting public URL for ${imageType}. Path: ${filePath}. User: ${userId}`);
      const { data: publicUrlData } = supabase.storage.from('profiles').getPublicUrl(filePath);
      if (publicUrlData?.publicUrl) {
        loggerInstance.info(`[handleImageProcessing] ${imageType} public URL retrieved successfully: ${publicUrlData.publicUrl}. User: ${userId}`);
        return { newImageUrl: publicUrlData.publicUrl };
      }  else {
        loggerInstance.warn(`[handleImageProcessing] Failed to get public URL for new ${imageType}. User: ${userId}, Path: ${filePath}`);
        // This is an unusual state, but the file should still be uploaded.
        // We might return an error or a specific status to indicate this.
        return { error: `Uploaded ${imageType}, but failed to get public URL.` };
      }
    } catch (uploadCatchError: any) {
      loggerInstance.error(`[handleImageProcessing] ${imageType} upload process caught error. User: ${userId}`, { errorName: uploadCatchError.name, errorMessage: uploadCatchError.message, stack: uploadCatchError.stack });
      return { error: `Failed to upload ${imageType}: ${uploadCatchError.message}` };
    }
  }
  // Case 2: Image explicitly marked for removal (dataUri is null)
  else if (dataUri === null) {
    loggerInstance.info(`[handleImageProcessing] ${imageType} marked for removal (dataUri is null). User: ${userId}`);
    if (currentImagePathInStorage) {
      loggerInstance.info(`[handleImageProcessing] Attempting to remove existing ${imageType} from storage with retry logic. Path: ${currentImagePathInStorage}. User: ${userId}`);

      // Remove with retry logic
      const removeResult = await withRetry(
        async () => {
          const { error: deleteExistingImageError } = await supabase.storage
            .from('profiles')
            .remove([currentImagePathInStorage]);

          if (deleteExistingImageError) {
            throw new Error(`Removal failed: ${deleteExistingImageError.message}`);
          }

          return true;
        },
        IMAGE_PROCESSING_CONFIG.RETRY_ATTEMPTS,
        IMAGE_PROCESSING_CONFIG.RETRY_DELAY,
        loggerInstance,
        `${imageType} removal`
      ).catch((error) => {
        const errorDetails = createImageError(
          'REMOVAL_FAILED',
          `Failed to remove existing ${imageType} from storage after ${IMAGE_PROCESSING_CONFIG.RETRY_ATTEMPTS} attempts: ${error.message}`,
          { path: currentImagePathInStorage, originalError: error.message }
        );
        loggerInstance.error(`[handleImageProcessing] ${errorDetails.message}. User: ${userId}`, errorDetails.details);
        return { error: errorDetails.message, errorDetails };
      });

      // Check if removal failed
      if (removeResult && typeof removeResult === 'object' && 'error' in removeResult) {
        return removeResult;
      }

      loggerInstance.info(`[handleImageProcessing] Successfully removed existing ${imageType} from storage. Path: ${currentImagePathInStorage}. User: ${userId}`);
      return { newImageUrl: null };
    } else {
      loggerInstance.info(`[handleImageProcessing] No existing ${imageType} path in DB to remove from storage. User: ${userId}`);
      return { newImageUrl: null };
    }
  }
  // Case 3: No change actioned for this image (dataUri is undefined or empty string, etc.)
  else {
    loggerInstance.info(`[handleImageProcessing] No action required for ${imageType}. User: ${userId} (dataUri is undefined or not a new image string).`);
    return {}; 
  }
}
