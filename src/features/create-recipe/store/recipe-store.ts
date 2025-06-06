/**
 * @fileoverview Zustand store for Essential Oil Recipe Creator wizard state management.
 * Implements persistent state with local storage and comprehensive state management.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  STORAGE_KEYS,
  DATA_RETENTION_DAYS,
  STORAGE_VERSION
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
  
  // Metadata
  lastUpdated: new Date(),
  sessionId: generateUUID()
};

/**
 * Custom storage implementation with data retention and versioning
 */
const customStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    try {
      const item = localStorage.getItem(name);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      
      // Check version compatibility
      if (parsed.version !== STORAGE_VERSION) {
        console.warn('Storage version mismatch, clearing data');
        localStorage.removeItem(name);
        return null;
      }
      
      // Check data retention period
      const now = new Date().getTime();
      const dataAge = now - parsed.timestamp;
      const maxAge = DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds
      
      if (dataAge > maxAge) {
        console.info('Stored data expired, clearing');
        localStorage.removeItem(name);
        return null;
      }
      
      // Parse dates back from strings
      if (parsed.state.lastUpdated) {
        parsed.state.lastUpdated = new Date(parsed.state.lastUpdated);
      }
      
      return JSON.stringify(parsed.state);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  
  setItem: (name: string, value: string) => {
    try {
      const state = JSON.parse(value);
      const wrappedData = {
        version: STORAGE_VERSION,
        timestamp: new Date().getTime(),
        state
      };
      localStorage.setItem(name, JSON.stringify(wrappedData));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
}));

/**
 * Main recipe wizard store with persistence
 */
export const useRecipeStore = create<RecipeStore>()(
  persist(
    (set, get) => ({
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
          case RecipeStep.OILS:
            return !!state.healthConcern && !!state.demographics && 
                   state.selectedCauses.length > 0 && state.selectedSymptoms.length > 0 &&
                   state.therapeuticProperties.length > 0;
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
      
      resetWizard: () => {
        console.log('🔄 Starting recipe wizard reset...');

        // Clear all localStorage data first
        try {
          localStorage.removeItem(STORAGE_KEYS.WIZARD_STATE);
          localStorage.removeItem(STORAGE_KEYS.SESSION_BACKUP);

          // Clear any other recipe-related localStorage items
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('recipe') || key.includes('wizard') || key.includes('create-recipe'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));

        } catch (error) {
          console.error('Error clearing localStorage during reset:', error);
        }

        // Reset to initial state with new session ID and explicitly clear error
        set(() => ({
          ...initialState,
          error: null, // Explicitly clear any error state
          isLoading: false, // Explicitly clear loading state
          sessionId: generateUUID(), // Generate new session ID
          lastUpdated: new Date()
        }));

        // Force a small delay to ensure all components re-render and clear any pending errors
        setTimeout(() => {
          // Double-check that error is cleared
          const currentState = get();
          if (currentState.error) {
            console.log('Clearing residual error after reset:', currentState.error);
            set((state) => ({ ...state, error: null }));
          }
          console.log('Recipe wizard reset completed - all data and errors cleared');
        }, 150); // Slightly longer delay to ensure all effects have run
      }
    }),
    {
      name: STORAGE_KEYS.WIZARD_STATE,
      storage: customStorage,
      
      // Partial persistence - exclude loading and error states
      partialize: (state) => ({
        healthConcern: state.healthConcern,
        demographics: state.demographics,
        selectedCauses: state.selectedCauses,
        selectedSymptoms: state.selectedSymptoms,
        therapeuticProperties: state.therapeuticProperties,
        suggestedOils: state.suggestedOils,
        potentialCauses: state.potentialCauses,
        potentialSymptoms: state.potentialSymptoms,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        lastUpdated: state.lastUpdated,
        sessionId: state.sessionId
      }),
      
      // Version for migration handling
      version: 1,
      
      // Migration function for future versions
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            sessionId: persistedState.sessionId || generateUUID()
          };
        }
        return persistedState;
      }
    }
  )
);

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

/**
 * Utility function to clear all recipe data
 */
export const clearRecipeData = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.WIZARD_STATE);
    localStorage.removeItem(STORAGE_KEYS.SESSION_BACKUP);
    useRecipeStore.getState().resetWizard();
  } catch (error) {
    console.error('Error clearing recipe data:', error);
  }
};
