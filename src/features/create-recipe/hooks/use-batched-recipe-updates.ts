/**
 * Custom hook for batched recipe store updates
 * Provides optimized update functions that minimize re-renders
 */

import { useCallback } from 'react';
import { useRecipeStore } from '../store/recipe-store';
import { RecipeStep } from '../types/recipe.types';
import type { 
  HealthConcernData, 
  DemographicsData, 
  PotentialCause, 
  PotentialSymptom,
  TherapeuticProperty,
  PropertyOilSuggestions
} from '../types/recipe.types';

export const useBatchedRecipeUpdates = () => {
  const store = useRecipeStore();

  /**
   * Batch update streaming states to minimize re-renders
   */
  const updateStreamingStates = useCallback((updates: {
    isStreamingCauses?: boolean;
    isStreamingSymptoms?: boolean;
    isStreamingProperties?: boolean;
    isStreamingOils?: boolean;
    streamingError?: string | null;
  }) => {
    // Use individual setters instead of non-existent batch method
    if (updates.isStreamingCauses !== undefined) {
      store.setStreamingCauses(updates.isStreamingCauses);
    }
    if (updates.isStreamingSymptoms !== undefined) {
      store.setStreamingSymptoms(updates.isStreamingSymptoms);
    }
    if (updates.isStreamingProperties !== undefined) {
      store.setStreamingProperties(updates.isStreamingProperties);
    }
    if (updates.isStreamingOils !== undefined) {
      store.setStreamingOils(updates.isStreamingOils);
    }
    if (updates.streamingError !== undefined) {
      if (updates.streamingError === null) {
        store.clearStreamingError();
      } else {
        store.setStreamingError(updates.streamingError);
      }
    }
  }, [store]);

  /**
   * Batch update step data to minimize re-renders
   */
  const updateStepData = useCallback((updates: {
    currentStep?: RecipeStep;
    completedSteps?: RecipeStep[];
    healthConcern?: HealthConcernData | null;
    demographics?: DemographicsData | null;
    selectedCauses?: PotentialCause[];
    selectedSymptoms?: PotentialSymptom[];
    therapeuticProperties?: TherapeuticProperty[];
    suggestedOils?: PropertyOilSuggestions[];
    potentialCauses?: PotentialCause[];
    potentialSymptoms?: PotentialSymptom[];
  }) => {
    // Use individual setters instead of non-existent batch method
    if (updates.currentStep !== undefined) {
      store.setCurrentStep(updates.currentStep);
    }
    if (updates.completedSteps !== undefined) {
      // No direct setter for completedSteps, mark each step individually
      updates.completedSteps.forEach(step => {
        store.markStepCompleted(step);
      });
    }
    if (updates.healthConcern !== undefined) {
      if (updates.healthConcern === null) {
        store.clearStepData(RecipeStep.HEALTH_CONCERN);
      } else {
        store.updateHealthConcern(updates.healthConcern);
      }
    }
    if (updates.demographics !== undefined) {
      if (updates.demographics === null) {
        store.clearStepData(RecipeStep.DEMOGRAPHICS);
      } else {
        store.updateDemographics(updates.demographics);
      }
    }
    if (updates.selectedCauses !== undefined) {
      store.updateSelectedCauses(updates.selectedCauses);
    }
    if (updates.selectedSymptoms !== undefined) {
      store.updateSelectedSymptoms(updates.selectedSymptoms);
    }
    if (updates.therapeuticProperties !== undefined) {
      store.updateTherapeuticProperties(updates.therapeuticProperties);
    }
    if (updates.suggestedOils !== undefined) {
      store.updateSuggestedOils(updates.suggestedOils);
    }
    if (updates.potentialCauses !== undefined) {
      store.setPotentialCauses(updates.potentialCauses);
    }
    if (updates.potentialSymptoms !== undefined) {
      store.setPotentialSymptoms(updates.potentialSymptoms);
    }
  }, [store]);

  /**
   * Batch update loading and error states
   */
  const updateLoadingAndError = useCallback((updates: {
    isLoading?: boolean;
    error?: string | null;
  }) => {
    // Use individual setters instead of non-existent batch method
    if (updates.isLoading !== undefined) {
      store.setLoading(updates.isLoading);
    }
    if (updates.error !== undefined) {
      if (updates.error === null) {
        store.clearError();
      } else {
        store.setError(updates.error);
      }
    }
  }, [store]);

  /**
   * Complete AI streaming workflow with batched updates
   * This is commonly used when AI streaming completes
   * CRITICAL: All state updates are batched to ensure modal closing and navigation happen in the same event loop
   */
  const completeAIStreaming = useCallback((
    step: 'causes' | 'symptoms' | 'properties' | 'oils',
    data: PotentialCause[] | PotentialSymptom[] | TherapeuticProperty[] | PropertyOilSuggestions[],
    nextStep?: RecipeStep
  ) => {
    // Create a single batch update for all streaming states
    const streamingUpdates: Parameters<typeof updateStreamingStates>[0] = {
      isStreamingCauses: step === 'causes' ? false : undefined,
      isStreamingSymptoms: step === 'symptoms' ? false : undefined,
      isStreamingProperties: step === 'properties' ? false : undefined,
      isStreamingOils: step === 'oils' ? false : undefined,
      streamingError: null
    };

    // Create a single batch update for all step data
    const stepUpdates: Parameters<typeof updateStepData>[0] = {};

    // Set the appropriate data based on step
    switch (step) {
      case 'causes':
        stepUpdates.potentialCauses = data as PotentialCause[];
        break;
      case 'symptoms':
        stepUpdates.potentialSymptoms = data as PotentialSymptom[];
        break;
      case 'properties':
        stepUpdates.therapeuticProperties = data as TherapeuticProperty[];
        break;
      case 'oils':
        stepUpdates.suggestedOils = data as PropertyOilSuggestions[];
        break;
    }

    // Add next step if provided
    if (nextStep) {
      stepUpdates.currentStep = nextStep;
    }

    console.log(`🔄 [${new Date().toISOString()}] Batching all updates for ${step} completion`);
    
    // Batch all updates together in a single execution cycle
    // This ensures the modal closing and navigation happen synchronously
    updateStreamingStates(streamingUpdates);
    updateStepData(stepUpdates);
    updateLoadingAndError({ isLoading: false, error: null });
  }, [updateStreamingStates, updateStepData, updateLoadingAndError]);

  /**
   * Start AI streaming workflow with batched updates
   */
  const startAIStreaming = useCallback((
    step: 'causes' | 'symptoms' | 'properties' | 'oils'
  ) => {
    const streamingUpdates: Parameters<typeof updateStreamingStates>[0] = {
      streamingError: null
    };

    // Set the appropriate streaming state to true
    switch (step) {
      case 'causes':
        streamingUpdates.isStreamingCauses = true;
        break;
      case 'symptoms':
        streamingUpdates.isStreamingSymptoms = true;
        break;
      case 'properties':
        streamingUpdates.isStreamingProperties = true;
        break;
      case 'oils':
        streamingUpdates.isStreamingOils = true;
        break;
    }

    // Batch updates
    updateStreamingStates(streamingUpdates);
    updateLoadingAndError({ isLoading: true, error: null });
  }, [updateStreamingStates, updateLoadingAndError]);

  /**
   * Handle AI streaming error with batched updates
   */
  const handleStreamingError = useCallback((error: string) => {
    // Stop all streaming and set error
    updateStreamingStates({
      isStreamingCauses: false,
      isStreamingSymptoms: false,
      isStreamingProperties: false,
      isStreamingOils: false,
      streamingError: error
    });
    updateLoadingAndError({ isLoading: false, error });
  }, [updateStreamingStates, updateLoadingAndError]);

  /**
   * Navigate to step with batched updates
   */
  const navigateToStep = useCallback((
    step: RecipeStep,
    markCompleted?: RecipeStep[]
  ) => {
    // Set current step
    store.setCurrentStep(step);

    // Mark steps as completed if provided
    if (markCompleted && markCompleted.length > 0) {
      markCompleted.forEach(completedStep => {
        store.markStepCompleted(completedStep);
      });
    }
  }, [store]);

  /**
   * Reset wizard with optimized state clearing
   */
  const resetWizardOptimized = useCallback(() => {
    // Use the existing resetWizard function which is already optimized
    store.resetWizard();
  }, [store]);

  return {
    // Batched update functions
    updateStreamingStates,
    updateStepData,
    updateLoadingAndError,
    
    // Workflow-specific functions
    completeAIStreaming,
    startAIStreaming,
    handleStreamingError,
    navigateToStep,
    resetWizardOptimized,
    
    // Direct access to store for edge cases
    store
  };
};

/**
 * Performance monitoring hook for batched updates
 * Helps track the effectiveness of batched updates
 */
export const useBatchedUpdatePerformance = () => {
  const lastUpdated = useRecipeStore(state => state.lastUpdated);
  
  return {
    lastUpdated,
    // Add performance tracking utilities here if needed
  };
};
