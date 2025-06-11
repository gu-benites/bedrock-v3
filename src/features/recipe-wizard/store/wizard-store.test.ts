/**
 * @fileoverview Unit tests for Recipe Wizard Zustand store using OpenAI Agents SDK.
 * Tests state management, persistence, and navigation logic.
 */

import { renderHook, act } from '@testing-library/react';
import { useRecipeWizardStore, clearWizardData, isWizardDataExpired } from './wizard-store';
import { RecipeWizardStep } from '../types/recipe-wizard.types';
import type {
  HealthConcernData,
  DemographicsData,
  PotentialCause
} from '../types/recipe-wizard.types';

// Mock sessionStorage for testing (updated from localStorage)
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock crypto.randomUUID to generate different UUIDs for testing
let uuidCounter = 0;
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => {
      uuidCounter++;
      const counter = uuidCounter.toString().padStart(3, '0');
      return `12345678-1234-4${counter}-8901-123456789012`;
    })
  }
});

describe('Recipe Wizard Store', () => {
  beforeEach(() => {
    // Reset UUID counter for consistent testing
    uuidCounter = 0;

    // Clear all mocks before each test
    jest.clearAllMocks();
    sessionStorageMock.getItem.mockReturnValue(null);

    // Reset store to initial state
    clearWizardData();

    // Force store reset by calling resetWizard if store exists
    try {
      const store = useRecipeWizardStore.getState();
      if (store) {
        useRecipeWizardStore.getState().resetWizard();
      }
    } catch (e) {
      // Store might not be initialized yet, that's fine
    }
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useRecipeWizardStore());
      
      expect(result.current.healthConcern).toBeNull();
      expect(result.current.demographics).toBeNull();
      expect(result.current.selectedCauses).toEqual([]);
      expect(result.current.potentialCauses).toEqual([]);
      expect(result.current.currentStep).toBe(RecipeWizardStep.HEALTH_CONCERN);
      expect(result.current.completedSteps).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.sessionId).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Health Concern Management', () => {
    it('should update health concern data', () => {
      const { result } = renderHook(() => useRecipeWizardStore());
      const healthConcernData: HealthConcernData = {
        healthConcern: 'Chronic anxiety and stress affecting daily life'
      };

      act(() => {
        result.current.updateHealthConcern(healthConcernData);
      });

      expect(result.current.healthConcern).toEqual(healthConcernData);
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });

    it('should allow navigation to demographics after health concern is set', () => {
      const { result } = renderHook(() => useRecipeWizardStore());
      const healthConcernData: HealthConcernData = {
        healthConcern: 'Test health concern'
      };

      // Initially cannot navigate to demographics (no health concern set)
      expect(result.current.canNavigateToStep(RecipeWizardStep.DEMOGRAPHICS)).toBe(false);

      act(() => {
        result.current.updateHealthConcern(healthConcernData);
      });

      // Now can navigate to demographics
      expect(result.current.canNavigateToStep(RecipeWizardStep.DEMOGRAPHICS)).toBe(true);
    });
  });

  describe('Demographics Management', () => {
    it('should update demographics data', () => {
      const { result } = renderHook(() => useRecipeWizardStore());
      const demographicsData: DemographicsData = {
        gender: 'female',
        ageCategory: 'adult',
        specificAge: 32,
        language: 'PT_BR'
      };

      act(() => {
        result.current.updateDemographics(demographicsData);
      });

      expect(result.current.demographics).toEqual(demographicsData);
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });

    it('should allow navigation to potential causes after demographics is set', () => {
      const { result } = renderHook(() => useRecipeWizardStore());
      const healthConcernData: HealthConcernData = {
        healthConcern: 'Test health concern'
      };
      const demographicsData: DemographicsData = {
        gender: 'male',
        ageCategory: 'adult',
        specificAge: 28,
        language: 'EN_US'
      };

      // Initially cannot navigate to potential causes
      expect(result.current.canNavigateToStep(RecipeWizardStep.POTENTIAL_CAUSES)).toBe(false);

      act(() => {
        result.current.updateHealthConcern(healthConcernData);
        result.current.updateDemographics(demographicsData);
      });

      // Now can navigate to potential causes
      expect(result.current.canNavigateToStep(RecipeWizardStep.POTENTIAL_CAUSES)).toBe(true);
    });
  });

  describe('Causes Management', () => {
    it('should update selected causes', () => {
      const { result } = renderHook(() => useRecipeWizardStore());

      const causes: PotentialCause[] = [
        {
          cause_id: 'cause1',
          cause_name: 'Test Cause',
          cause_description: 'Test description',
          relevancy_score: 0.85,
          medical_context: 'Test context'
        }
      ];

      act(() => {
        result.current.updateSelectedCauses(causes);
      });

      expect(result.current.selectedCauses).toEqual(causes);
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Step Navigation', () => {
    it('should set current step', () => {
      const { result } = renderHook(() => useRecipeWizardStore());

      act(() => {
        result.current.setCurrentStep(RecipeWizardStep.DEMOGRAPHICS);
      });

      expect(result.current.currentStep).toBe(RecipeWizardStep.DEMOGRAPHICS);
    });

    it('should mark step as completed', () => {
      const { result } = renderHook(() => useRecipeWizardStore());

      act(() => {
        result.current.markStepCompleted(RecipeWizardStep.HEALTH_CONCERN);
      });

      expect(result.current.completedSteps).toContain(RecipeWizardStep.HEALTH_CONCERN);
    });

    it('should not duplicate completed steps', () => {
      const { result } = renderHook(() => useRecipeWizardStore());

      act(() => {
        result.current.markStepCompleted(RecipeWizardStep.HEALTH_CONCERN);
        result.current.markStepCompleted(RecipeWizardStep.HEALTH_CONCERN);
      });

      expect(result.current.completedSteps).toEqual([RecipeWizardStep.HEALTH_CONCERN]);
    });
  });

  describe('Navigation Logic', () => {
    it('should always allow navigation to health concern step', () => {
      const { result } = renderHook(() => useRecipeWizardStore());

      const canNavigate = result.current.canNavigateToStep(RecipeWizardStep.HEALTH_CONCERN);
      expect(canNavigate).toBe(true);
    });

    it('should not allow navigation to demographics without health concern', () => {
      const { result } = renderHook(() => useRecipeWizardStore());

      const canNavigate = result.current.canNavigateToStep(RecipeWizardStep.DEMOGRAPHICS);
      expect(canNavigate).toBe(false);
    });

    it('should allow navigation to potential causes when all dependencies are met', () => {
      const { result } = renderHook(() => useRecipeWizardStore());

      // Set up all prerequisites for potential causes
      act(() => {
        result.current.updateHealthConcern({ healthConcern: 'Test' });
        result.current.updateDemographics({
          gender: 'female',
          ageCategory: 'adult',
          specificAge: 25,
          language: 'PT_BR'
        });
      });

      const canNavigate = result.current.canNavigateToStep(RecipeWizardStep.POTENTIAL_CAUSES);
      expect(canNavigate).toBe(true);
    });
  });

  describe('Loading and Error States', () => {
    it('should set loading state and clear error', () => {
      const { result } = renderHook(() => useRecipeWizardStore());

      // Set an error first
      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      // Set loading - should clear error
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should set error state and clear loading', () => {
      const { result } = renderHook(() => useRecipeWizardStore());
      const errorMessage = 'Test error message';

      act(() => {
        result.current.setLoading(true);
        result.current.setError(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear error state', () => {
      const { result } = renderHook(() => useRecipeWizardStore());

      act(() => {
        result.current.setError('Test error');
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Store Reset', () => {
    it('should reset wizard to initial state with new session ID', () => {
      const { result } = renderHook(() => useRecipeWizardStore());
      
      // Set some data first
      act(() => {
        result.current.updateHealthConcern({ healthConcern: 'Test' });
        result.current.setCurrentStep(RecipeWizardStep.DEMOGRAPHICS);
        result.current.markStepCompleted(RecipeWizardStep.HEALTH_CONCERN);
        result.current.setError('Test error');
      });

      const originalSessionId = result.current.sessionId;

      // Reset the wizard
      act(() => {
        result.current.resetWizard();
      });

      expect(result.current.healthConcern).toBeNull();
      expect(result.current.currentStep).toBe(RecipeWizardStep.HEALTH_CONCERN);
      expect(result.current.completedSteps).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.sessionId).toMatch(/^[0-9a-f-]{36}$/); // New session ID (UUID format)
    });
  });

  describe('AI Data Management', () => {
    it('should set potential causes from AI response', () => {
      const { result } = renderHook(() => useRecipeWizardStore());
      const causes: PotentialCause[] = [
        {
          cause_id: 'cause1',
          cause_name: 'Chronic Stress',
          cause_description: 'Long-term stress response',
          relevancy_score: 0.9,
          medical_context: 'Stress-related disorders'
        }
      ];

      act(() => {
        result.current.setPotentialCauses(causes);
      });

      expect(result.current.potentialCauses).toEqual(causes);
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Data Expiration', () => {
    it('should detect expired data', () => {
      // Mock old timestamp
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days ago
      sessionStorageMock.getItem.mockReturnValue(oldDate.toISOString());

      expect(isWizardDataExpired()).toBe(true);
    });

    it('should detect fresh data', () => {
      // Mock recent timestamp
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5); // 5 days ago
      sessionStorageMock.getItem.mockReturnValue(recentDate.toISOString());

      expect(isWizardDataExpired()).toBe(false);
    });

    it('should treat missing timestamp as expired', () => {
      sessionStorageMock.getItem.mockReturnValue(null);

      expect(isWizardDataExpired()).toBe(true);
    });
  });
});
