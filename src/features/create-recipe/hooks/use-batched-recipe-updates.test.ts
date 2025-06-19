/**
 * @fileoverview Tests for batched recipe updates hook
 * Validates performance improvements and state update batching
 */

import { renderHook, act } from '@testing-library/react';
import { useBatchedRecipeUpdates } from './use-batched-recipe-updates';
import { useRecipeStore } from '../store/recipe-store';
import { RecipeStep } from '../types/recipe.types';

// Mock the store
jest.mock('../store/recipe-store');

describe('useBatchedRecipeUpdates', () => {
  let mockStore: any;
  let mockBatchUpdateStepData: jest.Mock;
  let mockMarkStepCompleted: jest.Mock;
  let mockSetCurrentStep: jest.Mock;

  beforeEach(() => {
    mockBatchUpdateStepData = jest.fn();
    mockMarkStepCompleted = jest.fn();
    mockSetCurrentStep = jest.fn();

    mockStore = {
      batchUpdateStepData: mockBatchUpdateStepData,
      markStepCompleted: mockMarkStepCompleted,
      setCurrentStep: mockSetCurrentStep,
      completedSteps: [],
      resetWizard: jest.fn()
    };

    (useRecipeStore as jest.Mock).mockReturnValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('completeAIStreaming', () => {
    it('should perform atomic updates for causes completion', () => {
      const { result } = renderHook(() => useBatchedRecipeUpdates());
      const testCauses = [
        { cause_id: '1', cause_name: 'Test Cause', cause_suggestion: 'Test', explanation: 'Test' }
      ];

      act(() => {
        result.current.completeAIStreaming('causes', testCauses, {
          nextStep: RecipeStep.CAUSES,
          markCompleted: true,
          clearErrors: true
        });
      });

      // Should call batchUpdateStepData with atomic updates
      expect(mockBatchUpdateStepData).toHaveBeenCalledWith({
        potentialCauses: testCauses,
        currentStep: RecipeStep.CAUSES,
        error: null,
        streamingError: null,
        completedSteps: [RecipeStep.DEMOGRAPHICS]
      });

      // Should be called only once for atomic update
      expect(mockBatchUpdateStepData).toHaveBeenCalledTimes(1);
    });

    it('should handle symptoms completion with custom options', () => {
      const { result } = renderHook(() => useBatchedRecipeUpdates());
      const testSymptoms = [
        { symptom_id: '1', symptom_name: 'Test Symptom', symptom_suggestion: 'Test', explanation: 'Test' }
      ];

      act(() => {
        result.current.completeAIStreaming('symptoms', testSymptoms, {
          markCompleted: false,
          clearErrors: false,
          additionalUpdates: { customField: 'customValue' }
        });
      });

      expect(mockBatchUpdateStepData).toHaveBeenCalledWith({
        potentialSymptoms: testSymptoms,
        customField: 'customValue'
      });
    });

    it('should handle properties completion', () => {
      const { result } = renderHook(() => useBatchedRecipeUpdates());
      const testProperties = [
        { property_id: '1', property_name: 'Test Property', description: 'Test' }
      ];

      act(() => {
        result.current.completeAIStreaming('properties', testProperties);
      });

      expect(mockBatchUpdateStepData).toHaveBeenCalledWith({
        therapeuticProperties: testProperties,
        error: null,
        streamingError: null,
        completedSteps: [RecipeStep.SYMPTOMS]
      });
    });

    it('should handle oils completion', () => {
      const { result } = renderHook(() => useBatchedRecipeUpdates());
      const testOils = [
        { property_id: '1', oils: [{ oil_id: '1', oil_name: 'Test Oil' }] }
      ];

      act(() => {
        result.current.completeAIStreaming('oils', testOils);
      });

      expect(mockBatchUpdateStepData).toHaveBeenCalledWith({
        suggestedOils: testOils,
        error: null,
        streamingError: null,
        completedSteps: [RecipeStep.PROPERTIES]
      });
    });
  });

  describe('handleStreamingError', () => {
    it('should handle errors with atomic updates', () => {
      const { result } = renderHook(() => useBatchedRecipeUpdates());

      act(() => {
        result.current.handleStreamingError('Test error', {
          step: 'causes',
          preserveData: false,
          retryable: true
        });
      });

      expect(mockBatchUpdateStepData).toHaveBeenCalledWith({
        error: 'Test error (Click retry to try again)',
        potentialCauses: []
      });
    });

    it('should preserve data when specified', () => {
      const { result } = renderHook(() => useBatchedRecipeUpdates());

      act(() => {
        result.current.handleStreamingError('Test error', {
          step: 'symptoms',
          preserveData: true,
          retryable: false
        });
      });

      expect(mockBatchUpdateStepData).toHaveBeenCalledWith({
        error: 'Test error'
      });
    });

    it('should handle global errors without specific step', () => {
      const { result } = renderHook(() => useBatchedRecipeUpdates());

      act(() => {
        result.current.handleStreamingError('Global error');
      });

      expect(mockBatchUpdateStepData).toHaveBeenCalledWith({
        error: 'Global error (Click retry to try again)'
      });
    });
  });

  describe('performWorkflowTransition', () => {
    it('should perform complete workflow transition', () => {
      const { result } = renderHook(() => useBatchedRecipeUpdates());
      const testData = [
        { cause_id: '1', cause_name: 'Test', cause_suggestion: 'Test', explanation: 'Test' }
      ];

      act(() => {
        result.current.performWorkflowTransition({
          fromStep: 'causes',
          toStep: RecipeStep.CAUSES,
          data: testData,
          clearPreviousErrors: true,
          markPreviousCompleted: true,
          additionalUpdates: { lastTransition: Date.now() }
        });
      });

      expect(mockBatchUpdateStepData).toHaveBeenCalledWith({
        currentStep: RecipeStep.CAUSES,
        potentialCauses: testData,
        error: null,
        streamingError: null,
        completedSteps: [RecipeStep.DEMOGRAPHICS],
        lastTransition: expect.any(Number)
      });
    });

    it('should handle workflow transition without marking completed', () => {
      const { result } = renderHook(() => useBatchedRecipeUpdates());
      const testData = [
        { symptom_id: '1', symptom_name: 'Test', symptom_suggestion: 'Test', explanation: 'Test' }
      ];

      act(() => {
        result.current.performWorkflowTransition({
          fromStep: 'symptoms',
          toStep: RecipeStep.SYMPTOMS,
          data: testData,
          clearPreviousErrors: false,
          markPreviousCompleted: false
        });
      });

      expect(mockBatchUpdateStepData).toHaveBeenCalledWith({
        currentStep: RecipeStep.SYMPTOMS,
        potentialSymptoms: testData
      });
    });
  });

  describe('batchMultipleUpdates', () => {
    it('should batch multiple different update types', () => {
      const { result } = renderHook(() => useBatchedRecipeUpdates());

      act(() => {
        result.current.batchMultipleUpdates({
          stepData: {
            currentStep: RecipeStep.CAUSES,
            potentialCauses: []
          },
          streamingStates: {
            isStreamingCauses: false
          },
          loadingAndError: {
            isLoading: false,
            error: null
          }
        });
      });

      expect(mockBatchUpdateStepData).toHaveBeenCalledWith({
        currentStep: RecipeStep.CAUSES,
        potentialCauses: []
      });
    });

    it('should handle partial updates', () => {
      const { result } = renderHook(() => useBatchedRecipeUpdates());

      act(() => {
        result.current.batchMultipleUpdates({
          stepData: {
            error: null
          }
        });
      });

      expect(mockBatchUpdateStepData).toHaveBeenCalledWith({
        error: null
      });
    });
  });

  describe('Performance Validation', () => {
    it('should minimize store update calls', () => {
      const { result } = renderHook(() => useBatchedRecipeUpdates());
      const testCauses = [
        { cause_id: '1', cause_name: 'Test', cause_suggestion: 'Test', explanation: 'Test' }
      ];

      // Clear any setup calls
      mockBatchUpdateStepData.mockClear();

      act(() => {
        // This should result in only 1 store update call instead of multiple
        result.current.completeAIStreaming('causes', testCauses, {
          nextStep: RecipeStep.CAUSES,
          markCompleted: true,
          clearErrors: true,
          additionalUpdates: { timestamp: Date.now() }
        });
      });

      // Should be exactly 1 call for atomic update
      expect(mockBatchUpdateStepData).toHaveBeenCalledTimes(1);
    });

    it('should handle complex workflow transitions efficiently', () => {
      const { result } = renderHook(() => useBatchedRecipeUpdates());
      const testData = [
        { property_id: '1', property_name: 'Test', description: 'Test' }
      ];

      mockBatchUpdateStepData.mockClear();

      act(() => {
        result.current.performWorkflowTransition({
          fromStep: 'properties',
          toStep: RecipeStep.PROPERTIES,
          data: testData,
          clearPreviousErrors: true,
          markPreviousCompleted: true,
          additionalUpdates: {
            lastAnalysis: Date.now(),
            analysisComplete: true
          }
        });
      });

      // Should be exactly 1 call for the entire transition
      expect(mockBatchUpdateStepData).toHaveBeenCalledTimes(1);
      
      // Should include all updates in single call
      expect(mockBatchUpdateStepData).toHaveBeenCalledWith({
        currentStep: RecipeStep.PROPERTIES,
        therapeuticProperties: testData,
        error: null,
        streamingError: null,
        completedSteps: [RecipeStep.SYMPTOMS],
        lastAnalysis: expect.any(Number),
        analysisComplete: true
      });
    });
  });
});

// Helper function to get current step for type (matches implementation)
function getCurrentStepForType(step: 'causes' | 'symptoms' | 'properties' | 'oils'): RecipeStep {
  switch (step) {
    case 'causes': return RecipeStep.DEMOGRAPHICS;
    case 'symptoms': return RecipeStep.CAUSES;
    case 'properties': return RecipeStep.SYMPTOMS;
    case 'oils': return RecipeStep.PROPERTIES;
    default: return RecipeStep.HEALTH_CONCERN;
  }
}
