/**
 * @fileoverview Backward Compatibility Tests for Recipe Wizard AI Service
 * Ensures existing fetchPotentialCauses() continues to work unchanged after streaming integration
 */

import { fetchPotentialCauses, checkAIServiceHealth, getAIServiceInfo, AIServiceError } from './ai-service';
import type { PotentialCause, DemographicsData } from '../types/recipe-wizard.types';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Backward Compatibility: Original AI Service', () => {
  const mockRequest = {
    healthConcern: 'I have chronic anxiety and stress that affects my daily life and sleep patterns',
    demographics: {
      gender: 'female' as const,
      ageCategory: 'adult' as const,
      specificAge: 32,
      language: 'EN_US' as const
    }
  };

  const mockSuccessResponse = {
    success: true,
    data: [
      {
        cause_id: '1',
        name_localized: 'Work-related stress',
        suggestion_localized: 'Consider evaluating your workload and work environment',
        explanation_localized: 'Work stress can contribute to anxiety and sleep issues'
      },
      {
        cause_id: '2',
        name_localized: 'Sleep disturbances',
        suggestion_localized: 'Review your sleep habits and environment',
        explanation_localized: 'Poor sleep quality can exacerbate stress and anxiety'
      }
    ],
    meta: {
      timestamp: new Date().toISOString(),
      count: 2,
      service: 'recipe-wizard-ai'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('fetchPotentialCauses() - Core Functionality', () => {
    it('should continue to work with existing API endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      });

      const result = await fetchPotentialCauses(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith('/api/recipe-wizard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          healthConcern: { healthConcern: mockRequest.healthConcern },
          demographics: mockRequest.demographics
        })
      });

      expect(result).toEqual(mockSuccessResponse.data);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should maintain exact same input validation behavior', async () => {
      // Test missing health concern
      await expect(fetchPotentialCauses({
        healthConcern: '',
        demographics: mockRequest.demographics
      })).rejects.toThrow(AIServiceError);

      await expect(fetchPotentialCauses({
        healthConcern: '',
        demographics: mockRequest.demographics
      })).rejects.toThrow('Health concern is required');

      // Test missing demographics
      await expect(fetchPotentialCauses({
        healthConcern: mockRequest.healthConcern,
        demographics: null as any
      })).rejects.toThrow(AIServiceError);

      await expect(fetchPotentialCauses({
        healthConcern: mockRequest.healthConcern,
        demographics: null as any
      })).rejects.toThrow('Demographics information is required');
    });

    it('should maintain exact same error handling behavior', async () => {
      // Test API request failure
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      });

      await expect(fetchPotentialCauses(mockRequest))
        .rejects
        .toThrow(AIServiceError);

      await expect(fetchPotentialCauses(mockRequest))
        .rejects
        .toThrow('Internal server error');

      // Test network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(fetchPotentialCauses(mockRequest))
        .rejects
        .toThrow(AIServiceError);

      await expect(fetchPotentialCauses(mockRequest))
        .rejects
        .toThrow('Network error: Unable to connect to AI service');
    });

    it('should maintain exact same response format validation', async () => {
      // Test unsuccessful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'AI analysis failed' })
      });

      await expect(fetchPotentialCauses(mockRequest))
        .rejects
        .toThrow('AI analysis failed');

      // Test invalid response format
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: 'not an array' })
      });

      await expect(fetchPotentialCauses(mockRequest))
        .rejects
        .toThrow('Invalid response format from API');

      // Test empty response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });

      await expect(fetchPotentialCauses(mockRequest))
        .rejects
        .toThrow('No potential causes generated by AI service');
    });

    it('should return exact same data structure as before', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      });

      const result = await fetchPotentialCauses(mockRequest);

      // Verify exact structure
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const firstCause = result[0];
      expect(firstCause).toHaveProperty('cause_id');
      expect(firstCause).toHaveProperty('name_localized');
      expect(firstCause).toHaveProperty('suggestion_localized');
      expect(firstCause).toHaveProperty('explanation_localized');

      expect(typeof firstCause.cause_id).toBe('string');
      expect(typeof firstCause.name_localized).toBe('string');
      expect(typeof firstCause.suggestion_localized).toBe('string');
      expect(typeof firstCause.explanation_localized).toBe('string');
    });
  });

  describe('checkAIServiceHealth() - Health Check Functionality', () => {
    it('should continue to work with existing health check endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy', configured: true })
      });

      const result = await checkAIServiceHealth();

      expect(global.fetch).toHaveBeenCalledWith('/api/recipe-wizard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      expect(result).toBe(true);
    });

    it('should maintain exact same health check logic', async () => {
      // Test unhealthy response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'unhealthy', configured: false })
      });

      const result = await checkAIServiceHealth();
      expect(result).toBe(false);

      // Test network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result2 = await checkAIServiceHealth();
      expect(result2).toBe(false);
    });
  });

  describe('getAIServiceInfo() - Service Information', () => {
    it('should return exact same service information', () => {
      const info = getAIServiceInfo();

      expect(info).toEqual({
        provider: 'OpenAI Agents JS SDK',
        version: '0.0.4',
        model: 'gpt-4o-mini',
        features: ['potential-causes-analysis'],
        status: 'active',
        endpoint: '/api/recipe-wizard'
      });
    });

    it('should maintain consistent service info structure', () => {
      const info = getAIServiceInfo();

      expect(info).toHaveProperty('provider');
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('model');
      expect(info).toHaveProperty('features');
      expect(info).toHaveProperty('status');
      expect(info).toHaveProperty('endpoint');

      expect(typeof info.provider).toBe('string');
      expect(typeof info.version).toBe('string');
      expect(typeof info.model).toBe('string');
      expect(Array.isArray(info.features)).toBe(true);
      expect(typeof info.status).toBe('string');
      expect(typeof info.endpoint).toBe('string');
    });
  });

  describe('AIServiceError - Error Class Functionality', () => {
    it('should maintain exact same error class behavior', () => {
      const error = new AIServiceError(
        'Test error message',
        'TEST_ERROR_CODE',
        new Error('Original error')
      );

      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('TEST_ERROR_CODE');
      expect(error.originalError).toBeInstanceOf(Error);
      expect(error.name).toBe('AIServiceError');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AIServiceError).toBe(true);
    });

    it('should work without original error parameter', () => {
      const error = new AIServiceError('Test message', 'TEST_CODE');

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.originalError).toBeUndefined();
      expect(error.name).toBe('AIServiceError');
    });
  });

  describe('Integration with Existing Components', () => {
    it('should not conflict with streaming service imports', async () => {
      // Test that both services can be imported without conflicts
      const originalService = await import('./ai-service');
      const streamingService = await import('./ai-service-streaming');

      expect(originalService.fetchPotentialCauses).toBeDefined();
      expect(streamingService.fetchPotentialCausesStreaming).toBeDefined();

      // Verify they are different functions
      expect(originalService.fetchPotentialCauses).not.toBe(streamingService.fetchPotentialCausesStreaming);
    });

    it('should maintain separate error handling', async () => {
      const originalService = await import('./ai-service');
      const streamingService = await import('./ai-service-streaming');

      expect(originalService.AIServiceError).toBeDefined();
      expect(streamingService.StreamingAIServiceError).toBeDefined();

      // Verify they are different error classes
      expect(originalService.AIServiceError).not.toBe(streamingService.StreamingAIServiceError);
    });
  });

  describe('Performance and Behavior Consistency', () => {
    it('should maintain same performance characteristics', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      });

      const startTime = Date.now();
      const result = await fetchPotentialCauses(mockRequest);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete quickly in tests
    });

    it('should maintain same async behavior', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      });

      // Test that it returns a Promise
      const promise = fetchPotentialCauses(mockRequest);
      expect(promise).toBeInstanceOf(Promise);

      const result = await promise;
      expect(result).toBeDefined();
    });
  });
});
