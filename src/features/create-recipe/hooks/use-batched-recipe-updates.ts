/**
 * Custom hook for batched recipe store updates
 * Provides optimized update functions that minimize re-renders
 */

import { useCallback } from 'react';
import { useRecipeStore } from '../store/recipe-store';
import type { 
  RecipeStep, 
  HealthConcernData, 
  DemographicsData, 
  PotentialCause, 
  PotentialSymptom,
  TherapeuticProperty,
  PropertyOilSuggestions
} from '../types/recipe-types';

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
    store.batchUpdateStreamingState(updates);
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
    store.batchUpdateStepData(updates);
  }, [store]);

  /**
   * Batch update loading and error states
   */
  const updateLoadingAndError = useCallback((updates: {
    isLoading?: boolean;
    error?: string | null;
  }) => {
    store.batchUpdateLoadingAndError(updates);
  }, [store]);

  /**
   * Complete AI streaming workflow with batched updates
   * This is commonly used when AI streaming completes
   */
  const completeAIStreaming = useCallback((
    step: 'causes' | 'symptoms' | 'properties' | 'oils',
    data: PotentialCause[] | PotentialSymptom[] | TherapeuticProperty[] | PropertyOilSuggestions[],
    nextStep?: RecipeStep
  ) => {
    const streamingUpdates: Parameters<typeof updateStreamingStates>[0] = {
      streamingError: null
    };

    const stepUpdates: Parameters<typeof updateStepData>[0] = {};

    // Set the appropriate streaming state to false and update data
    switch (step) {
      case 'causes':
        streamingUpdates.isStreamingCauses = false;
        stepUpdates.potentialCauses = data as PotentialCause[];
        break;
      case 'symptoms':
        streamingUpdates.isStreamingSymptoms = false;
        stepUpdates.potentialSymptoms = data as PotentialSymptom[];
        break;
      case 'properties':
        streamingUpdates.isStreamingProperties = false;
        stepUpdates.therapeuticProperties = data as TherapeuticProperty[];
        break;
      case 'oils':
        streamingUpdates.isStreamingOils = false;
        stepUpdates.suggestedOils = data as PropertyOilSuggestions[];
        break;
    }

    // Add next step if provided
    if (nextStep) {
      stepUpdates.currentStep = nextStep;
    }

    // Batch all updates together
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
    const updates: Parameters<typeof updateStepData>[0] = {
      currentStep: step
    };

    if (markCompleted) {
      // Get current completed steps and add new ones
      const currentCompleted = store.getState().completedSteps;
      const newCompleted = [...new Set([...currentCompleted, ...markCompleted])];
      updates.completedSteps = newCompleted;
    }

    updateStepData(updates);
  }, [updateStepData, store]);

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
