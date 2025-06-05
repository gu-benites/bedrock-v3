// src/features/user-auth-data/utils/__tests__/image-validation.utils.test.ts

// Jest is configured for this project
import {
  validateImageFile,
  validateImageDataUri,
  validateImageDimensions,
  validateImage,
  getImageValidationErrorMessage,
  type ImageValidationResult
} from '../image-validation.utils';
import { IMAGE_PROCESSING_CONFIG } from '../profile-image.utils';

// Mock File constructor for testing
class MockFile implements File {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  webkitRelativePath: string = '';

  constructor(name: string, size: number, type: string) {
    this.name = name;
    this.size = size;
    this.type = type;
    this.lastModified = Date.now();
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(this.size));
  }

  slice(): Blob {
    return new Blob();
  }

  stream(): ReadableStream<Uint8Array> {
    return new ReadableStream();
  }

  text(): Promise<string> {
    return Promise.resolve('');
  }
}

describe('Image Validation Utils', () => {
  describe('validateImageFile', () => {
    it('should validate a valid PNG file', () => {
      const file = new MockFile('test.png', 1024 * 1024, 'image/png'); // 1MB
      const result = validateImageFile(file);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.metadata).toEqual({
        size: 1024 * 1024,
        type: 'image/png'
      });
    });

    it('should validate a valid JPEG file', () => {
      const file = new MockFile('test.jpg', 2 * 1024 * 1024, 'image/jpeg'); // 2MB
      const result = validateImageFile(file);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.metadata).toEqual({
        size: 2 * 1024 * 1024,
        type: 'image/jpeg'
      });
    });

    it('should validate a valid WebP file', () => {
      const file = new MockFile('test.webp', 512 * 1024, 'image/webp'); // 512KB
      const result = validateImageFile(file);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid GIF file', () => {
      const file = new MockFile('test.gif', 1024 * 1024, 'image/gif'); // 1MB
      const result = validateImageFile(file);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject unsupported file types', () => {
      const file = new MockFile('test.bmp', 1024 * 1024, 'image/bmp');
      const result = validateImageFile(file);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UNSUPPORTED_TYPE');
      expect(result.error?.message).toContain('Unsupported file type');
      expect(result.error?.details.fileType).toBe('image/bmp');
    });

    it('should reject files that are too large', () => {
      const file = new MockFile('test.png', 10 * 1024 * 1024, 'image/png'); // 10MB (exceeds 5MB limit)
      const result = validateImageFile(file);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
      expect(result.error?.message).toContain('exceeds maximum allowed size');
      expect(result.error?.details.fileSize).toBe(10 * 1024 * 1024);
      expect(result.error?.details.maxSize).toBe(IMAGE_PROCESSING_CONFIG.MAX_FILE_SIZE);
    });

    it('should handle edge case of exactly maximum file size', () => {
      const file = new MockFile('test.png', IMAGE_PROCESSING_CONFIG.MAX_FILE_SIZE, 'image/png');
      const result = validateImageFile(file);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle zero-size files', () => {
      const file = new MockFile('test.png', 0, 'image/png');
      const result = validateImageFile(file);

      expect(result.isValid).toBe(true);
      expect(result.metadata?.size).toBe(0);
    });
  });

  describe('validateImageDataUri', () => {
    const createValidDataUri = (type: string, size: number = 1000): string => {
      const base64Data = 'A'.repeat(Math.ceil(size * 4 / 3)); // Approximate base64 size
      return `data:image/${type};base64,${base64Data}`;
    };

    it('should validate a valid PNG data URI', () => {
      const dataUri = createValidDataUri('png', 1000);
      const result = validateImageDataUri(dataUri);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.metadata?.type).toBe('image/png');
    });

    it('should validate a valid JPEG data URI', () => {
      const dataUri = createValidDataUri('jpeg', 2000);
      const result = validateImageDataUri(dataUri);

      expect(result.isValid).toBe(true);
      expect(result.metadata?.type).toBe('image/jpeg');
    });

    it('should validate a valid WebP data URI', () => {
      const dataUri = createValidDataUri('webp', 1500);
      const result = validateImageDataUri(dataUri);

      expect(result.isValid).toBe(true);
      expect(result.metadata?.type).toBe('image/webp');
    });

    it('should validate a valid GIF data URI', () => {
      const dataUri = createValidDataUri('gif', 800);
      const result = validateImageDataUri(dataUri);

      expect(result.isValid).toBe(true);
      expect(result.metadata?.type).toBe('image/gif');
    });

    it('should reject invalid data URI format', () => {
      const invalidDataUri = 'invalid-data-uri';
      const result = validateImageDataUri(invalidDataUri);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_FORMAT');
      expect(result.error?.message).toContain('Invalid Data URI format');
    });

    it('should reject unsupported image types in data URI', () => {
      const dataUri = 'data:image/bmp;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const result = validateImageDataUri(dataUri);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_FORMAT');
      expect(result.error?.message).toContain('unsupported image type');
    });

    it('should reject data URI without base64 data', () => {
      const dataUri = 'data:image/png;base64,';
      const result = validateImageDataUri(dataUri);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_FORMAT');
      expect(result.error?.message).toContain('missing base64 data');
    });

    it('should reject data URI with file too large', () => {
      // Create a data URI that would result in a file larger than 5MB
      const largeBase64 = 'A'.repeat(8 * 1024 * 1024); // ~6MB when decoded
      const dataUri = `data:image/png;base64,${largeBase64}`;
      const result = validateImageDataUri(dataUri);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
      expect(result.error?.message).toContain('exceeds maximum allowed size');
    });

    it('should handle malformed data URI gracefully', () => {
      const malformedDataUri = 'data:image/png;base64';
      const result = validateImageDataUri(malformedDataUri);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_FORMAT');
    });
  });

  describe('getImageValidationErrorMessage', () => {
    it('should return correct message for UNSUPPORTED_TYPE', () => {
      const error = { code: 'UNSUPPORTED_TYPE' as const, message: 'test', details: {} };
      const message = getImageValidationErrorMessage(error);
      
      expect(message).toBe('Please select a valid image file (PNG, JPEG, WebP, or GIF).');
    });

    it('should return correct message for FILE_TOO_LARGE', () => {
      const error = { code: 'FILE_TOO_LARGE' as const, message: 'test', details: {} };
      const message = getImageValidationErrorMessage(error);
      
      expect(message).toContain('File size is too large');
      expect(message).toContain('5MB');
    });

    it('should return correct message for INVALID_FORMAT', () => {
      const error = { code: 'INVALID_FORMAT' as const, message: 'test', details: {} };
      const message = getImageValidationErrorMessage(error);
      
      expect(message).toBe('Invalid image format. Please select a valid image file.');
    });

    it('should return correct message for UPLOAD_FAILED', () => {
      const error = { code: 'UPLOAD_FAILED' as const, message: 'test', details: {} };
      const message = getImageValidationErrorMessage(error);
      
      expect(message).toBe('Failed to upload image. Please try again.');
    });

    it('should return correct message for REMOVAL_FAILED', () => {
      const error = { code: 'REMOVAL_FAILED' as const, message: 'test', details: {} };
      const message = getImageValidationErrorMessage(error);
      
      expect(message).toBe('Failed to remove image. Please try again.');
    });

    it('should return correct message for NETWORK_ERROR', () => {
      const error = { code: 'NETWORK_ERROR' as const, message: 'test', details: {} };
      const message = getImageValidationErrorMessage(error);
      
      expect(message).toBe('Network error occurred. Please check your connection and try again.');
    });

    it('should return default message for unknown error codes', () => {
      const error = { code: 'UNKNOWN_CODE' as any, message: 'test', details: {} };
      const message = getImageValidationErrorMessage(error);
      
      expect(message).toBe('An error occurred while processing the image. Please try again.');
    });
  });

  describe('validateImageDimensions', () => {
    // Mock Image constructor for testing
    beforeEach(() => {
      global.Image = class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';
        width: number = 0;
        height: number = 0;

        constructor() {
          // Simulate async loading with proper timing
          process.nextTick(() => {
            if (this.src.includes('valid')) {
              this.width = 800;
              this.height = 600;
              this.onload?.();
            } else if (this.src.includes('large')) {
              this.width = 5000;
              this.height = 4000;
              this.onload?.();
            } else if (this.src.includes('small')) {
              this.width = 50;
              this.height = 30;
              this.onload?.();
            } else {
              this.onerror?.();
            }
          });
        }
      } as any;

      global.URL = {
        createObjectURL: jest.fn((file: File) => {
          if (file.name.includes('valid')) return 'blob:valid-url';
          if (file.name.includes('large')) return 'blob:large-url';
          if (file.name.includes('small')) return 'blob:small-url';
          return 'blob:invalid-url';
        }),
        revokeObjectURL: jest.fn()
      } as any;
    });

    it('should validate image with acceptable dimensions', async () => {
      const file = new MockFile('valid.png', 1024, 'image/png');

      const result = await validateImageDimensions(file, 1000, 800);

      expect(result.isValid).toBe(true);
      expect(result.metadata?.dimensions).toEqual({ width: 800, height: 600 });
    });

    it('should reject image with width exceeding maximum', async () => {
      const file = new MockFile('large.png', 1024, 'image/png');

      const result = await validateImageDimensions(file, 1000, 1000);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_FORMAT');
      expect(result.error?.message).toContain('width (5000px) exceeds maximum allowed width (1000px)');
    });

    it('should reject image with height exceeding maximum', async () => {
      const file = new MockFile('large.png', 1024, 'image/png');

      const result = await validateImageDimensions(file, 6000, 1000);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_FORMAT');
      expect(result.error?.message).toContain('height (4000px) exceeds maximum allowed height (1000px)');
    });

    it('should reject image with width below minimum', async () => {
      const file = new MockFile('small.png', 1024, 'image/png');

      const result = await validateImageDimensions(file, undefined, undefined, 100, 50);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_FORMAT');
      expect(result.error?.message).toContain('width (50px) is below minimum required width (100px)');
    });

    it('should reject image with height below minimum', async () => {
      const file = new MockFile('small.png', 1024, 'image/png');

      const result = await validateImageDimensions(file, undefined, undefined, 40, 50);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_FORMAT');
      expect(result.error?.message).toContain('height (30px) is below minimum required height (50px)');
    });

    it('should handle image loading error', async () => {
      // Override the Image mock for this specific test
      global.Image = class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';
        width: number = 0;
        height: number = 0;

        constructor() {
          // Always trigger error for this test
          process.nextTick(() => {
            this.onerror?.();
          });
        }
      } as any;

      const file = new MockFile('invalid.png', 1024, 'image/png');

      const result = await validateImageDimensions(file);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_FORMAT');
      expect(result.error?.message).toContain('Unable to load image for dimension validation');
    });

    it('should validate without dimension constraints', async () => {
      const file = new MockFile('valid.png', 1024, 'image/png');

      const result = await validateImageDimensions(file);

      expect(result.isValid).toBe(true);
      expect(result.metadata?.dimensions).toEqual({ width: 800, height: 600 });
    });
  });

  describe('validateImage', () => {
    beforeEach(() => {
      // Mock browser environment
      global.window = {} as any;

      global.Image = class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';
        width: number = 800;
        height: number = 600;

        constructor() {
          setTimeout(() => this.onload?.(), 10);
        }
      } as any;

      global.URL = {
        createObjectURL: jest.fn(() => 'blob:valid-url'),
        revokeObjectURL: jest.fn()
      } as any;
    });

    it('should perform basic validation only when checkDimensions is false', async () => {
      const file = new MockFile('test.png', 1024, 'image/png');

      const result = await validateImage(file, { checkDimensions: false });

      expect(result.isValid).toBe(true);
      expect(result.metadata?.dimensions).toBeUndefined();
    });

    it('should perform comprehensive validation when checkDimensions is true', async () => {
      const file = new MockFile('test.png', 1024, 'image/png');

      const result = await validateImage(file, {
        checkDimensions: true,
        maxWidth: 1000,
        maxHeight: 800
      });

      expect(result.isValid).toBe(true);
      expect(result.metadata?.dimensions).toEqual({ width: 800, height: 600 });
    });

    it('should return basic validation error when file validation fails', async () => {
      const file = new MockFile('test.bmp', 1024, 'image/bmp');

      const result = await validateImage(file, { checkDimensions: true });

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('UNSUPPORTED_TYPE');
    });

    it('should skip dimension checking in non-browser environment', async () => {
      delete (global as any).window;

      const file = new MockFile('test.png', 1024, 'image/png');

      const result = await validateImage(file, { checkDimensions: true });

      expect(result.isValid).toBe(true);
      expect(result.metadata?.dimensions).toBeUndefined();
    });
  });
});
