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
   * Complete AI streaming workflow with atomic batched updates
   * This is commonly used when AI streaming completes
   */
  const completeAIStreaming = useCallback((
    step: 'causes' | 'symptoms' | 'properties' | 'oils',
    data: PotentialCause[] | PotentialSymptom[] | TherapeuticProperty[] | PropertyOilSuggestions[],
    options: {
      nextStep?: RecipeStep;
      markCompleted?: boolean;
      clearErrors?: boolean;
      additionalUpdates?: Record<string, any>;
    } = {}
  ) => {
    const { nextStep, markCompleted = true, clearErrors = true, additionalUpdates = {} } = options;

    // Use store's atomic batchUpdateStepData for single state update
    const atomicUpdates: Parameters<typeof store.batchUpdateStepData>[0] = {
      ...additionalUpdates
    };

    // Set the appropriate streaming state to false and update data
    switch (step) {
      case 'causes':
        atomicUpdates.potentialCauses = data as PotentialCause[];
        break;
      case 'symptoms':
        atomicUpdates.potentialSymptoms = data as PotentialSymptom[];
        break;
      case 'properties':
        atomicUpdates.therapeuticProperties = data as TherapeuticProperty[];
        break;
      case 'oils':
        atomicUpdates.suggestedOils = data as PropertyOilSuggestions[];
        break;
    }

    // Add navigation if specified
    if (nextStep) {
      atomicUpdates.currentStep = nextStep;
    }

    // Clear errors if specified
    if (clearErrors) {
      atomicUpdates.error = null;
      atomicUpdates.streamingError = null;
    }

    // Mark step as completed if specified
    if (markCompleted) {
      const currentCompleted = store.completedSteps;
      const stepToComplete = getCurrentStepForType(step);
      if (!currentCompleted.includes(stepToComplete)) {
        atomicUpdates.completedSteps = [...currentCompleted, stepToComplete];
      }
    }

    // Perform single atomic update for all data changes
    store.batchUpdateStepData(atomicUpdates);

    // Update streaming states separately to avoid conflicts with data updates
    const streamingUpdates: Parameters<typeof updateStreamingStates>[0] = {};
    switch (step) {
      case 'causes':
        streamingUpdates.isStreamingCauses = false;
        break;
      case 'symptoms':
        streamingUpdates.isStreamingSymptoms = false;
        break;
      case 'properties':
        streamingUpdates.isStreamingProperties = false;
        break;
      case 'oils':
        streamingUpdates.isStreamingOils = false;
        break;
    }

    if (clearErrors) {
      streamingUpdates.streamingError = null;
    }

    updateStreamingStates(streamingUpdates);
  }, [updateStreamingStates, store]);

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
   * Handle AI streaming error with atomic batched updates
   */
  const handleStreamingError = useCallback((
    error: string,
    options: {
      step?: 'causes' | 'symptoms' | 'properties' | 'oils';
      preserveData?: boolean;
      retryable?: boolean;
    } = {}
  ) => {
    const { step, preserveData = true, retryable = true } = options;

    // Use atomic update for error state
    const atomicUpdates: Parameters<typeof store.batchUpdateStepData>[0] = {
      error: retryable ? `${error} (Click retry to try again)` : error
    };

    // Clear data if not preserving
    if (!preserveData && step) {
      switch (step) {
        case 'causes':
          atomicUpdates.potentialCauses = [];
          break;
        case 'symptoms':
          atomicUpdates.potentialSymptoms = [];
          break;
        case 'properties':
          atomicUpdates.therapeuticProperties = [];
          break;
        case 'oils':
          atomicUpdates.suggestedOils = [];
          break;
      }
    }

    // Perform atomic update
    store.batchUpdateStepData(atomicUpdates);

    // Update streaming states
    const streamingUpdates: Parameters<typeof updateStreamingStates>[0] = {
      streamingError: error
    };

    if (step) {
      // Stop only the specific streaming step
      switch (step) {
        case 'causes':
          streamingUpdates.isStreamingCauses = false;
          break;
        case 'symptoms':
          streamingUpdates.isStreamingSymptoms = false;
          break;
        case 'properties':
          streamingUpdates.isStreamingProperties = false;
          break;
        case 'oils':
          streamingUpdates.isStreamingOils = false;
          break;
      }
    } else {
      // Stop all streaming
      streamingUpdates.isStreamingCauses = false;
      streamingUpdates.isStreamingSymptoms = false;
      streamingUpdates.isStreamingProperties = false;
      streamingUpdates.isStreamingOils = false;
    }

    updateStreamingStates(streamingUpdates);
  }, [updateStreamingStates, store]);

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

  /**
   * Complex workflow transition with atomic batched updates
   * Handles complete step transitions including data, navigation, and state cleanup
   */
  const performWorkflowTransition = useCallback((
    transition: {
      fromStep: 'causes' | 'symptoms' | 'properties' | 'oils';
      toStep: RecipeStep;
      data: PotentialCause[] | PotentialSymptom[] | TherapeuticProperty[] | PropertyOilSuggestions[];
      clearPreviousErrors?: boolean;
      markPreviousCompleted?: boolean;
      additionalUpdates?: Record<string, any>;
    }
  ) => {
    const {
      fromStep,
      toStep,
      data,
      clearPreviousErrors = true,
      markPreviousCompleted = true,
      additionalUpdates = {}
    } = transition;

    // Build atomic updates object
    const atomicUpdates: Parameters<typeof store.batchUpdateStepData>[0] = {
      currentStep: toStep,
      ...additionalUpdates
    };

    // Update data based on step
    switch (fromStep) {
      case 'causes':
        atomicUpdates.potentialCauses = data as PotentialCause[];
        break;
      case 'symptoms':
        atomicUpdates.potentialSymptoms = data as PotentialSymptom[];
        break;
      case 'properties':
        atomicUpdates.therapeuticProperties = data as TherapeuticProperty[];
        break;
      case 'oils':
        atomicUpdates.suggestedOils = data as PropertyOilSuggestions[];
        break;
    }

    // Clear errors if specified
    if (clearPreviousErrors) {
      atomicUpdates.error = null;
      atomicUpdates.streamingError = null;
    }

    // Mark previous step as completed
    if (markPreviousCompleted) {
      const currentCompleted = store.completedSteps;
      const stepToComplete = getCurrentStepForType(fromStep);
      if (!currentCompleted.includes(stepToComplete)) {
        atomicUpdates.completedSteps = [...currentCompleted, stepToComplete];
      }
    }

    // Perform single atomic update
    store.batchUpdateStepData(atomicUpdates);

    // Update streaming states
    const streamingUpdates: Parameters<typeof updateStreamingStates>[0] = {};
    switch (fromStep) {
      case 'causes':
        streamingUpdates.isStreamingCauses = false;
        break;
      case 'symptoms':
        streamingUpdates.isStreamingSymptoms = false;
        break;
      case 'properties':
        streamingUpdates.isStreamingProperties = false;
        break;
      case 'oils':
        streamingUpdates.isStreamingOils = false;
        break;
    }

    if (clearPreviousErrors) {
      streamingUpdates.streamingError = null;
    }

    updateStreamingStates(streamingUpdates);
  }, [store, updateStreamingStates]);

  /**
   * Batch multiple state updates with performance optimization
   */
  const batchMultipleUpdates = useCallback((
    updates: {
      stepData?: Parameters<typeof store.batchUpdateStepData>[0];
      streamingStates?: Parameters<typeof updateStreamingStates>[0];
      loadingAndError?: { isLoading?: boolean; error?: string | null };
    }
  ) => {
    const { stepData, streamingStates, loadingAndError } = updates;

    // Perform step data updates first (most important)
    if (stepData) {
      store.batchUpdateStepData(stepData);
    }

    // Then update streaming states
    if (streamingStates) {
      updateStreamingStates(streamingStates);
    }

    // Finally update loading/error states
    if (loadingAndError) {
      updateLoadingAndError(loadingAndError);
    }
  }, [store, updateStreamingStates, updateLoadingAndError]);

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

    // Advanced batching functions
    performWorkflowTransition,
    batchMultipleUpdates,

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
