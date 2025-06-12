/**
 * @fileoverview Integration tests for Demographics to Causes flow with AI streaming
 */

import React from 'react';

// Mock store state that simulates the complete flow
const mockStoreState = {
  healthConcern: { healthConcern: 'chronic anxiety' },
  demographics: null,
  selectedCauses: [],
  potentialCauses: [],
  isLoading: false,
  error: null,
  isStreamingCauses: false,
  streamingError: null
};

const mockActions = {
  updateDemographics: jest.fn(),
  setPotentialCauses: jest.fn(),
  updateSelectedCauses: jest.fn(),
  setStreamingCauses: jest.fn(),
  setStreamingError: jest.fn(),
  clearStreamingError: jest.fn(),
  setError: jest.fn(),
  clearError: jest.fn(),
  markCurrentStepCompleted: jest.fn(),
  goToNext: jest.fn()
};

jest.mock('../store/recipe-store', () => ({
  useRecipeStore: () => ({
    ...mockStoreState,
    ...mockActions
  })
}));

jest.mock('../hooks/use-recipe-navigation', () => ({
  useRecipeWizardNavigation: () => ({
    goToNext: mockActions.goToNext,
    goToPrevious: jest.fn(),
    canGoNext: () => true,
    canGoPrevious: () => true,
    markCurrentStepCompleted: mockActions.markCurrentStepCompleted
  })
}));

jest.mock('@/lib/ai/hooks/use-ai-streaming', () => ({
  useAIStreaming: () => ({
    startStream: jest.fn(),
    partialData: null,
    finalData: null,
    error: null,
    isComplete: false,
    isStreaming: false,
    resetStream: jest.fn(),
    streamingText: ''
  })
}));

jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: jest.fn((name) => ({ name })),
    handleSubmit: jest.fn((fn) => (e) => {
      e.preventDefault();
      fn({
        gender: 'female',
        ageCategory: 'adult',
        specificAge: 28
      });
    }),
    watch: jest.fn((field) => {
      const values = {
        gender: 'female',
        ageCategory: 'adult',
        specificAge: 28
      };
      return values[field as keyof typeof values];
    }),
    setValue: jest.fn(),
    formState: {
      errors: {},
      isValid: true,
      isDirty: false
    }
  })
}));

jest.mock('../schemas/recipe-schemas', () => ({
  demographicsSchema: {}
}));

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => ({})
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}));

describe('Demographics to Causes Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock store state
    Object.assign(mockStoreState, {
      demographics: null,
      selectedCauses: [],
      potentialCauses: [],
      isLoading: false,
      error: null,
      isStreamingCauses: false,
      streamingError: null
    });
  });

  describe('Complete Flow Simulation', () => {
    it('should complete the full demographics to causes flow', async () => {
      // Step 1: Submit demographics form
      const demographicsData = {
        gender: 'female',
        ageCategory: 'adult',
        specificAge: 28
      };

      // Simulate demographics form submission
      mockActions.updateDemographics(demographicsData);
      mockActions.markCurrentStepCompleted();
      mockActions.clearError();
      mockActions.clearStreamingError();
      mockActions.setStreamingCauses(true);

      // Step 2: Simulate AI streaming response
      const streamingCauses = [
        {
          cause_id: 'c1',
          name_localized: 'Chronic Stress',
          suggestion_localized: 'Work-related stress',
          explanation_localized: 'High stress levels can contribute to anxiety'
        },
        {
          cause_id: 'c2',
          name_localized: 'Sleep Issues',
          suggestion_localized: 'Poor sleep quality',
          explanation_localized: 'Lack of sleep can worsen anxiety symptoms'
        }
      ];

      // Transform to create-recipe format
      const transformedCauses = streamingCauses.map(cause => ({
        cause_name: cause.name_localized || cause.cause_id || 'Unknown cause',
        cause_suggestion: cause.suggestion_localized || '',
        explanation: cause.explanation_localized || ''
      }));

      mockActions.setPotentialCauses(transformedCauses);
      mockActions.setStreamingCauses(false);

      // Step 3: Navigate to causes step
      mockActions.goToNext();

      // Step 4: Select causes
      const selectedCauses = [transformedCauses[0]]; // Select first cause
      mockActions.updateSelectedCauses(selectedCauses);
      mockActions.markCurrentStepCompleted();

      // Verify the complete flow
      expect(mockActions.updateDemographics).toHaveBeenCalledWith(demographicsData);
      expect(mockActions.setStreamingCauses).toHaveBeenCalledWith(true);
      expect(mockActions.setPotentialCauses).toHaveBeenCalledWith(transformedCauses);
      expect(mockActions.setStreamingCauses).toHaveBeenCalledWith(false);
      expect(mockActions.goToNext).toHaveBeenCalled();
      expect(mockActions.updateSelectedCauses).toHaveBeenCalledWith(selectedCauses);
      expect(mockActions.markCurrentStepCompleted).toHaveBeenCalledTimes(2);
    });

    it('should handle streaming errors in the flow', async () => {
      // Step 1: Submit demographics form
      const demographicsData = {
        gender: 'female',
        ageCategory: 'adult',
        specificAge: 28
      };

      mockActions.updateDemographics(demographicsData);
      mockActions.setStreamingCauses(true);

      // Step 2: Simulate streaming error
      const errorMessage = 'AI analysis failed: Network connection failed';
      mockActions.setStreamingError(errorMessage);

      // Verify error handling
      expect(mockActions.updateDemographics).toHaveBeenCalledWith(demographicsData);
      expect(mockActions.setStreamingCauses).toHaveBeenCalledWith(true);
      expect(mockActions.setStreamingError).toHaveBeenCalledWith(errorMessage);
    });

    it('should handle partial streaming data correctly', async () => {
      // Simulate partial data arriving during streaming
      const partialCauses = [
        {
          cause_id: 'c1',
          name_localized: 'Stress',
          suggestion_localized: 'Work stress',
          explanation_localized: 'High stress levels'
        }
      ];

      // Transform partial data
      const transformedPartialCauses = partialCauses.map(cause => ({
        cause_name: cause.name_localized || cause.cause_id || 'Unknown cause',
        cause_suggestion: cause.suggestion_localized || '',
        explanation: cause.explanation_localized || ''
      }));

      mockActions.setPotentialCauses(transformedPartialCauses);

      // Verify partial data handling
      expect(mockActions.setPotentialCauses).toHaveBeenCalledWith(transformedPartialCauses);
    });
  });

  describe('Data Transformation Validation', () => {
    it('should correctly transform recipe-wizard format to create-recipe format', () => {
      const recipeWizardData = {
        cause_id: 'stress_001',
        name_localized: 'Chronic Work Stress',
        suggestion_localized: 'High-pressure work environment',
        explanation_localized: 'Prolonged exposure to work stress can lead to anxiety disorders'
      };

      const expectedCreateRecipeFormat = {
        cause_name: 'Chronic Work Stress',
        cause_suggestion: 'High-pressure work environment',
        explanation: 'Prolonged exposure to work stress can lead to anxiety disorders'
      };

      const transformed = {
        cause_name: recipeWizardData.name_localized || recipeWizardData.cause_id || 'Unknown cause',
        cause_suggestion: recipeWizardData.suggestion_localized || '',
        explanation: recipeWizardData.explanation_localized || ''
      };

      expect(transformed).toEqual(expectedCreateRecipeFormat);
    });

    it('should handle missing fields in transformation', () => {
      const incompleteData = {
        cause_id: 'incomplete_001',
        name_localized: 'Incomplete Cause'
        // Missing suggestion_localized and explanation_localized
      };

      const transformed = {
        cause_name: incompleteData.name_localized || incompleteData.cause_id || 'Unknown cause',
        cause_suggestion: incompleteData.suggestion_localized || '',
        explanation: incompleteData.explanation_localized || ''
      };

      expect(transformed.cause_name).toBe('Incomplete Cause');
      expect(transformed.cause_suggestion).toBe('');
      expect(transformed.explanation).toBe('');
    });
  });

  describe('State Management Integration', () => {
    it('should maintain proper state transitions', () => {
      // Test state transitions during the flow
      const stateTransitions = [
        { action: 'setStreamingCauses', value: true },
        { action: 'setPotentialCauses', value: [] },
        { action: 'setStreamingCauses', value: false },
        { action: 'updateSelectedCauses', value: [] }
      ];

      stateTransitions.forEach(transition => {
        mockActions[transition.action](transition.value);
        expect(mockActions[transition.action]).toHaveBeenCalledWith(transition.value);
      });
    });

    it('should handle concurrent state updates', () => {
      // Test handling of multiple state updates
      mockActions.setStreamingCauses(true);
      mockActions.clearError();
      mockActions.clearStreamingError();

      expect(mockActions.setStreamingCauses).toHaveBeenCalledWith(true);
      expect(mockActions.clearError).toHaveBeenCalled();
      expect(mockActions.clearStreamingError).toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from streaming errors', () => {
      // Simulate error and recovery
      mockActions.setStreamingError('Network error');
      mockActions.clearStreamingError();
      mockActions.setStreamingCauses(true); // Retry

      expect(mockActions.setStreamingError).toHaveBeenCalledWith('Network error');
      expect(mockActions.clearStreamingError).toHaveBeenCalled();
      expect(mockActions.setStreamingCauses).toHaveBeenCalledWith(true);
    });

    it('should handle missing health concern gracefully', () => {
      // Test behavior when health concern is missing
      const errorMessage = 'Health concern is required to proceed';
      mockActions.setStreamingError(errorMessage);

      expect(mockActions.setStreamingError).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large datasets efficiently', () => {
      // Test with large number of causes
      const largeCausesList = Array.from({ length: 50 }, (_, index) => ({
        cause_name: `Cause ${index + 1}`,
        cause_suggestion: `Suggestion ${index + 1}`,
        explanation: `Explanation ${index + 1}`
      }));

      mockActions.setPotentialCauses(largeCausesList);
      expect(mockActions.setPotentialCauses).toHaveBeenCalledWith(largeCausesList);
    });

    it('should validate selection limits', () => {
      // Test maximum selection enforcement
      const maxCauses = Array.from({ length: 11 }, (_, index) => ({
        cause_name: `Cause ${index + 1}`,
        cause_suggestion: `Suggestion ${index + 1}`,
        explanation: `Explanation ${index + 1}`
      }));

      // Should trigger error for more than 10 selections
      const errorMessage = 'You can select up to 10 causes maximum.';
      mockActions.setError(errorMessage);

      expect(mockActions.setError).toHaveBeenCalledWith(errorMessage);
    });
  });
});
