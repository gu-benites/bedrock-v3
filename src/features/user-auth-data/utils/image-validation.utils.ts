// src/features/user-auth-data/utils/image-validation.utils.ts

import { IMAGE_PROCESSING_CONFIG, type SupportedImageType, createImageError, type ImageProcessingError } from './profile-image.utils';

export interface ImageValidationResult {
  isValid: boolean;
  error?: ImageProcessingError;
  metadata?: {
    size: number;
    type: string;
    dimensions?: { width: number; height: number };
  };
}

/**
 * Validates a File object for image upload
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check file type
  if (!IMAGE_PROCESSING_CONFIG.SUPPORTED_TYPES.includes(file.type as SupportedImageType)) {
    return {
      isValid: false,
      error: createImageError(
        'UNSUPPORTED_TYPE',
        `Unsupported file type: ${file.type}. Supported types: ${IMAGE_PROCESSING_CONFIG.SUPPORTED_TYPES.join(', ')}`,
        { fileType: file.type, supportedTypes: IMAGE_PROCESSING_CONFIG.SUPPORTED_TYPES }
      )
    };
  }

  // Check file size
  if (file.size > IMAGE_PROCESSING_CONFIG.MAX_FILE_SIZE) {
    const fileSizeMB = Math.round(file.size / 1024 / 1024 * 100) / 100;
    const maxSizeMB = IMAGE_PROCESSING_CONFIG.MAX_FILE_SIZE / 1024 / 1024;
    
    return {
      isValid: false,
      error: createImageError(
        'FILE_TOO_LARGE',
        `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
        { fileSize: file.size, maxSize: IMAGE_PROCESSING_CONFIG.MAX_FILE_SIZE }
      )
    };
  }

  return {
    isValid: true,
    metadata: {
      size: file.size,
      type: file.type
    }
  };
}

/**
 * Validates a data URI for image upload
 */
export function validateImageDataUri(dataUri: string): ImageValidationResult {
  // Check data URI format
  const mimeTypeMatch = dataUri.match(/^data:(image\/(png|jpeg|webp|gif));base64,/);
  if (!mimeTypeMatch || !mimeTypeMatch[1] || !mimeTypeMatch[2]) {
    return {
      isValid: false,
      error: createImageError(
        'INVALID_FORMAT',
        'Invalid Data URI format or unsupported image type. Supported types: png, jpeg, webp, gif',
        { dataUriPrefix: dataUri.substring(0, 50) }
      )
    };
  }

  const contentType = mimeTypeMatch[1] as SupportedImageType;
  
  // Extract base64 data
  const base64Data = dataUri.split(';base64,').pop();
  if (!base64Data) {
    return {
      isValid: false,
      error: createImageError(
        'INVALID_FORMAT',
        'Invalid Data URI format (missing base64 data)',
        { dataUriPrefix: dataUri.substring(0, 50) }
      )
    };
  }

  // Calculate file size from base64
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Check file size
  if (buffer.length > IMAGE_PROCESSING_CONFIG.MAX_FILE_SIZE) {
    const fileSizeMB = Math.round(buffer.length / 1024 / 1024 * 100) / 100;
    const maxSizeMB = IMAGE_PROCESSING_CONFIG.MAX_FILE_SIZE / 1024 / 1024;
    
    return {
      isValid: false,
      error: createImageError(
        'FILE_TOO_LARGE',
        `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
        { fileSize: buffer.length, maxSize: IMAGE_PROCESSING_CONFIG.MAX_FILE_SIZE }
      )
    };
  }

  return {
    isValid: true,
    metadata: {
      size: buffer.length,
      type: contentType
    }
  };
}

/**
 * Validates image dimensions (requires browser environment)
 */
export function validateImageDimensions(
  file: File, 
  maxWidth?: number, 
  maxHeight?: number,
  minWidth?: number,
  minHeight?: number
): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const { width, height } = img;
      
      // Check maximum dimensions
      if (maxWidth && width > maxWidth) {
        resolve({
          isValid: false,
          error: createImageError(
            'INVALID_FORMAT',
            `Image width (${width}px) exceeds maximum allowed width (${maxWidth}px)`,
            { width, height, maxWidth }
          )
        });
        return;
      }
      
      if (maxHeight && height > maxHeight) {
        resolve({
          isValid: false,
          error: createImageError(
            'INVALID_FORMAT',
            `Image height (${height}px) exceeds maximum allowed height (${maxHeight}px)`,
            { width, height, maxHeight }
          )
        });
        return;
      }
      
      // Check minimum dimensions
      if (minWidth && width < minWidth) {
        resolve({
          isValid: false,
          error: createImageError(
            'INVALID_FORMAT',
            `Image width (${width}px) is below minimum required width (${minWidth}px)`,
            { width, height, minWidth }
          )
        });
        return;
      }
      
      if (minHeight && height < minHeight) {
        resolve({
          isValid: false,
          error: createImageError(
            'INVALID_FORMAT',
            `Image height (${height}px) is below minimum required height (${minHeight}px)`,
            { width, height, minHeight }
          )
        });
        return;
      }
      
      resolve({
        isValid: true,
        metadata: {
          size: file.size,
          type: file.type,
          dimensions: { width, height }
        }
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        error: createImageError(
          'INVALID_FORMAT',
          'Unable to load image for dimension validation',
          { fileName: file.name, fileType: file.type }
        )
      });
    };
    
    img.src = url;
  });
}

/**
 * Comprehensive image validation that combines all checks
 */
export async function validateImage(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
    checkDimensions?: boolean;
  }
): Promise<ImageValidationResult> {
  // First validate file type and size
  const basicValidation = validateImageFile(file);
  if (!basicValidation.isValid) {
    return basicValidation;
  }
  
  // If dimension checking is requested and we're in a browser environment
  if (options?.checkDimensions && typeof window !== 'undefined') {
    const dimensionValidation = await validateImageDimensions(
      file,
      options.maxWidth,
      options.maxHeight,
      options.minWidth,
      options.minHeight
    );
    
    if (!dimensionValidation.isValid) {
      return dimensionValidation;
    }
    
    // Merge metadata
    return {
      isValid: true,
      metadata: {
        ...basicValidation.metadata!,
        dimensions: dimensionValidation.metadata?.dimensions
      }
    };
  }
  
  return basicValidation;
}

/**
 * Get user-friendly error message for display
 */
export function getImageValidationErrorMessage(error: ImageProcessingError): string {
  switch (error.code) {
    case 'UNSUPPORTED_TYPE':
      return 'Please select a valid image file (PNG, JPEG, WebP, or GIF).';
    case 'FILE_TOO_LARGE':
      return `File size is too large. Please select an image smaller than ${IMAGE_PROCESSING_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB.`;
    case 'INVALID_FORMAT':
      return 'Invalid image format. Please select a valid image file.';
    case 'UPLOAD_FAILED':
      return 'Failed to upload image. Please try again.';
    case 'REMOVAL_FAILED':
      return 'Failed to remove image. Please try again.';
    case 'NETWORK_ERROR':
      return 'Network error occurred. Please check your connection and try again.';
    default:
      return 'An error occurred while processing the image. Please try again.';
  }
}
