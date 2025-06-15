/**
 * @fileoverview Custom hook for Essential Oil Recipe Creator wizard navigation logic.
 * Provides navigation controls, step validation, and progress tracking.
 */

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRecipeStore } from '../store/recipe-store';
import { WIZARD_STEPS, TOTAL_STEPS } from '../constants/recipe.constants';
import { RecipeStep } from '../types/recipe.types';

/**
 * Navigation result interface
 */
interface NavigationResult {
  success: boolean;
  error?: string;
  redirected?: boolean;
}

/**
 * Step information interface
 */
interface StepInfo {
  current: typeof WIZARD_STEPS[0];
  previous: typeof WIZARD_STEPS[0] | null;
  next: typeof WIZARD_STEPS[0] | null;
  progress: number;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Hook return interface
 */
interface UseRecipeNavigationReturn {
  // Current step information
  stepInfo: StepInfo;
  
  // Navigation functions
  goToStep: (step: RecipeStep) => Promise<NavigationResult>;
  goToNext: () => Promise<NavigationResult>;
  goToPrevious: () => Promise<NavigationResult>;
  goToFirst: () => Promise<NavigationResult>;
  startNewRecipe: () => Promise<NavigationResult>;
  
  // Validation functions
  canNavigateToStep: (step: RecipeStep) => boolean;
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
  
  // Progress functions
  getStepProgress: () => number;
  getCompletionPercentage: () => number;
  
  // Utility functions
  isStepCompleted: (step: RecipeStep) => boolean;
  markCurrentStepCompleted: () => void;
  getStepUrl: (step: RecipeStep) => string;
  
  // State
  isNavigating: boolean;
}

/**
 * Custom hook for recipe wizard navigation
 */
export function useRecipeWizardNavigation(): UseRecipeNavigationReturn {
  const router = useRouter();
  const {
    currentStep,
    completedSteps,
    setCurrentStep,
    markStepCompleted,
    canNavigateToStep: storeCanNavigateToStep,
    clearStepsAfter,
    resetWizard
  } = useRecipeStore();
  
  const { isLoading } = useRecipeStore();

  /**
   * Gets step configuration by step key
   */
  const getStepConfig = useCallback((step: RecipeStep) => {
    return WIZARD_STEPS.find(config => config.key === step);
  }, []);

  /**
   * Gets the URL for a specific step
   */
  const getStepUrl = useCallback((step: RecipeStep): string => {
    return `/dashboard/create-recipe/${step}`;
  }, []);

  /**
   * Current step information
   */
  const stepInfo = useMemo((): StepInfo => {
    const currentConfig = getStepConfig(currentStep);
    const currentIndex = WIZARD_STEPS.findIndex(step => step.key === currentStep);
    
    const previous = currentIndex > 0 ? WIZARD_STEPS[currentIndex - 1] : null;
    const next = currentIndex < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[currentIndex + 1] : null;
    
    const progress = currentIndex + 1;
    
    return {
      current: currentConfig || WIZARD_STEPS[0],
      previous,
      next,
      progress,
      isFirst: currentIndex === 0,
      isLast: currentIndex === WIZARD_STEPS.length - 1
    };
  }, [currentStep, getStepConfig]);

  /**
   * Checks if a step is completed
   */
  const isStepCompleted = useCallback((step: RecipeStep): boolean => {
    return completedSteps.includes(step);
  }, [completedSteps]);

  /**
   * Marks the current step as completed
   */
  const markCurrentStepCompleted = useCallback(() => {
    markStepCompleted(currentStep);
  }, [currentStep, markStepCompleted]);

  /**
   * Gets the current step progress (1-based)
   */
  const getStepProgress = useCallback((): number => {
    return stepInfo.progress;
  }, [stepInfo.progress]);

  /**
   * Gets the completion percentage
   */
  const getCompletionPercentage = useCallback((): number => {
    return Math.round((completedSteps.length / TOTAL_STEPS) * 100);
  }, [completedSteps.length]);

  /**
   * Checks if navigation to next step is possible
   */
  const canGoNext = useCallback((): boolean => {
    if (!stepInfo.next) return false;
    return storeCanNavigateToStep(stepInfo.next.key);
  }, [stepInfo.next, storeCanNavigateToStep]);

  /**
   * Checks if navigation to previous step is possible
   */
  const canGoPrevious = useCallback((): boolean => {
    return !stepInfo.isFirst;
  }, [stepInfo.isFirst]);

  /**
   * Navigates to a specific step with state clearing for backwards navigation
   */
  const goToStep = useCallback(async (step: RecipeStep): Promise<NavigationResult> => {
    try {
      // Check if navigation is allowed
      if (!storeCanNavigateToStep(step)) {
        return {
          success: false,
          error: 'Cannot navigate to this step. Please complete previous steps first.'
        };
      }

      // Determine if we're navigating backwards and clear future steps if needed
      const stepOrder = [
        RecipeStep.HEALTH_CONCERN,
        RecipeStep.DEMOGRAPHICS,
        RecipeStep.CAUSES,
        RecipeStep.SYMPTOMS,
        RecipeStep.PROPERTIES
        // Note: OILS step removed - oils are now nested within PROPERTIES
      ];

      const currentStepIndex = stepOrder.indexOf(currentStep);
      const targetStepIndex = stepOrder.indexOf(step);
      const isNavigatingBackwards = targetStepIndex < currentStepIndex;

      // If navigating backwards, clear data for steps after the target step
      if (isNavigatingBackwards) {
        console.log(`🔄 Navigating backwards from ${currentStep} to ${step}`);
        clearStepsAfter(step);
      }

      // Update store state first for immediate UI feedback
      const timestamp = new Date().toISOString();
      console.log(`🚀 [${timestamp}] Navigation: Setting current step in store:`, step);
      setCurrentStep(step);

      // Navigate to the step URL with prefetch for better performance
      const url = getStepUrl(step);
      console.log(`🌐 [${timestamp}] Navigation: Pushing to URL:`, url);

      // Prefetch the route for faster navigation
      router.prefetch(url);

      // Use replace instead of push for smoother navigation in development
      if (process.env.NODE_ENV === 'development') {
        router.replace(url);
      } else {
        router.push(url);
      }

      return {
        success: true,
        redirected: true
      };

    } catch (error) {
      console.error('Navigation error:', error);
      return {
        success: false,
        error: 'Failed to navigate to step'
      };
    }
  }, [storeCanNavigateToStep, setCurrentStep, getStepUrl, router, currentStep, clearStepsAfter]);

  /**
   * Navigates to the next step
   */
  const goToNext = useCallback(async (): Promise<NavigationResult> => {
    const timestamp = new Date().toISOString();
    console.log(`🎯 [${timestamp}] goToNext called:`, {
      currentStep,
      nextStep: stepInfo.next?.key,
      hasNext: !!stepInfo.next
    });

    if (!stepInfo.next) {
      console.log(`❌ [${timestamp}] goToNext: No next step available`);
      return {
        success: false,
        error: 'No next step available'
      };
    }

    // Mark current step as completed before moving to next
    console.log(`✅ [${timestamp}] goToNext: Marking current step completed:`, currentStep);
    markCurrentStepCompleted();

    console.log(`🚀 [${timestamp}] goToNext: Calling goToStep with:`, stepInfo.next.key);
    return goToStep(stepInfo.next.key);
  }, [stepInfo.next, markCurrentStepCompleted, goToStep, currentStep]);

  /**
   * Navigates to the previous step
   */
  const goToPrevious = useCallback(async (): Promise<NavigationResult> => {
    if (!stepInfo.previous) {
      return {
        success: false,
        error: 'No previous step available'
      };
    }

    return goToStep(stepInfo.previous.key);
  }, [stepInfo.previous, goToStep]);

  /**
   * Navigates to the first step
   */
  const goToFirst = useCallback(async (): Promise<NavigationResult> => {
    return goToStep(WIZARD_STEPS[0].key);
  }, [goToStep]);

  /**
   * Starts a new recipe by resetting all data and navigating to first step
   */
  const startNewRecipe = useCallback(async (): Promise<NavigationResult> => {
    try {
      console.log('🔄 Starting new recipe...');

      // Reset all wizard data
      resetWizard();

      // Navigate to the first step
      const url = getStepUrl(WIZARD_STEPS[0].key);
      router.push(url);

      return {
        success: true,
        redirected: true
      };
    } catch (error) {
      console.error('Error starting new recipe:', error);
      return {
        success: false,
        error: 'Failed to start new recipe'
      };
    }
  }, [resetWizard, getStepUrl, router]);

  return {
    // Current step information
    stepInfo,
    
    // Navigation functions
    goToStep,
    goToNext,
    goToPrevious,
    goToFirst,
    startNewRecipe,
    
    // Validation functions
    canNavigateToStep: storeCanNavigateToStep,
    canGoNext,
    canGoPrevious,
    
    // Progress functions
    getStepProgress,
    getCompletionPercentage,
    
    // Utility functions
    isStepCompleted,
    markCurrentStepCompleted,
    getStepUrl,
    
    // State
    isNavigating: isLoading
  };
}

/**
 * Hook for step validation utilities
 */
export function useStepValidation() {
  const store = useRecipeStore();

  /**
   * Validates if the current step data is complete
   */
  const validateCurrentStep = useCallback((): { isValid: boolean; errors: string[] } => {
    const { currentStep, healthConcern, demographics, selectedCauses, selectedSymptoms } = store;
    const errors: string[] = [];

    switch (currentStep) {
      case RecipeStep.HEALTH_CONCERN:
        if (!healthConcern || !healthConcern.healthConcern.trim()) {
          errors.push('Health concern is required');
        }
        break;

      case RecipeStep.DEMOGRAPHICS:
        if (!demographics) {
          errors.push('Demographics information is required');
        } else {
          if (!demographics.gender) {
            errors.push('Gender selection is required');
          }
          if (!demographics.ageCategory) {
            errors.push('Age category is required');
          }
          if (!demographics.specificAge || demographics.specificAge < 0) {
            errors.push('Valid age is required');
          }
        }
        break;

      case RecipeStep.CAUSES:
        if (selectedCauses.length === 0) {
          errors.push('At least one cause must be selected');
        }
        break;

      case RecipeStep.SYMPTOMS:
        if (selectedSymptoms.length === 0) {
          errors.push('At least one symptom must be selected');
        }
        break;

      case RecipeStep.PROPERTIES:
        // This step displays properties and nested oils, no validation needed
        break;

      default:
        errors.push('Unknown step');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [store]);

  /**
   * Gets validation errors for a specific step
   */
  const getStepValidationErrors = useCallback((step: RecipeStep): string[] => {
    const { healthConcern, demographics, selectedCauses, selectedSymptoms } = store;
    const errors: string[] = [];

    switch (step) {
      case RecipeStep.HEALTH_CONCERN:
        if (!healthConcern || !healthConcern.healthConcern.trim()) {
          errors.push('Health concern is required');
        }
        break;

      case RecipeStep.DEMOGRAPHICS:
        if (!demographics) {
          errors.push('Demographics information is required');
        }
        break;

      case RecipeStep.CAUSES:
        if (selectedCauses.length === 0) {
          errors.push('At least one cause must be selected');
        }
        break;

      case RecipeStep.SYMPTOMS:
        if (selectedSymptoms.length === 0) {
          errors.push('At least one symptom must be selected');
        }
        break;
    }

    return errors;
  }, [store]);

  return {
    validateCurrentStep,
    getStepValidationErrors
  };
}
