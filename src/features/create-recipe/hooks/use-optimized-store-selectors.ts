/**
 * Optimized Store Selectors
 * Custom hooks that provide optimized subscriptions to the recipe store
 * with shallow comparison and memoization to prevent unnecessary re-renders
 */

import { useCallback, useMemo, useRef } from 'react';
import { useRecipeStore } from '../store/recipe-store';
import type { RecipeWizardState } from '../types/recipe.types';
import { selectorPerformanceAnalyzer } from '@/lib/performance/selector-performance-analyzer';

/**
 * Shallow comparison function for objects
 */
function shallowEqual<T extends Record<string, any>>(a: T, b: T): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  
  return true;
}

/**
 * Custom hook for optimized store subscriptions with shallow comparison
 */
export function useOptimizedStoreSelector<T>(
  selector: (state: RecipeWizardState) => T,
  equalityFn?: (a: T, b: T) => boolean
): T {
  const equalityFnRef = useRef(equalityFn);
  equalityFnRef.current = equalityFn;

  return useRecipeStore(
    useCallback(selector, []),
    equalityFnRef.current || ((a, b) => {
      // Use shallow comparison for objects, strict equality for primitives
      if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
        return shallowEqual(a as any, b as any);
      }
      return a === b;
    })
  );
}

/**
 * Optimized selector for navigation state only
 */
export const useOptimizedNavigation = () => {
  return useOptimizedStoreSelector(
    useCallback((state) => ({
      currentStep: state.currentStep,
      completedSteps: state.completedSteps,
      canNavigateToStep: state.canNavigateToStep
    }), [])
  );
};

/**
 * Optimized selector for navigation actions only
 */
export const useOptimizedNavigationActions = () => {
  return useOptimizedStoreSelector(
    useCallback((state) => ({
      setCurrentStep: state.setCurrentStep,
      markStepCompleted: state.markStepCompleted
    }), [])
  );
};

/**
 * Optimized selector for form data only
 */
export const useOptimizedFormData = () => {
  return useOptimizedStoreSelector(
    useCallback((state) => ({
      healthConcern: state.healthConcern,
      demographics: state.demographics
    }), [])
  );
};

/**
 * Optimized selector for selection data only
 */
export const useOptimizedSelectionData = () => {
  return useOptimizedStoreSelector(
    useCallback((state) => ({
      selectedCauses: state.selectedCauses,
      selectedSymptoms: state.selectedSymptoms,
      therapeuticProperties: state.therapeuticProperties,
      suggestedOils: state.suggestedOils
    }), [])
  );
};

/**
 * Optimized selector for API data only
 */
export const useOptimizedApiData = () => {
  return useOptimizedStoreSelector(
    useCallback((state) => ({
      potentialCauses: state.potentialCauses,
      potentialSymptoms: state.potentialSymptoms
    }), [])
  );
};

/**
 * Optimized selector for loading states only
 */
export const useOptimizedLoadingStates = () => {
  return useOptimizedStoreSelector(
    useCallback((state) => ({
      isLoading: state.isLoading,
      error: state.error
    }), [])
  );
};

/**
 * Optimized selector for streaming states only
 */
export const useOptimizedStreamingStates = () => {
  return useOptimizedStoreSelector(
    useCallback((state) => ({
      isStreamingCauses: state.isStreamingCauses,
      isStreamingSymptoms: state.isStreamingSymptoms,
      isStreamingProperties: state.isStreamingProperties,
      isStreamingOils: state.isStreamingOils,
      streamingError: state.streamingError
    }), [])
  );
};

/**
 * Optimized selector for specific step streaming state
 */
export const useOptimizedStepStreaming = (step: 'causes' | 'symptoms' | 'properties' | 'oils') => {
  return useOptimizedStoreSelector(
    useCallback((state) => {
      switch (step) {
        case 'causes': return state.isStreamingCauses;
        case 'symptoms': return state.isStreamingSymptoms;
        case 'properties': return state.isStreamingProperties;
        case 'oils': return state.isStreamingOils;
        default: return false;
      }
    }, [step])
  );
};

/**
 * Optimized selector for data counts only (for display purposes)
 */
export const useOptimizedDataCounts = () => {
  return useOptimizedStoreSelector(
    useCallback((state) => ({
      potentialCausesCount: state.potentialCauses.length,
      potentialSymptomsCount: state.potentialSymptoms.length,
      selectedCausesCount: state.selectedCauses.length,
      selectedSymptomsCount: state.selectedSymptoms.length,
      therapeuticPropertiesCount: state.therapeuticProperties.length,
      suggestedOilsCount: state.suggestedOils.length
    }), [])
  );
};

/**
 * Optimized selector for actions only (prevents re-renders when data changes)
 */
export const useOptimizedActions = () => {
  return useOptimizedStoreSelector(
    useCallback((state) => ({
      // Data update actions
      updateHealthConcern: state.updateHealthConcern,
      updateDemographics: state.updateDemographics,
      updateSelectedCauses: state.updateSelectedCauses,
      updateSelectedSymptoms: state.updateSelectedSymptoms,
      updateTherapeuticProperties: state.updateTherapeuticProperties,
      updateSuggestedOils: state.updateSuggestedOils,
      
      // API data actions
      setPotentialCauses: state.setPotentialCauses,
      setPotentialSymptoms: state.setPotentialSymptoms,
      
      // State management actions
      setLoading: state.setLoading,
      setError: state.setError,
      clearError: state.clearError,
      
      // Streaming actions
      setStreamingCauses: state.setStreamingCauses,
      setStreamingSymptoms: state.setStreamingSymptoms,
      setStreamingProperties: state.setStreamingProperties,
      setStreamingOils: state.setStreamingOils,
      setStreamingError: state.setStreamingError,
      clearStreamingError: state.clearStreamingError,
      
      // Navigation actions
      setCurrentStep: state.setCurrentStep,
      markStepCompleted: state.markStepCompleted,
      
      // Utility actions
      resetWizard: state.resetWizard,
      batchUpdateStepData: state.batchUpdateStepData
    }), [])
  );
};

/**
 * Optimized selector for minimal wizard state (for containers)
 */
export const useOptimizedWizardState = () => {
  return useOptimizedStoreSelector(
    useCallback((state) => ({
      currentStep: state.currentStep,
      isLoading: state.isLoading,
      error: state.error,
      sessionId: state.sessionId
    }), [])
  );
};

/**
 * Optimized selector for step completion status
 */
export const useOptimizedStepCompletion = () => {
  return useOptimizedStoreSelector(
    useCallback((state) => ({
      completedSteps: state.completedSteps,
      hasHealthConcern: !!state.healthConcern,
      hasDemographics: !!state.demographics,
      hasSelectedCauses: state.selectedCauses.length > 0,
      hasSelectedSymptoms: state.selectedSymptoms.length > 0,
      hasTherapeuticProperties: state.therapeuticProperties.length > 0
    }), [])
  );
};

/**
 * Hook for creating custom optimized selectors
 */
export const useCustomOptimizedSelector = <T>(
  selector: (state: RecipeWizardState) => T,
  deps: React.DependencyList = [],
  equalityFn?: (a: T, b: T) => boolean
): T => {
  const memoizedSelector = useCallback(selector, deps);
  return useOptimizedStoreSelector(memoizedSelector, equalityFn);
};

/**
 * Performance monitoring hook for selector usage
 */
export const useSelectorPerformanceMonitor = (selectorName: string, optimizationLevel: 'none' | 'basic' | 'optimized' | 'advanced' = 'optimized') => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  const renderStartTimeRef = useRef(0);

  // Record render start
  renderStartTimeRef.current = performance.now();

  renderCountRef.current += 1;
  const currentTime = Date.now();
  const timeSinceLastRender = currentTime - lastRenderTimeRef.current;
  lastRenderTimeRef.current = currentTime;

  // Record render completion
  const renderDuration = performance.now() - renderStartTimeRef.current;
  selectorPerformanceAnalyzer.recordRender(selectorName, renderDuration, optimizationLevel);

  // Log performance in development
  if (process.env.NODE_ENV === 'development' && renderCountRef.current > 10) {
    console.log(`🔍 Selector Performance: ${selectorName}`, {
      renderCount: renderCountRef.current,
      timeSinceLastRender,
      renderDuration,
      optimizationLevel,
      averageInterval: currentTime / renderCountRef.current
    });
  }

  return {
    renderCount: renderCountRef.current,
    timeSinceLastRender,
    renderDuration,
    optimizationLevel
  };
};
