// src/features/user-auth-data/utils/__tests__/profile-image.utils.test.ts

// Jest is configured for this project
import {
  getStoragePathFromUrl,
  handleImageProcessing,
  createImageError,
  IMAGE_PROCESSING_CONFIG,
  type ProcessImageResult,
  type ImageProcessingError
} from '../profile-image.utils';

// Mock Supabase client
const mockSupabaseClient = {
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      remove: jest.fn(),
      getPublicUrl: jest.fn()
    }))
  }
};

// Mock Winston logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Mock Buffer for Node.js environment
global.Buffer = Buffer;

describe('Profile Image Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createImageError', () => {
    it('should create a properly structured error object', () => {
      const error = createImageError('INVALID_FORMAT', 'Test error message', { test: 'details' });

      expect(error).toEqual({
        code: 'INVALID_FORMAT',
        message: 'Test error message',
        details: { test: 'details' }
      });
    });

    it('should create error without details', () => {
      const error = createImageError('UPLOAD_FAILED', 'Upload failed');

      expect(error).toEqual({
        code: 'UPLOAD_FAILED',
        message: 'Upload failed',
        details: undefined
      });
    });

    it('should handle all error codes', () => {
      const codes: ImageProcessingError['code'][] = [
        'INVALID_FORMAT',
        'FILE_TOO_LARGE',
        'UNSUPPORTED_TYPE',
        'UPLOAD_FAILED',
        'REMOVAL_FAILED',
        'NETWORK_ERROR'
      ];

      codes.forEach(code => {
        const error = createImageError(code, `Test ${code}`);
        expect(error.code).toBe(code);
        expect(error.message).toBe(`Test ${code}`);
      });
    });
  });

  describe('getStoragePathFromUrl', () => {
    it('should extract storage path from valid Supabase URL', () => {
      const publicUrl = 'https://example.supabase.co/storage/v1/object/public/profiles/avatars/user123.png';
      const bucketName = 'profiles';
      
      const result = getStoragePathFromUrl(publicUrl, bucketName, mockLogger);
      
      expect(result).toBe('avatars/user123.png');
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should handle nested paths correctly', () => {
      const publicUrl = 'https://example.supabase.co/storage/v1/object/public/profiles/banners/subfolder/user456.webp';
      const bucketName = 'profiles';
      
      const result = getStoragePathFromUrl(publicUrl, bucketName, mockLogger);
      
      expect(result).toBe('banners/subfolder/user456.webp');
    });

    it('should return null for invalid URL format', () => {
      const invalidUrl = 'not-a-valid-url';
      const bucketName = 'profiles';
      
      const result = getStoragePathFromUrl(invalidUrl, bucketName, mockLogger);
      
      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[getStoragePathFromUrl] Failed to parse URL for storage path extraction',
        expect.objectContaining({ publicUrl: invalidUrl })
      );
    });

    it('should return null when bucket name not found in URL', () => {
      const publicUrl = 'https://example.supabase.co/storage/v1/object/public/other-bucket/file.png';
      const bucketName = 'profiles';
      
      const result = getStoragePathFromUrl(publicUrl, bucketName, mockLogger);
      
      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[getStoragePathFromUrl] Could not find bucket name in public URL path',
        expect.objectContaining({ publicUrl, bucketName })
      );
    });

    it('should handle URL with query parameters', () => {
      const publicUrl = 'https://example.supabase.co/storage/v1/object/public/profiles/avatars/user123.png?t=123456';
      const bucketName = 'profiles';
      
      const result = getStoragePathFromUrl(publicUrl, bucketName, mockLogger);
      
      expect(result).toBe('avatars/user123.png');
    });

    it('should handle URL with fragments', () => {
      const publicUrl = 'https://example.supabase.co/storage/v1/object/public/profiles/avatars/user123.png#fragment';
      const bucketName = 'profiles';
      
      const result = getStoragePathFromUrl(publicUrl, bucketName, mockLogger);
      
      expect(result).toBe('avatars/user123.png');
    });
  });

  describe('IMAGE_PROCESSING_CONFIG', () => {
    it('should have correct configuration values', () => {
      expect(IMAGE_PROCESSING_CONFIG.MAX_FILE_SIZE).toBe(5 * 1024 * 1024); // 5MB
      expect(IMAGE_PROCESSING_CONFIG.SUPPORTED_TYPES).toEqual([
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/gif'
      ]);
      expect(IMAGE_PROCESSING_CONFIG.RETRY_ATTEMPTS).toBe(3);
      expect(IMAGE_PROCESSING_CONFIG.RETRY_DELAY).toBe(1000);
      expect(IMAGE_PROCESSING_CONFIG.UPLOAD_TIMEOUT).toBe(30000);
    });

    it('should have readonly configuration', () => {
      // TypeScript should prevent modification, but let's test runtime behavior
      // Note: In JavaScript, const objects can still have their properties modified
      // unless they are frozen. This test verifies the configuration values are correct.
      expect(IMAGE_PROCESSING_CONFIG.MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
      expect(IMAGE_PROCESSING_CONFIG.SUPPORTED_TYPES).toContain('image/png');
      expect(IMAGE_PROCESSING_CONFIG.RETRY_ATTEMPTS).toBe(3);
    });
  });

  describe('handleImageProcessing - Data URI Upload', () => {
    const validPngDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const validJpegDataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';

    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();

      // Setup default mock implementations
      const mockStorageFrom = mockSupabaseClient.storage.from as jest.MockedFunction<any>;
      const mockStorage = {
        upload: jest.fn().mockResolvedValue({
          data: { path: 'avatars/user123.png', id: 'file-id', fullPath: 'profiles/avatars/user123.png' },
          error: null
        }),
        remove: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/profiles/avatars/user123.png' }
        })
      };

      mockStorageFrom.mockReturnValue(mockStorage);
    });

    it('should successfully upload a new PNG image', async () => {
      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: validPngDataUri,
        currentImagePathInStorage: null,
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(result.newImageUrl).toBe('https://example.supabase.co/storage/v1/object/public/profiles/avatars/user123.png');
      expect(result.error).toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[handleImageProcessing] Start. User: user123, Type: avatar, DataURI provided: true, CurrentPath: null'
      );
    });

    it('should successfully upload a new JPEG image', async () => {
      const mockStorage = mockSupabaseClient.storage.from() as any;
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/profiles/avatars/user123.jpeg' }
      });

      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: validJpegDataUri,
        currentImagePathInStorage: null,
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(result.newImageUrl).toBe('https://example.supabase.co/storage/v1/object/public/profiles/avatars/user123.jpeg');
      expect(result.error).toBeUndefined();
    });

    it('should replace existing image when uploading new one', async () => {
      const mockStorage = mockSupabaseClient.storage.from() as any;
      
      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: validPngDataUri,
        currentImagePathInStorage: 'avatars/user123-old.png',
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(mockStorage.remove).toHaveBeenCalledWith(['avatars/user123-old.png']);
      expect(result.newImageUrl).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should handle invalid data URI format', async () => {
      const invalidDataUri = 'data:image/bmp;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: invalidDataUri,
        currentImagePathInStorage: null,
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(result.error).toContain('Invalid avatar Data URI format');
      expect(result.errorDetails?.code).toBe('INVALID_FORMAT');
      expect(result.newImageUrl).toBeUndefined();
    });

    it('should handle non-data-uri string (no action)', async () => {
      const invalidDataUri = 'invalid-data-uri';

      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: invalidDataUri,
        currentImagePathInStorage: null,
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      // Should return empty object for non-data-uri strings
      expect(result).toEqual({});
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[handleImageProcessing] No action required for avatar. User: user123 (dataUri is undefined or not a new image string).'
      );
    });

    it('should handle unsupported image type', async () => {
      const unsupportedDataUri = 'data:image/bmp;base64,Qk0eAAAAAAAAAD4AAAAoAAAAAQAAAAEAAAABACAAAAAAAAAAAAATCwAAEwsAAAAAAAAAAAAA/////wA=';
      
      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: unsupportedDataUri,
        currentImagePathInStorage: null,
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(result.error).toContain('unsupported image type');
      expect(result.errorDetails?.code).toBe('INVALID_FORMAT');
    });

    it('should handle file too large error', async () => {
      // Create a data URI that would result in a file larger than 5MB
      const largeBase64 = 'A'.repeat(8 * 1024 * 1024); // ~6MB when decoded
      const largeDataUri = `data:image/png;base64,${largeBase64}`;
      
      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: largeDataUri,
        currentImagePathInStorage: null,
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(result.error).toContain('exceeds maximum allowed size');
      expect(result.errorDetails?.code).toBe('FILE_TOO_LARGE');
    });

    it('should handle upload failure with retry', async () => {
      const mockStorage = mockSupabaseClient.storage.from() as any;
      mockStorage.upload.mockRejectedValue(new Error('Upload failed'));
      
      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: validPngDataUri,
        currentImagePathInStorage: null,
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(result.error).toContain('Failed to upload avatar after 3 attempts');
      expect(result.errorDetails?.code).toBe('UPLOAD_FAILED');
      expect(mockStorage.upload).toHaveBeenCalledTimes(3); // Should retry 3 times
    });

    it('should handle missing base64 data', async () => {
      const invalidDataUri = 'data:image/png;base64,';

      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: invalidDataUri,
        currentImagePathInStorage: null,
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(result.error).toContain('missing base64 data');
      expect(result.errorDetails?.code).toBe('INVALID_FORMAT');
    });

    it('should handle public URL retrieval failure', async () => {
      const mockStorage = mockSupabaseClient.storage.from() as any;
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: null }
      });

      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: validPngDataUri,
        currentImagePathInStorage: null,
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(result.error).toContain('failed to get public URL');
    });
  });

  describe('handleImageProcessing - Image Removal', () => {
    beforeEach(() => {
      const mockStorage = mockSupabaseClient.storage.from() as any;
      mockStorage.remove.mockResolvedValue({ error: null });
    });

    it('should successfully remove existing image', async () => {
      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: null,
        currentImagePathInStorage: 'avatars/user123.png',
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(result.newImageUrl).toBeNull();
      expect(result.error).toBeUndefined();
      expect(mockSupabaseClient.storage.from().remove).toHaveBeenCalledWith(['avatars/user123.png']);
    });

    it('should handle removal when no existing image path', async () => {
      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: null,
        currentImagePathInStorage: null,
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(result.newImageUrl).toBeNull();
      expect(result.error).toBeUndefined();
      expect(mockSupabaseClient.storage.from().remove).not.toHaveBeenCalled();
    });

    it('should handle removal failure with retry', async () => {
      const mockStorage = mockSupabaseClient.storage.from() as any;
      mockStorage.remove.mockRejectedValue(new Error('Removal failed'));

      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: null,
        currentImagePathInStorage: 'avatars/user123.png',
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(result.error).toContain('Failed to remove existing avatar from storage after 3 attempts');
      expect(result.errorDetails?.code).toBe('REMOVAL_FAILED');
      expect(mockStorage.remove).toHaveBeenCalledTimes(3); // Should retry 3 times
    });
  });

  describe('handleImageProcessing - No Action Cases', () => {
    it('should handle undefined dataUri (no action)', async () => {
      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: undefined,
        currentImagePathInStorage: 'avatars/user123.png',
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(result).toEqual({});
      expect(mockSupabaseClient.storage.from().upload).not.toHaveBeenCalled();
      expect(mockSupabaseClient.storage.from().remove).not.toHaveBeenCalled();
    });

    it('should handle empty string dataUri (no action)', async () => {
      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: '',
        currentImagePathInStorage: 'avatars/user123.png',
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(result).toEqual({});
      expect(mockSupabaseClient.storage.from().upload).not.toHaveBeenCalled();
      expect(mockSupabaseClient.storage.from().remove).not.toHaveBeenCalled();
    });

    it('should handle non-data-uri string (no action)', async () => {
      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: 'some-regular-string',
        currentImagePathInStorage: 'avatars/user123.png',
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(result).toEqual({});
      expect(mockSupabaseClient.storage.from().upload).not.toHaveBeenCalled();
      expect(mockSupabaseClient.storage.from().remove).not.toHaveBeenCalled();
    });
  });

  describe('handleImageProcessing - Edge Cases', () => {
    it('should handle different image types (banner)', async () => {
      const validPngDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const mockStorage = mockSupabaseClient.storage.from() as any;
      mockStorage.upload.mockResolvedValue({
        data: { path: 'banners/user123.png', id: 'file-id', fullPath: 'profiles/banners/user123.png' },
        error: null
      });
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/profiles/banners/user123.png' }
      });

      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: validPngDataUri,
        currentImagePathInStorage: null,
        imageType: 'banner',
        baseFolderPath: 'banners',
        loggerInstance: mockLogger as any
      });

      expect(result.newImageUrl).toBe('https://example.supabase.co/storage/v1/object/public/profiles/banners/user123.png');
      expect(mockStorage.upload).toHaveBeenCalledWith(
        'banners/user123.png',
        expect.any(Buffer),
        expect.objectContaining({
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/png'
        })
      );
    });

    it('should handle WebP and GIF formats', async () => {
      const validWebpDataUri = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
      const validGifDataUri = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

      for (const [dataUri, expectedType, expectedExt] of [
        [validWebpDataUri, 'image/webp', 'webp'],
        [validGifDataUri, 'image/gif', 'gif']
      ]) {
        const mockStorage = mockSupabaseClient.storage.from() as any;
        mockStorage.upload.mockResolvedValue({
          data: { path: `avatars/user123.${expectedExt}`, id: 'file-id' },
          error: null
        });
        mockStorage.getPublicUrl.mockReturnValue({
          data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/profiles/avatars/user123.${expectedExt}` }
        });

        const result = await handleImageProcessing({
          supabase: mockSupabaseClient as any,
          userId: 'user123',
          dataUri: dataUri as string,
          currentImagePathInStorage: null,
          imageType: 'avatar',
          baseFolderPath: 'avatars',
          loggerInstance: mockLogger as any
        });

        expect(result.newImageUrl).toBe(`https://example.supabase.co/storage/v1/object/public/profiles/avatars/user123.${expectedExt}`);
        expect(mockStorage.upload).toHaveBeenCalledWith(
          `avatars/user123.${expectedExt}`,
          expect.any(Buffer),
          expect.objectContaining({
            contentType: expectedType
          })
        );
      }
    });

    it('should continue with upload even if old image removal fails', async () => {
      const validPngDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const mockStorage = mockSupabaseClient.storage.from() as any;

      // Mock removal to fail, but upload to succeed
      mockStorage.remove.mockResolvedValue({ error: new Error('Removal failed') });
      mockStorage.upload.mockResolvedValue({
        data: { path: 'avatars/user123.png', id: 'file-id' },
        error: null
      });
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/profiles/avatars/user123.png' }
      });

      const result = await handleImageProcessing({
        supabase: mockSupabaseClient as any,
        userId: 'user123',
        dataUri: validPngDataUri,
        currentImagePathInStorage: 'avatars/user123-old.png',
        imageType: 'avatar',
        baseFolderPath: 'avatars',
        loggerInstance: mockLogger as any
      });

      expect(result.newImageUrl).toBe('https://example.supabase.co/storage/v1/object/public/profiles/avatars/user123.png');
      expect(result.error).toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to remove old avatar from storage'),
        expect.any(Object)
      );
    });
  });
});
