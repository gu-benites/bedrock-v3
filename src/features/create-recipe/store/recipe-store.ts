/**
 * @fileoverview Zustand store for Essential Oil Recipe Creator wizard state management.
 * Implements non-persistent state for reset-on-refresh behavior.
 * Data is intentionally not persisted so browser refresh clears all state.
 */

import { create } from 'zustand';
import { RecipeStep } from '../types/recipe.types';
import type {
  RecipeWizardState,
  RecipeWizardActions,
  HealthConcernData,
  DemographicsData,
  PotentialCause,
  PotentialSymptom,
  TherapeuticProperty,
  PropertyOilSuggestions
} from '../types/recipe.types';

import {
  DEFAULT_STEP,
  STORAGE_KEYS
} from '../constants/recipe.constants';

/**
 * Generates a UUID v4 string
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Combined store interface with state and actions
 */
interface RecipeStore extends RecipeWizardState, RecipeWizardActions {}

/**
 * Initial state for the recipe wizard
 */
const initialState: Omit<RecipeWizardState, keyof RecipeWizardActions> = {
  // Step data
  healthConcern: null,
  demographics: null,
  selectedCauses: [],
  selectedSymptoms: [],
  therapeuticProperties: [],
  suggestedOils: [],
  
  // API response data
  potentialCauses: [],
  potentialSymptoms: [],
  
  // Navigation state
  currentStep: DEFAULT_STEP,
  completedSteps: [],
  
  // Loading and error states
  isLoading: false,
  error: null,

  // AI Streaming states
  isStreamingCauses: false,
  isStreamingSymptoms: false,
  isStreamingProperties: false,
  isStreamingOils: false,
  streamingError: null,
  
  // Metadata
  lastUpdated: new Date(),
  sessionId: generateUUID()
};



/**
 * Main recipe wizard store WITHOUT persistence for reset-on-refresh behavior
 * Data is intentionally not persisted so browser refresh clears all state
 */
export const useRecipeStore = create<RecipeStore>()((set, get) => ({
  ...initialState,
      
      // Step navigation actions
      setCurrentStep: (step: RecipeStep) => {
        set((state) => ({
          currentStep: step,
          lastUpdated: new Date()
        }));
      },
      
      markStepCompleted: (step: RecipeStep) => {
        set((state) => {
          const completedSteps = [...state.completedSteps];
          if (!completedSteps.includes(step)) {
            completedSteps.push(step);
          }
          return {
            completedSteps,
            lastUpdated: new Date()
          };
        });
      },
      
      canNavigateToStep: (step: RecipeStep): boolean => {
        const state = get();
        
        // Always allow navigation to health concern (first step)
        if (step === RecipeStep.HEALTH_CONCERN) return true;
        
        // Check if previous steps are completed
        switch (step) {
          case RecipeStep.DEMOGRAPHICS:
            return !!state.healthConcern;
          case RecipeStep.CAUSES:
            return !!state.healthConcern && !!state.demographics;
          case RecipeStep.SYMPTOMS:
            return !!state.healthConcern && !!state.demographics && state.selectedCauses.length > 0;
          case RecipeStep.PROPERTIES:
            return !!state.healthConcern && !!state.demographics &&
                   state.selectedCauses.length > 0 && state.selectedSymptoms.length > 0;
          default:
            return false;
        }
      },
      
      // Data update actions
      updateHealthConcern: (data: HealthConcernData) => {
        set((state) => ({
          healthConcern: data,
          lastUpdated: new Date()
        }));
      },
      
      updateDemographics: (data: DemographicsData) => {
        set((state) => ({
          demographics: data,
          lastUpdated: new Date()
        }));
      },
      
      updateSelectedCauses: (causes: PotentialCause[]) => {
        set((state) => ({
          selectedCauses: causes,
          // Clear dependent data when causes change
          selectedSymptoms: [],
          therapeuticProperties: [],
          suggestedOils: [],
          potentialSymptoms: [],
          lastUpdated: new Date()
        }));
      },
      
      updateSelectedSymptoms: (symptoms: PotentialSymptom[]) => {
        set((state) => ({
          selectedSymptoms: symptoms,
          // Clear dependent data when symptoms change
          therapeuticProperties: [],
          suggestedOils: [],
          lastUpdated: new Date()
        }));
      },
      
      updateTherapeuticProperties: (properties: TherapeuticProperty[]) => {
        set((state) => ({
          therapeuticProperties: properties,
          // Clear dependent data when properties change
          suggestedOils: [],
          lastUpdated: new Date()
        }));
      },
      
      updateSuggestedOils: (oils: PropertyOilSuggestions[]) => {
        set((state) => ({
          suggestedOils: oils,
          lastUpdated: new Date()
        }));
      },
      
      // API data update actions
      setPotentialCauses: (causes: PotentialCause[]) => {
        set((state) => ({
          potentialCauses: causes,
          lastUpdated: new Date()
        }));
      },
      
      setPotentialSymptoms: (symptoms: PotentialSymptom[]) => {
        set((state) => ({
          potentialSymptoms: symptoms,
          lastUpdated: new Date()
        }));
      },
      
      // State management actions
      setLoading: (loading: boolean) => {
        set((state) => ({
          isLoading: loading,
          lastUpdated: new Date()
        }));
      },
      
      setError: (error: string | null) => {
        set((state) => ({
          error,
          isLoading: false, // Clear loading when setting error
          lastUpdated: new Date()
        }));
      },
      
      clearError: () => {
        set((state) => ({
          error: null,
          lastUpdated: new Date()
        }));
      },

      // AI Streaming state management actions
      setStreamingCauses: (isStreaming: boolean) => {
        set((state) => ({
          isStreamingCauses: isStreaming,
          streamingError: isStreaming ? null : state.streamingError, // Clear error when starting new stream
          lastUpdated: new Date()
        }));
      },

      setStreamingSymptoms: (isStreaming: boolean) => {
        set((state) => ({
          isStreamingSymptoms: isStreaming,
          streamingError: isStreaming ? null : state.streamingError, // Clear error when starting new stream
          lastUpdated: new Date()
        }));
      },

      setStreamingProperties: (isStreaming: boolean) => {
        set((state) => ({
          isStreamingProperties: isStreaming,
          streamingError: isStreaming ? null : state.streamingError, // Clear error when starting new stream
          lastUpdated: new Date()
        }));
      },

      setStreamingOils: (isStreaming: boolean) => {
        set((state) => ({
          isStreamingOils: isStreaming,
          streamingError: isStreaming ? null : state.streamingError, // Clear error when starting new stream
          lastUpdated: new Date()
        }));
      },

      setStreamingError: (error: string | null) => {
        set((state) => ({
          streamingError: error,
          isStreamingCauses: false, // Stop streaming on error
          isStreamingSymptoms: false, // Stop streaming on error
          isStreamingProperties: false, // Stop streaming on error
          isStreamingOils: false, // Stop streaming on error
          lastUpdated: new Date()
        }));
      },

      clearStreamingError: () => {
        set((state) => ({
          streamingError: null,
          lastUpdated: new Date()
        }));
      },
      
      /**
       * Clears data for all steps after the specified step
       * Used when navigating backwards to ensure data consistency
       */
      clearStepsAfter: (currentStep: RecipeStep) => {
        console.log(`🧹 Clearing steps after: ${currentStep}`);

        set((state) => {
          const updates: Partial<RecipeWizardState> = {
            lastUpdated: new Date()
          };

          // Clear completed steps that come after the current step
          const stepOrder = [
            RecipeStep.HEALTH_CONCERN,
            RecipeStep.DEMOGRAPHICS,
            RecipeStep.CAUSES,
            RecipeStep.SYMPTOMS,
            RecipeStep.PROPERTIES
            // Note: OILS step removed - oils are now nested within PROPERTIES
          ];

          const currentStepIndex = stepOrder.indexOf(currentStep);
          const stepsToRemove = stepOrder.slice(currentStepIndex + 1);

          updates.completedSteps = state.completedSteps.filter(
            step => !stepsToRemove.includes(step)
          );

          // Clear data based on which step we're going back to
          switch (currentStep) {
            case RecipeStep.HEALTH_CONCERN:
              // Clear everything except health concern
              updates.demographics = null;
              updates.selectedCauses = [];
              updates.selectedSymptoms = [];
              updates.therapeuticProperties = [];
              updates.suggestedOils = [];
              updates.potentialCauses = [];
              updates.potentialSymptoms = [];
              break;

            case RecipeStep.DEMOGRAPHICS:
              // Clear causes and everything after
              updates.selectedCauses = [];
              updates.selectedSymptoms = [];
              updates.therapeuticProperties = [];
              updates.suggestedOils = [];
              updates.potentialCauses = [];
              updates.potentialSymptoms = [];
              break;

            case RecipeStep.CAUSES:
              // Clear symptoms and everything after
              updates.selectedSymptoms = [];
              updates.therapeuticProperties = [];
              updates.suggestedOils = [];
              updates.potentialSymptoms = [];
              break;

            case RecipeStep.SYMPTOMS:
              // Clear properties and oils
              updates.therapeuticProperties = [];
              updates.suggestedOils = [];
              break;

            case RecipeStep.PROPERTIES:
              // This is now the final step - nothing to clear after it
              // (oils are nested within properties, not a separate step)
              break;
          }

          console.log(`✅ Cleared data for steps after ${currentStep}:`, {
            clearedSteps: stepsToRemove,
            remainingCompletedSteps: updates.completedSteps
          });

          return { ...state, ...updates };
        });
      },

      /**
       * Clears specific step data
       * Used for targeted data clearing
       */
      clearStepData: (step: RecipeStep) => {
        console.log(`🧹 Clearing data for step: ${step}`);

        set((state) => {
          const updates: Partial<RecipeWizardState> = {
            lastUpdated: new Date()
          };

          // Remove step from completed steps
          updates.completedSteps = state.completedSteps.filter(s => s !== step);

          // Clear specific step data
          switch (step) {
            case RecipeStep.HEALTH_CONCERN:
              updates.healthConcern = null;
              break;
            case RecipeStep.DEMOGRAPHICS:
              updates.demographics = null;
              break;
            case RecipeStep.CAUSES:
              updates.selectedCauses = [];
              updates.potentialCauses = [];
              break;
            case RecipeStep.SYMPTOMS:
              updates.selectedSymptoms = [];
              updates.potentialSymptoms = [];
              break;
            case RecipeStep.PROPERTIES:
              updates.therapeuticProperties = [];
              updates.suggestedOils = []; // Clear oils too since they're nested within properties
              break;
          }

          return { ...state, ...updates };
        });
      },

      resetWizard: () => {
        console.log('🔄 Starting recipe wizard reset...');

        // Reset to initial state with new session ID and explicitly clear all states
        set(() => ({
          ...initialState,
          error: null, // Explicitly clear any error state
          isLoading: false, // Explicitly clear loading state
          isStreamingCauses: false, // Clear streaming states
          isStreamingSymptoms: false,
          isStreamingProperties: false,
          isStreamingOils: false,
          streamingError: null,
          sessionId: generateUUID(), // Generate new session ID
          lastUpdated: new Date()
        }));

        console.log('✅ Recipe wizard reset completed - all data and states cleared');
      }
    }));

/**
 * Selector hooks for specific parts of the state
 */
export const useRecipeNavigationStore = () => useRecipeStore((state) => ({
  currentStep: state.currentStep,
  completedSteps: state.completedSteps,
  setCurrentStep: state.setCurrentStep,
  markStepCompleted: state.markStepCompleted,
  canNavigateToStep: state.canNavigateToStep
}));

export const useRecipeData = () => useRecipeStore((state) => ({
  healthConcern: state.healthConcern,
  demographics: state.demographics,
  selectedCauses: state.selectedCauses,
  selectedSymptoms: state.selectedSymptoms,
  therapeuticProperties: state.therapeuticProperties,
  suggestedOils: state.suggestedOils
}));

export const useRecipeApiData = () => useRecipeStore((state) => ({
  potentialCauses: state.potentialCauses,
  potentialSymptoms: state.potentialSymptoms,
  setPotentialCauses: state.setPotentialCauses,
  setPotentialSymptoms: state.setPotentialSymptoms
}));

export const useRecipeStatus = () => useRecipeStore((state) => ({
  isLoading: state.isLoading,
  error: state.error,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError
}));

export const useRecipeStreaming = () => useRecipeStore((state) => ({
  isStreamingCauses: state.isStreamingCauses,
  isStreamingSymptoms: state.isStreamingSymptoms,
  isStreamingProperties: state.isStreamingProperties,
  isStreamingOils: state.isStreamingOils,
  streamingError: state.streamingError,
  setStreamingCauses: state.setStreamingCauses,
  setStreamingSymptoms: state.setStreamingSymptoms,
  setStreamingProperties: state.setStreamingProperties,
  setStreamingOils: state.setStreamingOils,
  setStreamingError: state.setStreamingError,
  clearStreamingError: state.clearStreamingError
}));

/**
 * Utility function to clear all recipe data
 * Since we removed persistence, this just resets the store
 */
export const clearRecipeData = () => {
  try {
    useRecipeStore.getState().resetWizard();
  } catch (error) {
    console.error('Error clearing recipe data:', error);
  }
};
