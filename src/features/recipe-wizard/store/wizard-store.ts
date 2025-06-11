/**
 * @fileoverview Zustand store for Recipe Wizard state management using OpenAI Agents SDK.
 * Implements session-based state persistence that resets on page refresh for better UX.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { RecipeWizardStep } from '../types/recipe-wizard.types';
import type {
  RecipeWizardState,
  RecipeWizardActions,
  HealthConcernData,
  DemographicsData,
  PotentialCause
} from '../types/recipe-wizard.types';

import { 
  DEFAULT_STEP,
  STORAGE_KEYS,
  DATA_RETENTION_DAYS,
  STORAGE_VERSION,
  STEP_ORDER,
  STEP_DEPENDENCIES
} from '../constants/wizard.constants';

/**
 * Generates a unique session ID
 */
function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Initial state for the recipe wizard (MVP: first 3 steps only)
 */
const initialState: Omit<RecipeWizardState, keyof RecipeWizardActions> = {
  // Step data (MVP: health concern, demographics, selected causes)
  healthConcern: null,
  demographics: null,
  selectedCauses: [],

  // AI response data (MVP: only potential causes)
  potentialCauses: [],

  // Navigation state
  currentStep: DEFAULT_STEP,
  completedSteps: [],

  // Loading and error states
  isLoading: false,
  error: null,

  // Metadata
  lastUpdated: new Date(),
  sessionId: generateSessionId()
};

/**
 * Recipe Wizard store with persistence
 */
export const useRecipeWizardStore = create<RecipeWizardState & RecipeWizardActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================================================
      // STEP NAVIGATION
      // ========================================================================

      setCurrentStep: (step: RecipeWizardStep) => {
        set((state) => ({
          currentStep: step,
          lastUpdated: new Date()
        }));
      },

      markStepCompleted: (step: RecipeWizardStep) => {
        set((state) => ({
          completedSteps: state.completedSteps.includes(step) 
            ? state.completedSteps 
            : [...state.completedSteps, step],
          lastUpdated: new Date()
        }));
      },

      canNavigateToStep: (step: RecipeWizardStep): boolean => {
        const state = get();
        const dependencies = STEP_DEPENDENCIES[step];
        
        // Check if all dependencies are satisfied
        for (const dependency of dependencies) {
          switch (dependency) {
            case RecipeWizardStep.HEALTH_CONCERN:
              if (!state.healthConcern) return false;
              break;
            case RecipeWizardStep.DEMOGRAPHICS:
              if (!state.demographics) return false;
              break;
            case RecipeWizardStep.POTENTIAL_CAUSES:
              if (state.selectedCauses.length === 0) return false;
              break;
          }
        }
        
        return true;
      },

      // ========================================================================
      // DATA UPDATES
      // ========================================================================

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
          lastUpdated: new Date()
        }));
      },

      // ========================================================================
      // AI DATA UPDATES (MVP: only potential causes)
      // ========================================================================

      setPotentialCauses: (causes: PotentialCause[]) => {
        set((state) => ({
          potentialCauses: causes,
          lastUpdated: new Date()
        }));
      },

      // ========================================================================
      // STATE MANAGEMENT
      // ========================================================================

      setLoading: (loading: boolean) => {
        set((state) => ({
          isLoading: loading,
          // Clear error when starting new loading
          error: loading ? null : state.error,
          lastUpdated: new Date()
        }));
      },

      setError: (error: string | null) => {
        set((state) => ({
          error,
          // Clear loading when setting error
          isLoading: false,
          lastUpdated: new Date()
        }));
      },

      clearError: () => {
        set((state) => ({
          error: null,
          lastUpdated: new Date()
        }));
      },

      /**
       * Reset the entire wizard to initial state
       * Useful for programmatic resets or "Start Over" functionality
       */
      resetWizard: () => {
        set(() => ({
          ...initialState,
          sessionId: generateSessionId(),
          lastUpdated: new Date()
        }));
        // Also clear from storage
        clearWizardData();
      },

      /**
       * Clear all steps after the specified step when user navigates back and makes changes
       */
      clearStepsAfter: (step: RecipeWizardStep) => {
        set((state) => {
          const updates: Partial<RecipeWizardState> = {
            lastUpdated: new Date()
          };

          // Clear subsequent step data based on which step was changed
          switch (step) {
            case RecipeWizardStep.HEALTH_CONCERN:
              // Clear all subsequent steps
              updates.demographics = null;
              updates.selectedCauses = [];
              updates.potentialCauses = [];
              updates.completedSteps = state.completedSteps.filter(s => s === RecipeWizardStep.HEALTH_CONCERN);
              break;

            case RecipeWizardStep.DEMOGRAPHICS:
              // Clear potential causes data since demographics changed
              updates.selectedCauses = [];
              updates.potentialCauses = [];
              updates.completedSteps = state.completedSteps.filter(s =>
                s === RecipeWizardStep.HEALTH_CONCERN || s === RecipeWizardStep.DEMOGRAPHICS
              );
              break;

            case RecipeWizardStep.POTENTIAL_CAUSES:
              // Only clear selected causes
              updates.selectedCauses = [];
              updates.completedSteps = state.completedSteps.filter(s =>
                s !== RecipeWizardStep.POTENTIAL_CAUSES
              );
              break;
          }

          return { ...state, ...updates };
        });
      }
    }),
    {
      name: STORAGE_KEYS.WIZARD_STATE,
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for reset on refresh
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle data migration if needed
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            sessionId: generateSessionId(),
            lastUpdated: new Date()
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        // Only persist essential data, not loading/error states (MVP: first 3 steps)
        healthConcern: state.healthConcern,
        demographics: state.demographics,
        selectedCauses: state.selectedCauses,
        potentialCauses: state.potentialCauses,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        sessionId: state.sessionId,
        lastUpdated: state.lastUpdated
      })
    }
  )
);

/**
 * Utility function to clear all wizard data from storage
 * Now uses sessionStorage which automatically clears on page refresh
 */
export function clearWizardData(): void {
  sessionStorage.removeItem(STORAGE_KEYS.WIZARD_STATE);
  sessionStorage.removeItem(STORAGE_KEYS.SESSION_ID);
  sessionStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);
  sessionStorage.removeItem(STORAGE_KEYS.VERSION);
}

/**
 * Utility function to check if stored data is expired
 * With sessionStorage, data automatically expires on page refresh/tab close
 */
export function isWizardDataExpired(): boolean {
  const lastUpdated = sessionStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
  if (!lastUpdated) return true;

  const lastUpdatedDate = new Date(lastUpdated);
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() - DATA_RETENTION_DAYS);

  return lastUpdatedDate < expirationDate;
}
