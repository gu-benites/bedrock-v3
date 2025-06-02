// src/features/user-auth-data/actions/utils/profile-image.utils.ts
"use server";

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Logger as WinstonLogger } from 'winston';

/**
 * Extracts the storage path from a Supabase public URL.
 */
export function getStoragePathFromUrl(publicUrl: string, bucketName: string, loggerInstance: WinstonLogger): string | null {
  try {
    const url = new URL(publicUrl);
    // Pathname might be like /storage/v1/object/public/bucketName/folder/file.png
    const pathSegments = url.pathname.split('/'); 
    const bucketIndex = pathSegments.indexOf(bucketName);
    if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
      // Join all segments after the bucket name
      return pathSegments.slice(bucketIndex + 1).join('/');
    }
    loggerInstance.warn('Could not find bucket name in public URL path', { publicUrl, bucketName });
    return null;
  } catch (e) {
    loggerInstance.warn('Failed to parse URL for storage path extraction', { publicUrl, error: (e as Error).message });
    return null;
  }
}

interface ProcessImageOptions {
  supabase: SupabaseClient;
  userId: string;
  dataUri: string | null | undefined; // Can be new image data, null for removal, or undefined for no change
  currentImagePathInStorage: string | null; // DB current path (e.g. "avatars/userid.png")
  imageType: 'avatar' | 'banner';
  baseFolderPath: 'avatars' | 'banners';
  loggerInstance: WinstonLogger;
}

export interface ProcessImageResult {
  newImageUrl?: string | null; // string if uploaded, null if removed, undefined if no change/non-critical error
  error?: string; // Critical error message for this image
}

/**
 * Internal helper to process image upload or removal for avatar or banner.
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
  loggerInstance.info(`Processing ${imageType} for user ID: ${userId}. DataURI provided: ${!!dataUri}, current DB path: ${currentImagePathInStorage}`);

  // Case 1: New image data URI is provided (upload or replace)
  if (typeof dataUri === 'string' && dataUri.startsWith('data:image')) {
    loggerInstance.info(`New ${imageType} DataURI received for user ${userId}. Length: ${dataUri.length}`);
    if (currentImagePathInStorage) {
      loggerInstance.info(`Attempting to delete old ${imageType} for user ID: ${userId}`, { path: currentImagePathInStorage });
      const { error: deleteOldImageError } = await supabase.storage
        .from('profiles') // Assuming 'profiles' is your bucket name
        .remove([currentImagePathInStorage]);
      if (deleteOldImageError) {
        loggerInstance.warn(`Failed to delete old ${imageType} for user ID: ${userId}`, { path: currentImagePathInStorage, error: deleteOldImageError.message });
        // Non-critical, proceed with upload
      } else {
        loggerInstance.info(`Successfully deleted old ${imageType} for user ID: ${userId}`, { path: currentImagePathInStorage });
      }
    }

    try {
      const mimeTypeMatch = dataUri.match(/^data:(image\/(png|jpeg|webp));base64,/);
      if (!mimeTypeMatch || !mimeTypeMatch[1] || !mimeTypeMatch[2]) {
        throw new Error(`Invalid ${imageType} Data URI format or unsupported image type.`);
      }
      const contentType = mimeTypeMatch[1];
      const fileExtension = mimeTypeMatch[2];
      
      const base64Data = dataUri.split(';base64,').pop();
      if (!base64Data) throw new Error(`Invalid ${imageType} Data URI format (missing base64 data).`);
      
      const buffer = Buffer.from(base64Data, 'base64');
      const filePath = `${baseFolderPath}/${userId}.${fileExtension}`;
      
      loggerInstance.info(`Attempting to upload new ${imageType} for user ID: ${userId}`, { filePath, contentType, bufferLength: buffer.length });

      const { data: uploadDataResponse, error: uploadError } = await supabase.storage
        .from('profiles') // Assuming 'profiles' is your bucket name
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
        .from('profiles') // Assuming 'profiles' is your bucket name
        .remove([currentImagePathInStorage]);
      if (deleteExistingImageError) {
        loggerInstance.warn(`Failed to remove existing ${imageType} from storage for user ID: ${userId}`, { path: currentImagePathInStorage, error: deleteExistingImageError.message });
        // Potentially critical if DB update expects storage removal to succeed.
        // For now, let's make it critical to ensure DB and storage are in sync.
        return { error: `Failed to remove existing ${imageType} from storage. DB update for this image aborted.` };
      } else {
        loggerInstance.info(`Successfully removed existing ${imageType} from storage for user ID: ${userId}`, { path: currentImagePathInStorage });
        return { newImageUrl: null }; // Signal DB field should be set to null
      }
    } else {
      loggerInstance.info(`No existing ${imageType} in DB path to remove from storage for user ${userId}.`);
      return { newImageUrl: null }; // Still signal DB field should be null as removal was intended
    }
  }
  // Case 3: No change actioned for this image (dataUri is undefined or empty string, etc.)
  else {
    loggerInstance.info(`No action required for ${imageType} for user ID: ${userId} (dataUri is undefined or not a new image string).`);
    return {}; // No new URL, no removal, no error for this image
  }
}
