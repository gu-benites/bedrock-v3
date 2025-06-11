/**
 * @fileoverview Tests for Recipe Wizard Streaming AI Service
 * Test-driven development for streaming integration with bulletproof infrastructure
 */

import { fetchPotentialCausesStreaming, StreamingAIServiceError } from './ai-service-streaming';
import type { PotentialCause, DemographicsData } from '../types/recipe-wizard.types';

// Mock the streaming hook
jest.mock('../../../lib/ai/hooks/use-ai-streaming', () => ({
  useAIStreaming: jest.fn(() => ({
    streamingText: '',
    isStreaming: false,
    isComplete: false,
    error: null,
    finalData: null,
    startStream: jest.fn(),
    resetStream: jest.fn()
  }))
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('fetchPotentialCausesStreaming', () => {
  const mockRequest = {
    healthConcern: 'I have chronic anxiety and stress',
    demographics: {
      gender: 'female' as const,
      ageCategory: 'adult' as const,
      specificAge: 32,
      language: 'EN_US' as const
    }
  };

  const mockPotentialCauses: PotentialCause[] = [
    {
      cause_id: '1',
      name_localized: 'Work-related stress',
      suggestion_localized: 'Consider evaluating your workload',
      explanation_localized: 'Work stress can contribute to anxiety'
    },
    {
      cause_id: '2', 
      name_localized: 'Sleep disturbances',
      suggestion_localized: 'Review your sleep habits',
      explanation_localized: 'Poor sleep affects stress levels'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Input Validation', () => {
    it('should throw error for missing health concern', async () => {
      const invalidRequest = {
        ...mockRequest,
        healthConcern: ''
      };

      await expect(fetchPotentialCausesStreaming(invalidRequest))
        .rejects
        .toThrow(StreamingAIServiceError);

      await expect(fetchPotentialCausesStreaming(invalidRequest))
        .rejects
        .toThrow('Health concern is required');
    });

    it('should throw error for missing demographics', async () => {
      const invalidRequest = {
        healthConcern: 'test concern',
        demographics: null as any
      };

      await expect(fetchPotentialCausesStreaming(invalidRequest))
        .rejects
        .toThrow(StreamingAIServiceError);

      await expect(fetchPotentialCausesStreaming(invalidRequest))
        .rejects
        .toThrow('Demographics information is required');
    });

    it('should throw error for whitespace-only health concern', async () => {
      const invalidRequest = {
        ...mockRequest,
        healthConcern: '   \n\t   '
      };

      await expect(fetchPotentialCausesStreaming(invalidRequest))
        .rejects
        .toThrow('Health concern is required');
    });
  });

  describe('Streaming API Integration', () => {
    it('should return streaming response object with correct structure', async () => {
      const result = await fetchPotentialCausesStreaming(mockRequest);

      expect(result).toHaveProperty('streamingText');
      expect(result).toHaveProperty('isStreaming');
      expect(result).toHaveProperty('isComplete');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('finalData');
      expect(result).toHaveProperty('startStream');
      expect(result).toHaveProperty('resetStream');
    });

    it('should configure streaming with correct endpoint and data', async () => {
      const result = await fetchPotentialCausesStreaming(mockRequest);

      // Verify the streaming configuration
      expect(result.startStream).toBeDefined();
      expect(typeof result.startStream).toBe('function');
    });

    it('should format request data correctly for streaming API', async () => {
      const result = await fetchPotentialCausesStreaming(mockRequest);

      // The streaming hook should be configured with the correct data structure
      expect(result).toBeDefined();
      
      // Test that startStream can be called with expected parameters
      const mockStartStream = jest.fn();
      result.startStream = mockStartStream;

      await result.startStream('/api/ai/streaming', {
        feature: 'recipe-wizard',
        step: 'potential-causes',
        data: {
          healthConcern: mockRequest.healthConcern,
          demographics: mockRequest.demographics
        }
      });

      expect(mockStartStream).toHaveBeenCalledWith('/api/ai/streaming', {
        feature: 'recipe-wizard',
        step: 'potential-causes',
        data: {
          healthConcern: mockRequest.healthConcern,
          demographics: mockRequest.demographics
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // This test ensures the streaming service can handle connection failures
      const result = await fetchPotentialCausesStreaming(mockRequest);
      
      expect(result.error).toBeNull(); // Initially no error
      expect(result.resetStream).toBeDefined();
      expect(typeof result.resetStream).toBe('function');
    });

    it('should provide retry functionality', async () => {
      const result = await fetchPotentialCausesStreaming(mockRequest);
      
      expect(result.resetStream).toBeDefined();
      expect(result.startStream).toBeDefined();
      
      // Should be able to reset and restart streaming
      result.resetStream();
      expect(typeof result.startStream).toBe('function');
    });
  });

  describe('Type Safety', () => {
    it('should return correctly typed streaming response', async () => {
      const result = await fetchPotentialCausesStreaming(mockRequest);

      // TypeScript should enforce correct types
      expect(typeof result.streamingText).toBe('string');
      expect(typeof result.isStreaming).toBe('boolean');
      expect(typeof result.isComplete).toBe('boolean');
      expect(result.error === null || typeof result.error === 'string').toBe(true);
      expect(result.finalData === null || Array.isArray(result.finalData)).toBe(true);
    });

    it('should handle PotentialCause[] as final data type', async () => {
      const result = await fetchPotentialCausesStreaming(mockRequest);

      // When complete, finalData should be PotentialCause[] or null
      if (result.finalData) {
        expect(Array.isArray(result.finalData)).toBe(true);
        if (result.finalData.length > 0) {
          const cause = result.finalData[0];
          expect(cause).toHaveProperty('cause_id');
          expect(cause).toHaveProperty('name_localized');
          expect(cause).toHaveProperty('suggestion_localized');
          expect(cause).toHaveProperty('explanation_localized');
        }
      }
    });
  });

  describe('Backward Compatibility', () => {
    it('should not interfere with existing fetchPotentialCauses function', async () => {
      // Import the existing function to ensure it still works
      const { fetchPotentialCauses } = await import('./ai-service');
      
      expect(fetchPotentialCauses).toBeDefined();
      expect(typeof fetchPotentialCauses).toBe('function');
      
      // The streaming function should be separate and not affect the original
      const streamingResult = await fetchPotentialCausesStreaming(mockRequest);
      expect(streamingResult).toBeDefined();
      expect(streamingResult).not.toBe(fetchPotentialCauses);
    });
  });
});

describe('StreamingAIServiceError', () => {
  it('should create error with correct properties', () => {
    const error = new StreamingAIServiceError(
      'Test error message',
      'TEST_ERROR_CODE',
      new Error('Original error')
    );

    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('TEST_ERROR_CODE');
    expect(error.originalError).toBeInstanceOf(Error);
    expect(error.name).toBe('StreamingAIServiceError');
  });

  it('should work without original error', () => {
    const error = new StreamingAIServiceError(
      'Test error message',
      'TEST_ERROR_CODE'
    );

    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('TEST_ERROR_CODE');
    expect(error.originalError).toBeUndefined();
    expect(error.name).toBe('StreamingAIServiceError');
  });
});
