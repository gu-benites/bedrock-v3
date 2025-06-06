/**
 * @fileoverview Unit tests for Essential Oil Recipe Creator Zustand store.
 * Tests state management, persistence, and navigation logic.
 */

import { renderHook, act } from '@testing-library/react';
import { useRecipeStore, clearRecipeData } from './recipe-store';
import { RecipeStep } from '../types/recipe.types';
import type { HealthConcernData, DemographicsData, PotentialCause, PotentialSymptom } from '../types/recipe.types';

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-123')
  }
});

describe('Recipe Store', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset store to initial state
    clearRecipeData();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useRecipeStore());
      
      expect(result.current.healthConcern).toBeNull();
      expect(result.current.demographics).toBeNull();
      expect(result.current.selectedCauses).toEqual([]);
      expect(result.current.selectedSymptoms).toEqual([]);
      expect(result.current.therapeuticProperties).toEqual([]);
      expect(result.current.suggestedOils).toEqual([]);
      expect(result.current.potentialCauses).toEqual([]);
      expect(result.current.potentialSymptoms).toEqual([]);
      expect(result.current.currentStep).toBe(RecipeStep.HEALTH_CONCERN);
      expect(result.current.completedSteps).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.sessionId).toBe('test-uuid-123');
    });
  });

  describe('Health Concern Management', () => {
    it('should update health concern data', () => {
      const { result } = renderHook(() => useRecipeStore());
      const healthConcernData: HealthConcernData = {
        healthConcern: 'Test anxiety and stress'
      };

      act(() => {
        result.current.updateHealthConcern(healthConcernData);
      });

      expect(result.current.healthConcern).toEqual(healthConcernData);
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Demographics Management', () => {
    it('should update demographics data', () => {
      const { result } = renderHook(() => useRecipeStore());
      const demographicsData: DemographicsData = {
        gender: 'female',
        ageCategory: 'adult',
        specificAge: 30
      };

      act(() => {
        result.current.updateDemographics(demographicsData);
      });

      expect(result.current.demographics).toEqual(demographicsData);
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Causes Management', () => {
    it('should update selected causes and clear dependent data', () => {
      const { result } = renderHook(() => useRecipeStore());
      
      // First set some dependent data
      const symptoms: PotentialSymptom[] = [
        { symptom_name: 'Test Symptom', symptom_suggestion: 'Test', explanation: 'Test' }
      ];
      
      act(() => {
        result.current.updateSelectedSymptoms(symptoms);
      });

      expect(result.current.selectedSymptoms).toEqual(symptoms);

      // Now update causes - should clear dependent data
      const causes: PotentialCause[] = [
        { cause_name: 'Test Cause', cause_suggestion: 'Test', explanation: 'Test' }
      ];

      act(() => {
        result.current.updateSelectedCauses(causes);
      });

      expect(result.current.selectedCauses).toEqual(causes);
      expect(result.current.selectedSymptoms).toEqual([]); // Should be cleared
      expect(result.current.therapeuticProperties).toEqual([]); // Should be cleared
      expect(result.current.suggestedOils).toEqual([]); // Should be cleared
    });
  });

  describe('Step Navigation', () => {
    it('should set current step', () => {
      const { result } = renderHook(() => useRecipeStore());

      act(() => {
        result.current.setCurrentStep(RecipeStep.DEMOGRAPHICS);
      });

      expect(result.current.currentStep).toBe(RecipeStep.DEMOGRAPHICS);
    });

    it('should mark step as completed', () => {
      const { result } = renderHook(() => useRecipeStore());

      act(() => {
        result.current.markStepCompleted(RecipeStep.HEALTH_CONCERN);
      });

      expect(result.current.completedSteps).toContain(RecipeStep.HEALTH_CONCERN);
    });

    it('should not duplicate completed steps', () => {
      const { result } = renderHook(() => useRecipeStore());

      act(() => {
        result.current.markStepCompleted(RecipeStep.HEALTH_CONCERN);
        result.current.markStepCompleted(RecipeStep.HEALTH_CONCERN);
      });

      expect(result.current.completedSteps).toEqual([RecipeStep.HEALTH_CONCERN]);
    });
  });

  describe('Navigation Logic', () => {
    it('should allow navigation to health concern step', () => {
      const { result } = renderHook(() => useRecipeStore());

      const canNavigate = result.current.canNavigateToStep(RecipeStep.HEALTH_CONCERN);
      expect(canNavigate).toBe(true);
    });

    it('should not allow navigation to demographics without health concern', () => {
      const { result } = renderHook(() => useRecipeStore());

      const canNavigate = result.current.canNavigateToStep(RecipeStep.DEMOGRAPHICS);
      expect(canNavigate).toBe(false);
    });

    it('should allow navigation to demographics with health concern', () => {
      const { result } = renderHook(() => useRecipeStore());
      const healthConcernData: HealthConcernData = {
        healthConcern: 'Test concern'
      };

      act(() => {
        result.current.updateHealthConcern(healthConcernData);
      });

      const canNavigate = result.current.canNavigateToStep(RecipeStep.DEMOGRAPHICS);
      expect(canNavigate).toBe(true);
    });

    it('should not allow navigation to causes without demographics', () => {
      const { result } = renderHook(() => useRecipeStore());
      const healthConcernData: HealthConcernData = {
        healthConcern: 'Test concern'
      };

      act(() => {
        result.current.updateHealthConcern(healthConcernData);
      });

      const canNavigate = result.current.canNavigateToStep(RecipeStep.CAUSES);
      expect(canNavigate).toBe(false);
    });
  });

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useRecipeStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should set error state and clear loading', () => {
      const { result } = renderHook(() => useRecipeStore());
      const errorMessage = 'Test error';

      act(() => {
        result.current.setLoading(true);
        result.current.setError(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear error state', () => {
      const { result } = renderHook(() => useRecipeStore());

      act(() => {
        result.current.setError('Test error');
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Store Reset', () => {
    it('should reset wizard to initial state', () => {
      const { result } = renderHook(() => useRecipeStore());
      
      // Set some data first
      act(() => {
        result.current.updateHealthConcern({ healthConcern: 'Test' });
        result.current.setCurrentStep(RecipeStep.DEMOGRAPHICS);
        result.current.markStepCompleted(RecipeStep.HEALTH_CONCERN);
        result.current.setError('Test error');
      });

      // Reset the wizard
      act(() => {
        result.current.resetWizard();
      });

      expect(result.current.healthConcern).toBeNull();
      expect(result.current.currentStep).toBe(RecipeStep.HEALTH_CONCERN);
      expect(result.current.completedSteps).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.sessionId).toBe('test-uuid-123'); // New session ID
    });
  });

  describe('API Data Management', () => {
    it('should set potential causes', () => {
      const { result } = renderHook(() => useRecipeStore());
      const causes: PotentialCause[] = [
        { cause_name: 'Test Cause', cause_suggestion: 'Test', explanation: 'Test' }
      ];

      act(() => {
        result.current.setPotentialCauses(causes);
      });

      expect(result.current.potentialCauses).toEqual(causes);
    });

    it('should set potential symptoms', () => {
      const { result } = renderHook(() => useRecipeStore());
      const symptoms: PotentialSymptom[] = [
        { symptom_name: 'Test Symptom', symptom_suggestion: 'Test', explanation: 'Test' }
      ];

      act(() => {
        result.current.setPotentialSymptoms(symptoms);
      });

      expect(result.current.potentialSymptoms).toEqual(symptoms);
    });
  });
});
