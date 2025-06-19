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
      
      // Step navigation actions - optimized to reduce unnecessary re-renders
      setCurrentStep: (step: RecipeStep) => {
        set((state) => {
          // Only update if step actually changed
          if (state.currentStep === step) return state;
          return {
            currentStep: step,
            lastUpdated: new Date()
          };
        });
      },

      markStepCompleted: (step: RecipeStep) => {
        set((state) => {
          // Only update if step isn't already completed
          if (state.completedSteps.includes(step)) return state;

          const completedSteps = [...state.completedSteps, step];
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
      
      // State management actions - optimized to prevent unnecessary re-renders
      setLoading: (loading: boolean) => {
        set((state) => {
          // Only update if loading state actually changed
          if (state.isLoading === loading) return state;
          return {
            isLoading: loading,
            lastUpdated: new Date()
          };
        });
      },

      setError: (error: string | null) => {
        set((state) => {
          // Only update if error actually changed
          if (state.error === error && !state.isLoading) return state;
          return {
            error,
            isLoading: false, // Clear loading when setting error
            lastUpdated: new Date()
          };
        });
      },

      clearError: () => {
        set((state) => {
          // Only update if there's actually an error to clear
          if (!state.error) return state;
          return {
            error: null,
            lastUpdated: new Date()
          };
        });
      },

      // AI Streaming state management actions - optimized to reduce re-renders
      setStreamingCauses: (isStreaming: boolean) => {
        set((state) => {
          // Only update if streaming state actually changed
          if (state.isStreamingCauses === isStreaming) return state;
          return {
            isStreamingCauses: isStreaming,
            streamingError: isStreaming ? null : state.streamingError, // Clear error when starting new stream
            lastUpdated: new Date()
          };
        });
      },

      setStreamingSymptoms: (isStreaming: boolean) => {
        set((state) => {
          // Only update if streaming state actually changed
          if (state.isStreamingSymptoms === isStreaming) return state;
          return {
            isStreamingSymptoms: isStreaming,
            streamingError: isStreaming ? null : state.streamingError, // Clear error when starting new stream
            lastUpdated: new Date()
          };
        });
      },

      setStreamingProperties: (isStreaming: boolean) => {
        set((state) => {
          // Only update if streaming state actually changed
          if (state.isStreamingProperties === isStreaming) return state;
          return {
            isStreamingProperties: isStreaming,
            streamingError: isStreaming ? null : state.streamingError, // Clear error when starting new stream
            lastUpdated: new Date()
          };
        });
      },

      setStreamingOils: (isStreaming: boolean) => {
        set((state) => {
          // Only update if streaming state actually changed
          if (state.isStreamingOils === isStreaming) return state;
          return {
            isStreamingOils: isStreaming,
            streamingError: isStreaming ? null : state.streamingError, // Clear error when starting new stream
            lastUpdated: new Date()
          };
        });
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

      // Batched update actions to minimize re-renders
      batchUpdateStreamingState: (updates: {
        isStreamingCauses?: boolean;
        isStreamingSymptoms?: boolean;
        isStreamingProperties?: boolean;
        isStreamingOils?: boolean;
        streamingError?: string | null;
      }) => {
        set((state) => {
          const newState = { ...state };
          let hasChanges = false;

          // Only update fields that have actually changed
          if (updates.isStreamingCauses !== undefined && state.isStreamingCauses !== updates.isStreamingCauses) {
            newState.isStreamingCauses = updates.isStreamingCauses;
            hasChanges = true;
          }
          if (updates.isStreamingSymptoms !== undefined && state.isStreamingSymptoms !== updates.isStreamingSymptoms) {
            newState.isStreamingSymptoms = updates.isStreamingSymptoms;
            hasChanges = true;
          }
          if (updates.isStreamingProperties !== undefined && state.isStreamingProperties !== updates.isStreamingProperties) {
            newState.isStreamingProperties = updates.isStreamingProperties;
            hasChanges = true;
          }
          if (updates.isStreamingOils !== undefined && state.isStreamingOils !== updates.isStreamingOils) {
            newState.isStreamingOils = updates.isStreamingOils;
            hasChanges = true;
          }
          if (updates.streamingError !== undefined && state.streamingError !== updates.streamingError) {
            newState.streamingError = updates.streamingError;
            hasChanges = true;
          }

          // Only update lastUpdated if there were actual changes
          if (hasChanges) {
            newState.lastUpdated = new Date();
            return newState;
          }

          return state; // No changes, return existing state
        });
      },

      batchUpdateStepData: (updates: {
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
        set((state) => {
          const newState = { ...state };
          let hasChanges = false;

          // Only update fields that have actually changed
          Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined && JSON.stringify(state[key as keyof RecipeWizardState]) !== JSON.stringify(value)) {
              (newState as any)[key] = value;
              hasChanges = true;
            }
          });

          // Only update lastUpdated if there were actual changes
          if (hasChanges) {
            newState.lastUpdated = new Date();
            return newState;
          }

          return state; // No changes, return existing state
        });
      },

      batchUpdateLoadingAndError: (updates: {
        isLoading?: boolean;
        error?: string | null;
      }) => {
        set((state) => {
          const newState = { ...state };
          let hasChanges = false;

          if (updates.isLoading !== undefined && state.isLoading !== updates.isLoading) {
            newState.isLoading = updates.isLoading;
            hasChanges = true;
          }
          if (updates.error !== undefined && state.error !== updates.error) {
            newState.error = updates.error;
            hasChanges = true;
          }

          // Only update lastUpdated if there were actual changes
          if (hasChanges) {
            newState.lastUpdated = new Date();
            return newState;
          }

          return state; // No changes, return existing state
        });
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
