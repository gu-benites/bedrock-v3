// src/features/user-auth-data/utils/profile-image.utils.ts

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Logger as WinstonLogger } from 'winston';

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
}

/**
 * Internal helper to process image upload or removal for avatar or banner.
 * Relies on upsert:true for replacing images with the same path.
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
    
    // Note: Explicit deletion of old image before upload is removed here.
    // Relying on upsert:true. If file extension changes, old file with old extension might be orphaned.

    try {
      const mimeTypeMatch = dataUri.match(/^data:(image\/(png|jpeg|webp));base64,/);
      if (!mimeTypeMatch || !mimeTypeMatch[1] || !mimeTypeMatch[2]) {
        loggerInstance.error(`[handleImageProcessing] Invalid ${imageType} Data URI format or unsupported type. User: ${userId}.`);
        throw new Error(`Invalid ${imageType} Data URI format or unsupported image type.`);
      }
      const contentType = mimeTypeMatch[1];
      const fileExtension = mimeTypeMatch[2];
      loggerInstance.info(`[handleImageProcessing] Parsed ${imageType}. ContentType: ${contentType}, Extension: ${fileExtension}. User: ${userId}`);
      
      const base64Data = dataUri.split(';base64,').pop();
      if (!base64Data) {
        loggerInstance.error(`[handleImageProcessing] Invalid ${imageType} Data URI (missing base64 data). User: ${userId}`);
        throw new Error(`Invalid ${imageType} Data URI format (missing base64 data).`);
      }
      loggerInstance.info(`[handleImageProcessing] Extracted base64 data for ${imageType}. Length: ${base64Data.length}. User: ${userId}`);
      
      const buffer = Buffer.from(base64Data, 'base64');
      const filePath = `${baseFolderPath}/${userId}.${fileExtension}`;
      loggerInstance.info(`[handleImageProcessing] Determined filePath for ${imageType}: ${filePath}. User: ${userId}`);
      
      loggerInstance.info(`[handleImageProcessing] Attempting to upload new ${imageType} to Supabase Storage. User: ${userId}`, { filePath, contentType, bufferLength: buffer.length });

      const { data: uploadDataResponse, error: uploadError } = await supabase.storage
        .from('profiles') 
        .upload(filePath, buffer, {
          cacheControl: '3600',
          upsert: true, 
          contentType: contentType,
        });

      if (uploadError) {
        loggerInstance.error(`[handleImageProcessing] Supabase storage.upload ERROR for ${imageType}. User: ${userId}`, { filePath, errorName: uploadError.name, errorMessage: uploadError.message, stack: uploadError.stack });
        return { error: `Failed to upload ${imageType}: ${uploadError.message}` };
      }
      loggerInstance.info(`[handleImageProcessing] Supabase storage.upload SUCCESS for ${imageType}. User: ${userId}`, { uploadDataResponse });

      loggerInstance.info(`[handleImageProcessing] Getting public URL for ${imageType}. Path: ${filePath}. User: ${userId}`);
      const { data: publicUrlData } = supabase.storage.from('profiles').getPublicUrl(filePath);
      if (publicUrlData?.publicUrl) {
        loggerInstance.info(`[handleImageProcessing] ${imageType} public URL retrieved successfully: ${publicUrlData.publicUrl}. User: ${userId}`);
        return { newImageUrl: publicUrlData.publicUrl };
      } else {
        loggerInstance.warn(`[handleImageProcessing] Failed to get public URL for new ${imageType}. User: ${userId}, Path: ${filePath}`);
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
      loggerInstance.info(`[handleImageProcessing] Attempting to remove existing ${imageType} from storage. Path: ${currentImagePathInStorage}. User: ${userId}`);
      const { error: deleteExistingImageError } = await supabase.storage
        .from('profiles') 
        .remove([currentImagePathInStorage]);
      if (deleteExistingImageError) {
        loggerInstance.warn(`[handleImageProcessing] Failed to remove existing ${imageType} from storage. User: ${userId}`, { path: currentImagePathInStorage, error: deleteExistingImageError.message });
        return { error: `Failed to remove existing ${imageType} from storage. DB update for this image aborted.` };
      } else {
        loggerInstance.info(`[handleImageProcessing] Successfully removed existing ${imageType} from storage. Path: ${currentImagePathInStorage}. User: ${userId}`);
        return { newImageUrl: null }; 
      }
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
