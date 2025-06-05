// src/features/user-auth-data/utils/__tests__/error-messages.utils.test.ts

// Jest is configured for this project
import { getProfileActionErrorMessage } from '../error-messages.utils';
import { type ProfileActionError } from '../../actions/profile.actions';

describe('Error Messages Utils', () => {
  describe('getProfileActionErrorMessage', () => {
    it('should return correct message for AUTH_ERROR', () => {
      const error: ProfileActionError = {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        details: { context: 'login' }
      };

      const message = getProfileActionErrorMessage(error);
      expect(message).toBe('Authentication failed. Please log in again.');
    });

    it('should return correct message for VALIDATION_ERROR with field', () => {
      const error: ProfileActionError = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        field: 'email',
        details: { validationErrors: ['Invalid format'] }
      };

      const message = getProfileActionErrorMessage(error);
      expect(message).toBe('Invalid email. Please check your input and try again.');
    });

    it('should return correct message for VALIDATION_ERROR without field', () => {
      const error: ProfileActionError = {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { validationErrors: ['Multiple errors'] }
      };

      const message = getProfileActionErrorMessage(error);
      expect(message).toBe('Invalid data provided. Please check your input and try again.');
    });

    it('should return correct message for DATABASE_ERROR', () => {
      const error: ProfileActionError = {
        code: 'DATABASE_ERROR',
        message: 'Connection failed',
        details: { originalError: 'Connection timeout' }
      };

      const message = getProfileActionErrorMessage(error);
      expect(message).toBe('A database error occurred. Please try again later.');
    });

    it('should return correct message for NOT_FOUND', () => {
      const error: ProfileActionError = {
        code: 'NOT_FOUND',
        message: 'Profile not found',
        details: { userId: 'user123' }
      };

      const message = getProfileActionErrorMessage(error);
      expect(message).toBe('Profile not found. Please refresh the page and try again.');
    });

    it('should return correct message for IMAGE_ERROR', () => {
      const error: ProfileActionError = {
        code: 'IMAGE_ERROR',
        message: 'Image upload failed',
        details: { imageType: 'avatar' }
      };

      const message = getProfileActionErrorMessage(error);
      expect(message).toBe('Image processing failed. Please try a different image.');
    });

    it('should return correct message for NETWORK_ERROR', () => {
      const error: ProfileActionError = {
        code: 'NETWORK_ERROR',
        message: 'Network timeout',
        details: { timeout: 30000 }
      };

      const message = getProfileActionErrorMessage(error);
      expect(message).toBe('Network error occurred. Please check your connection and try again.');
    });

    it('should return correct message for UNKNOWN_ERROR', () => {
      const error: ProfileActionError = {
        code: 'UNKNOWN_ERROR',
        message: 'Something went wrong',
        details: {}
      };

      const message = getProfileActionErrorMessage(error);
      expect(message).toBe('An unexpected error occurred. Please try again later.');
    });

    it('should return default message for unrecognized error codes', () => {
      const error = {
        code: 'UNRECOGNIZED_CODE',
        message: 'Unknown error',
        details: {}
      } as any;

      const message = getProfileActionErrorMessage(error);
      expect(message).toBe('An unexpected error occurred. Please try again later.');
    });

    it('should handle validation error with different field types', () => {
      const fields = ['firstName', 'lastName', 'bio', 'language', 'ageCategory', 'gender'];
      
      fields.forEach(field => {
        const error: ProfileActionError = {
          code: 'VALIDATION_ERROR',
          message: `Invalid ${field}`,
          field,
          details: {}
        };

        const message = getProfileActionErrorMessage(error);
        expect(message).toBe(`Invalid ${field}. Please check your input and try again.`);
      });
    });

    it('should handle errors with minimal properties', () => {
      const error: ProfileActionError = {
        code: 'AUTH_ERROR',
        message: 'Auth failed'
      };

      const message = getProfileActionErrorMessage(error);
      expect(message).toBe('Authentication failed. Please log in again.');
    });

    it('should handle errors with complex details', () => {
      const error: ProfileActionError = {
        code: 'DATABASE_ERROR',
        message: 'Complex database error',
        details: {
          originalError: 'Connection timeout',
          query: 'SELECT * FROM profiles',
          timestamp: new Date().toISOString(),
          retryAttempts: 3,
          metadata: {
            userId: 'user123',
            operation: 'update'
          }
        }
      };

      const message = getProfileActionErrorMessage(error);
      expect(message).toBe('A database error occurred. Please try again later.');
    });

    it('should be consistent with error message format', () => {
      const errorCodes: ProfileActionError['code'][] = [
        'AUTH_ERROR',
        'VALIDATION_ERROR',
        'DATABASE_ERROR',
        'NOT_FOUND',
        'IMAGE_ERROR',
        'NETWORK_ERROR',
        'UNKNOWN_ERROR'
      ];

      errorCodes.forEach(code => {
        const error: ProfileActionError = {
          code,
          message: `Test ${code}`,
          details: {}
        };

        const message = getProfileActionErrorMessage(error);
        
        // All messages should be strings
        expect(typeof message).toBe('string');
        
        // All messages should be non-empty
        expect(message.length).toBeGreaterThan(0);
        
        // All messages should end with a period
        expect(message.endsWith('.')).toBe(true);
        
        // All messages should start with a capital letter
        expect(message[0]).toMatch(/[A-Z]/);
      });
    });

    it('should provide actionable guidance in error messages', () => {
      const actionableMessages = [
        { code: 'AUTH_ERROR', expectedAction: 'log in again' },
        { code: 'VALIDATION_ERROR', expectedAction: 'check your input' },
        { code: 'DATABASE_ERROR', expectedAction: 'try again later' },
        { code: 'NOT_FOUND', expectedAction: 'refresh the page' },
        { code: 'IMAGE_ERROR', expectedAction: 'try a different image' },
        { code: 'NETWORK_ERROR', expectedAction: 'check your connection' },
        { code: 'UNKNOWN_ERROR', expectedAction: 'try again later' }
      ];

      actionableMessages.forEach(({ code, expectedAction }) => {
        const error: ProfileActionError = {
          code: code as ProfileActionError['code'],
          message: `Test ${code}`,
          details: {}
        };

        const message = getProfileActionErrorMessage(error);
        expect(message.toLowerCase()).toContain(expectedAction);
      });
    });
  });
});
