/**
 * @fileoverview Unit tests for Essential Oil Recipe Creator navigation hook.
 * Tests navigation logic, step validation, and state management.
 */

import { renderHook, act } from '@testing-library/react';
import { useRecipeWizardNavigation } from './use-recipe-navigation';
import { useRecipeStore } from '../store/recipe-store';
import { RecipeStep } from '../types/recipe.types';

// Mock the store
jest.mock('../store/recipe-store');

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/create-recipe'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

describe('useRecipeWizardNavigation', () => {
  const mockStore = {
    currentStep: RecipeStep.HEALTH_CONCERN,
    completedSteps: [],
    healthConcern: null,
    demographics: null,
    selectedCauses: [],
    selectedSymptoms: [],
    therapeuticProperties: [],
    setCurrentStep: jest.fn(),
    markStepCompleted: jest.fn(),
    canNavigateToStep: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRecipeStore as jest.Mock).mockReturnValue(mockStore);
  });

  describe('Step Information', () => {
    it('should provide correct step information for first step', () => {
      mockStore.currentStep = RecipeStep.HEALTH_CONCERN;
      
      const { result } = renderHook(() => useRecipeWizardNavigation());

      expect(result.current.stepInfo.current.key).toBe(RecipeStep.HEALTH_CONCERN);
      expect(result.current.stepInfo.current.title).toBe('Health Concern');
      expect(result.current.stepInfo.isFirst).toBe(true);
      expect(result.current.stepInfo.isLast).toBe(false);
      expect(result.current.stepInfo.previous).toBeNull();
      expect(result.current.stepInfo.next?.key).toBe(RecipeStep.DEMOGRAPHICS);
      expect(result.current.stepInfo.progress).toBe(1);
    });

    it('should provide correct step information for middle step', () => {
      mockStore.currentStep = RecipeStep.CAUSES;
      
      const { result } = renderHook(() => useRecipeWizardNavigation());

      expect(result.current.stepInfo.current.key).toBe(RecipeStep.CAUSES);
      expect(result.current.stepInfo.current.title).toBe('Potential Causes');
      expect(result.current.stepInfo.isFirst).toBe(false);
      expect(result.current.stepInfo.isLast).toBe(false);
      expect(result.current.stepInfo.previous?.key).toBe(RecipeStep.DEMOGRAPHICS);
      expect(result.current.stepInfo.next?.key).toBe(RecipeStep.SYMPTOMS);
      expect(result.current.stepInfo.progress).toBe(3);
    });

    it('should provide correct step information for last step', () => {
      mockStore.currentStep = RecipeStep.PROPERTIES;

      const { result } = renderHook(() => useRecipeWizardNavigation());

      expect(result.current.stepInfo.current.key).toBe(RecipeStep.PROPERTIES);
      expect(result.current.stepInfo.current.title).toBe('Therapeutic Properties');
      expect(result.current.stepInfo.isFirst).toBe(false);
      expect(result.current.stepInfo.isLast).toBe(true);
      expect(result.current.stepInfo.previous?.key).toBe(RecipeStep.SYMPTOMS);
      expect(result.current.stepInfo.next).toBeNull();
      expect(result.current.stepInfo.progress).toBe(5);
    });
  });

  describe('Navigation Functions', () => {
    it('should go to next step when available', async () => {
      mockStore.currentStep = RecipeStep.HEALTH_CONCERN;
      mockStore.canNavigateToStep.mockReturnValue(true);

      const { result } = renderHook(() => useRecipeWizardNavigation());
      
      await act(async () => {
        await result.current.goToNext();
      });
      
      expect(mockStore.setCurrentStep).toHaveBeenCalledWith(RecipeStep.DEMOGRAPHICS);
    });

    it('should not go to next step when at last step', async () => {
      mockStore.currentStep = RecipeStep.OILS;

      const { result } = renderHook(() => useRecipeWizardNavigation());

      await act(async () => {
        await result.current.goToNext();
      });

      expect(mockStore.setCurrentStep).not.toHaveBeenCalled();
    });

    it('should go to previous step when available', async () => {
      mockStore.currentStep = RecipeStep.DEMOGRAPHICS;

      const { result } = renderHook(() => useRecipeWizardNavigation());

      await act(async () => {
        await result.current.goToPrevious();
      });

      expect(mockStore.setCurrentStep).toHaveBeenCalledWith(RecipeStep.HEALTH_CONCERN);
    });

    it('should not go to previous step when at first step', async () => {
      mockStore.currentStep = RecipeStep.HEALTH_CONCERN;

      const { result } = renderHook(() => useRecipeWizardNavigation());

      await act(async () => {
        await result.current.goToPrevious();
      });

      expect(mockStore.setCurrentStep).not.toHaveBeenCalled();
    });

    it('should go to specific step when navigation is allowed', async () => {
      mockStore.canNavigateToStep.mockReturnValue(true);

      const { result } = renderHook(() => useRecipeWizardNavigation());
      
      await act(async () => {
        await result.current.goToStep(RecipeStep.CAUSES);
      });
      
      expect(mockStore.canNavigateToStep).toHaveBeenCalledWith(RecipeStep.CAUSES);
      expect(mockStore.setCurrentStep).toHaveBeenCalledWith(RecipeStep.CAUSES);
    });

    it('should not go to specific step when navigation is not allowed', async () => {
      mockStore.canNavigateToStep.mockReturnValue(false);
      
      const { result } = renderHook(() => useRecipeWizardNavigation());
      
      await act(async () => {
        await result.current.goToStep(RecipeStep.CAUSES);
      });
      
      expect(mockStore.canNavigateToStep).toHaveBeenCalledWith(RecipeStep.CAUSES);
      expect(mockStore.setCurrentStep).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Validation', () => {
    it('should check if can go to next step', () => {
      mockStore.currentStep = RecipeStep.HEALTH_CONCERN;
      mockStore.canNavigateToStep.mockReturnValue(true);
      
      const { result } = renderHook(() => useRecipeWizardNavigation());

      const canGoNext = result.current.canGoNext();
      
      expect(canGoNext).toBe(true);
      expect(mockStore.canNavigateToStep).toHaveBeenCalledWith(RecipeStep.DEMOGRAPHICS);
    });

    it('should return false for can go next when at last step', () => {
      mockStore.currentStep = RecipeStep.OILS;
      
      const { result } = renderHook(() => useRecipeWizardNavigation());

      const canGoNext = result.current.canGoNext();

      expect(canGoNext).toBe(false);
    });

    it('should check if can go to previous step', () => {
      mockStore.currentStep = RecipeStep.DEMOGRAPHICS;

      const { result } = renderHook(() => useRecipeWizardNavigation());

      const canGoPrevious = result.current.canGoPrevious();

      expect(canGoPrevious).toBe(true);
    });

    it('should return false for can go previous when at first step', () => {
      mockStore.currentStep = RecipeStep.HEALTH_CONCERN;

      const { result } = renderHook(() => useRecipeWizardNavigation());

      const canGoPrevious = result.current.canGoPrevious();

      expect(canGoPrevious).toBe(false);
    });

    it('should delegate navigation validation to store', () => {
      mockStore.canNavigateToStep.mockReturnValue(true);

      const { result } = renderHook(() => useRecipeWizardNavigation());
      
      const canNavigate = result.current.canNavigateToStep(RecipeStep.SYMPTOMS);
      
      expect(canNavigate).toBe(true);
      expect(mockStore.canNavigateToStep).toHaveBeenCalledWith(RecipeStep.SYMPTOMS);
    });
  });

  describe('Step Completion', () => {
    it('should check if step is completed', () => {
      mockStore.completedSteps = [RecipeStep.HEALTH_CONCERN, RecipeStep.DEMOGRAPHICS];

      const { result } = renderHook(() => useRecipeWizardNavigation());

      expect(result.current.isStepCompleted(RecipeStep.HEALTH_CONCERN)).toBe(true);
      expect(result.current.isStepCompleted(RecipeStep.DEMOGRAPHICS)).toBe(true);
      expect(result.current.isStepCompleted(RecipeStep.CAUSES)).toBe(false);
    });

    it('should mark current step as completed', () => {
      mockStore.currentStep = RecipeStep.HEALTH_CONCERN;

      const { result } = renderHook(() => useRecipeWizardNavigation());

      act(() => {
        result.current.markCurrentStepCompleted();
      });

      expect(mockStore.markStepCompleted).toHaveBeenCalledWith(RecipeStep.HEALTH_CONCERN);
    });

    it('should calculate completion percentage', () => {
      mockStore.completedSteps = [RecipeStep.HEALTH_CONCERN, RecipeStep.DEMOGRAPHICS];

      const { result } = renderHook(() => useRecipeWizardNavigation());

      const percentage = result.current.getCompletionPercentage();

      // 2 completed out of 6 total steps = 33% (rounded)
      expect(percentage).toBe(33);
    });

    it('should return 0% when no steps completed', () => {
      mockStore.completedSteps = [];

      const { result } = renderHook(() => useRecipeWizardNavigation());

      const percentage = result.current.getCompletionPercentage();

      expect(percentage).toBe(0);
    });

    it('should return 100% when all steps completed', () => {
      mockStore.completedSteps = [
        RecipeStep.HEALTH_CONCERN,
        RecipeStep.DEMOGRAPHICS,
        RecipeStep.CAUSES,
        RecipeStep.SYMPTOMS,
        RecipeStep.PROPERTIES,
        RecipeStep.OILS
      ];
      
      const { result } = renderHook(() => useRecipeWizardNavigation());

      const percentage = result.current.getCompletionPercentage();

      expect(percentage).toBe(100);
    });
  });

  describe('Navigation with Step Completion', () => {
    it('should mark current step as completed when going to next', async () => {
      mockStore.currentStep = RecipeStep.HEALTH_CONCERN;
      mockStore.canNavigateToStep.mockReturnValue(true);

      const { result } = renderHook(() => useRecipeWizardNavigation());

      await act(async () => {
        await result.current.goToNext();
      });

      expect(mockStore.markStepCompleted).toHaveBeenCalledWith(RecipeStep.HEALTH_CONCERN);
      expect(mockStore.setCurrentStep).toHaveBeenCalledWith(RecipeStep.DEMOGRAPHICS);
    });

    it('should not navigate if at last step', async () => {
      mockStore.currentStep = RecipeStep.OILS;

      const { result } = renderHook(() => useRecipeWizardNavigation());

      const result_nav = await act(async () => {
        return await result.current.goToNext();
      });

      expect(result_nav.success).toBe(false);
      expect(result_nav.error).toBe('No next step available');
      expect(mockStore.setCurrentStep).not.toHaveBeenCalled();
    });

    it('should return navigation result with success status', async () => {
      mockStore.currentStep = RecipeStep.HEALTH_CONCERN;
      mockStore.canNavigateToStep.mockReturnValue(true);

      const { result } = renderHook(() => useRecipeWizardNavigation());

      const navigationResult = await act(async () => {
        return await result.current.goToNext();
      });

      expect(navigationResult.success).toBe(true);
      expect(navigationResult.redirected).toBe(true);
    });
  });
});
