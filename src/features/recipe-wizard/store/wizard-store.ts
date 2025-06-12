/**
 * @fileoverview Zustand store for Recipe Wizard state management
 * Manages wizard flow, demographics, potential causes, and streaming state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DemographicsData, PotentialCause } from '../types/recipe-wizard.types';

/**
 * Wizard steps enum
 */
export enum WizardStep {
  HEALTH_CONCERN = 'health-concern',
  DEMOGRAPHICS = 'demographics',
  POTENTIAL_CAUSES = 'potential-causes',
  SYMPTOMS = 'symptoms',
  PROPERTIES = 'properties',
  OILS = 'oils',
  RECIPE = 'recipe'
}

/**
 * Wizard state interface
 */
export interface WizardState {
  // Current wizard state
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  
  // User data
  healthConcern: string;
  demographics: DemographicsData | null;
  potentialCauses: PotentialCause[];
  
  // Streaming state
  isStreaming: boolean;
  streamingError: string | null;
  
  // Session management
  sessionId: string;
  lastUpdated: Date;
}

/**
 * Wizard actions interface
 */
export interface WizardActions {
  // Navigation
  setCurrentStep: (step: WizardStep) => void;
  markStepCompleted: (step: WizardStep) => void;
  canNavigateToStep: (step: WizardStep) => boolean;
  
  // Data updates
  setHealthConcern: (concern: string) => void;
  setDemographics: (demographics: DemographicsData) => void;
  setPotentialCauses: (causes: PotentialCause[]) => void;
  addPotentialCause: (cause: PotentialCause) => void;
  updatePotentialCause: (index: number, cause: PotentialCause) => void;
  
  // Streaming state
  setStreaming: (isStreaming: boolean) => void;
  setStreamingError: (error: string | null) => void;
  
  // Utility
  reset: () => void;
  generateSessionId: () => string;
}

/**
 * Combined store interface
 */
export type WizardStore = WizardState & WizardActions;

/**
 * Initial state
 */
const initialState: WizardState = {
  currentStep: WizardStep.HEALTH_CONCERN,
  completedSteps: [],
  healthConcern: '',
  demographics: null,
  potentialCauses: [],
  isStreaming: false,
  streamingError: null,
  sessionId: '',
  lastUpdated: new Date()
};

/**
 * Generate a unique session ID
 */
const generateSessionId = (): string => {
  return `wizard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Custom storage for persistence
 */
const customStorage = createJSONStorage(() => localStorage, {
  reviver: (key, value) => {
    if (key === 'lastUpdated') {
      return new Date(value);
    }
    return value;
  },
  replacer: (key, value) => {
    if (key === 'lastUpdated' && value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }
});

/**
 * Recipe Wizard store with persistence
 */
export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      sessionId: generateSessionId(),
      
      // Navigation actions
      setCurrentStep: (step: WizardStep) => {
        set((state) => ({
          currentStep: step,
          lastUpdated: new Date()
        }));
      },
      
      markStepCompleted: (step: WizardStep) => {
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
      
      canNavigateToStep: (step: WizardStep): boolean => {
        const state = get();
        const stepOrder = Object.values(WizardStep);
        const targetIndex = stepOrder.indexOf(step);
        const currentIndex = stepOrder.indexOf(state.currentStep);
        
        // Can always go to current step or previous steps
        if (targetIndex <= currentIndex) return true;
        
        // Can go to next step if current step is completed
        if (targetIndex === currentIndex + 1) {
          return state.completedSteps.includes(state.currentStep);
        }
        
        // Cannot skip steps
        return false;
      },
      
      // Data update actions
      setHealthConcern: (concern: string) => {
        set((state) => ({
          healthConcern: concern,
          lastUpdated: new Date()
        }));
      },
      
      setDemographics: (demographics: DemographicsData) => {
        set((state) => ({
          demographics,
          lastUpdated: new Date()
        }));
      },
      
      setPotentialCauses: (causes: PotentialCause[]) => {
        set((state) => ({
          potentialCauses: causes,
          lastUpdated: new Date()
        }));
      },
      
      addPotentialCause: (cause: PotentialCause) => {
        set((state) => ({
          potentialCauses: [...state.potentialCauses, cause],
          lastUpdated: new Date()
        }));
      },
      
      updatePotentialCause: (index: number, cause: PotentialCause) => {
        set((state) => {
          const potentialCauses = [...state.potentialCauses];
          if (index >= 0 && index < potentialCauses.length) {
            potentialCauses[index] = cause;
          }
          return {
            potentialCauses,
            lastUpdated: new Date()
          };
        });
      },
      
      // Streaming state actions
      setStreaming: (isStreaming: boolean) => {
        set((state) => ({
          isStreaming,
          streamingError: isStreaming ? null : state.streamingError, // Clear error when starting new stream
          lastUpdated: new Date()
        }));
      },
      
      setStreamingError: (error: string | null) => {
        set((state) => ({
          streamingError: error,
          isStreaming: false, // Stop streaming on error
          lastUpdated: new Date()
        }));
      },
      
      // Utility actions
      reset: () => {
        set({
          ...initialState,
          sessionId: generateSessionId(),
          lastUpdated: new Date()
        });
      },
      
      generateSessionId
    }),
    {
      name: 'recipe-wizard-store',
      storage: customStorage,
      
      // Partial persistence - exclude streaming states
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        healthConcern: state.healthConcern,
        demographics: state.demographics,
        potentialCauses: state.potentialCauses,
        sessionId: state.sessionId,
        lastUpdated: state.lastUpdated
      }),
      
      // Version for migration support
      version: 1
    }
  )
);

/**
 * Convenience hooks for specific state slices
 */
export const useWizardNavigation = () => {
  const { currentStep, completedSteps, setCurrentStep, markStepCompleted, canNavigateToStep } = useWizardStore();
  return { currentStep, completedSteps, setCurrentStep, markStepCompleted, canNavigateToStep };
};

export const useWizardData = () => {
  const { healthConcern, demographics, potentialCauses, setHealthConcern, setDemographics, setPotentialCauses } = useWizardStore();
  return { healthConcern, demographics, potentialCauses, setHealthConcern, setDemographics, setPotentialCauses };
};

export const useWizardStreaming = () => {
  const { isStreaming, streamingError, setStreaming, setStreamingError } = useWizardStore();
  return { isStreaming, streamingError, setStreaming, setStreamingError };
};
