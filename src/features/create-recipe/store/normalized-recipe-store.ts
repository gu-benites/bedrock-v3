/**
 * Normalized Recipe Store
 * State management with normalized data structures for optimal performance
 */

import { create } from 'zustand';
import { useCallback } from 'react';
import { 
  NormalizedStore, 
  NormalizedState, 
  createRecipeNormalizationEngine,
  normalizeRecipeData,
  denormalizeRecipeData,
  withNormalizationMonitoring
} from '@/lib/state/normalization-engine';
import { stateMonitoringMiddleware } from '@/lib/debug/state-change-monitor';
import type { 
  HealthConcernData,
  DemographicsData,
  PotentialCause,
  PotentialSymptom,
  TherapeuticProperty,
  PropertyOilSuggestions,
  RecipeStep
} from '../types/recipe.types';
import { RecipeStep as RecipeStepEnum, DEFAULT_STEP } from '../types/recipe.types';
import { generateUUID } from '@/lib/utils';

// ============================================================================
// NORMALIZED STATE INTERFACE
// ============================================================================

interface NormalizedRecipeState {
  // Normalized data stores
  normalizedData: NormalizedStore;
  
  // Non-normalized simple data
  healthConcern: HealthConcernData | null;
  demographics: DemographicsData | null;
  
  // Navigation state
  currentStep: RecipeStep;
  completedSteps: RecipeStep[];
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // AI Streaming states
  isStreamingCauses: boolean;
  isStreamingSymptoms: boolean;
  isStreamingProperties: boolean;
  isStreamingOils: boolean;
  streamingError: string | null;
  
  // Metadata
  lastUpdated: Date;
  sessionId: string;
}

interface NormalizedRecipeActions {
  // Data update actions
  updateHealthConcern: (data: HealthConcernData) => void;
  updateDemographics: (data: DemographicsData) => void;
  updatePotentialCauses: (causes: PotentialCause[]) => void;
  updateSelectedCauses: (causes: PotentialCause[]) => void;
  updatePotentialSymptoms: (symptoms: PotentialSymptom[]) => void;
  updateSelectedSymptoms: (symptoms: PotentialSymptom[]) => void;
  updateTherapeuticProperties: (properties: TherapeuticProperty[]) => void;
  updateSuggestedOils: (oils: PropertyOilSuggestions[]) => void;

  // Entity-specific actions
  addCause: (cause: PotentialCause) => void;
  removeCause: (causeId: string) => void;
  toggleCauseSelection: (causeId: string) => void;
  addSymptom: (symptom: PotentialSymptom) => void;
  removeSymptom: (symptomId: string) => void;
  toggleSymptomSelection: (symptomId: string) => void;
  addProperty: (property: TherapeuticProperty) => void;
  removeProperty: (propertyId: string) => void;

  // Computed data getters
  getSelectedCauses: () => PotentialCause[];
  getSelectedSymptoms: () => PotentialSymptom[];
  getPropertiesWithRelationships: () => TherapeuticProperty[];
  getCausesWithComputedFields: () => PotentialCause[];
  getSymptomsWithComputedFields: () => PotentialSymptom[];

  // Navigation actions
  setCurrentStep: (step: RecipeStep) => void;
  markStepCompleted: (step: RecipeStep) => void;
  canNavigateToStep: (step: RecipeStep) => boolean;

  // State management actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Streaming actions
  setStreamingCauses: (streaming: boolean) => void;
  setStreamingSymptoms: (streaming: boolean) => void;
  setStreamingProperties: (streaming: boolean) => void;
  setStreamingOils: (streaming: boolean) => void;
  setStreamingError: (error: string | null) => void;
  clearStreamingError: () => void;

  // Utility actions
  resetWizard: () => void;
  exportDenormalizedData: () => any;
}

type NormalizedRecipeStore = NormalizedRecipeState & NormalizedRecipeActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: Omit<NormalizedRecipeState, keyof NormalizedRecipeActions> = {
  normalizedData: {},
  healthConcern: null,
  demographics: null,
  currentStep: DEFAULT_STEP,
  completedSteps: [],
  isLoading: false,
  error: null,
  isStreamingCauses: false,
  isStreamingSymptoms: false,
  isStreamingProperties: false,
  isStreamingOils: false,
  streamingError: null,
  lastUpdated: new Date(),
  sessionId: generateUUID()
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useNormalizedRecipeStore = create<NormalizedRecipeStore>()(
  stateMonitoringMiddleware('normalized-recipe-store')(
    (set, get) => {
      const engine = createRecipeNormalizationEngine();

      return {
        ...initialState,

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

        updatePotentialCauses: (causes: PotentialCause[]) => {
          set((state) => {
            const normalizedCauses = withNormalizationMonitoring('normalize-causes', () =>
              engine.normalize('causes', causes)
            );

            return {
              normalizedData: {
                ...state.normalizedData,
                causes: normalizedCauses
              },
              lastUpdated: new Date()
            };
          });
        },

        updateSelectedCauses: (causes: PotentialCause[]) => {
          set((state) => {
            const normalizedSelectedCauses = withNormalizationMonitoring('normalize-selected-causes', () =>
              engine.normalize('causes', causes)
            );

            return {
              normalizedData: {
                ...state.normalizedData,
                selectedCauses: normalizedSelectedCauses,
                // Clear dependent data
                selectedSymptoms: { entities: {}, ids: [] },
                properties: { entities: {}, ids: [] },
                oils: { entities: {}, ids: [] }
              },
              lastUpdated: new Date()
            };
          });
        },

        updatePotentialSymptoms: (symptoms: PotentialSymptom[]) => {
          set((state) => {
            const normalizedSymptoms = withNormalizationMonitoring('normalize-symptoms', () =>
              engine.normalize('symptoms', symptoms)
            );

            return {
              normalizedData: {
                ...state.normalizedData,
                symptoms: normalizedSymptoms
              },
              lastUpdated: new Date()
            };
          });
        },

        updateSelectedSymptoms: (symptoms: PotentialSymptom[]) => {
          set((state) => {
            const normalizedSelectedSymptoms = withNormalizationMonitoring('normalize-selected-symptoms', () =>
              engine.normalize('symptoms', symptoms)
            );

            return {
              normalizedData: {
                ...state.normalizedData,
                selectedSymptoms: normalizedSelectedSymptoms,
                // Clear dependent data
                properties: { entities: {}, ids: [] },
                oils: { entities: {}, ids: [] }
              },
              lastUpdated: new Date()
            };
          });
        },

        updateTherapeuticProperties: (properties: TherapeuticProperty[]) => {
          set((state) => {
            const normalizedProperties = withNormalizationMonitoring('normalize-properties', () =>
              engine.normalize('properties', properties)
            );

            return {
              normalizedData: {
                ...state.normalizedData,
                properties: normalizedProperties,
                // Clear dependent data
                oils: { entities: {}, ids: [] }
              },
              lastUpdated: new Date()
            };
          });
        },

        updateSuggestedOils: (oils: PropertyOilSuggestions[]) => {
          set((state) => {
            const { normalizedStore } = withNormalizationMonitoring('normalize-oils', () =>
              normalizeRecipeData({ suggestedOils: oils })
            );

            return {
              normalizedData: {
                ...state.normalizedData,
                oils: normalizedStore.oils || { entities: {}, ids: [] }
              },
              lastUpdated: new Date()
            };
          });
        },

        // Entity-specific actions
        addCause: (cause: PotentialCause) => {
          set((state) => {
            const currentCauses = state.normalizedData.causes || { entities: {}, ids: [] };
            const updatedCauses = engine.addEntity('causes', currentCauses, cause);

            return {
              normalizedData: {
                ...state.normalizedData,
                causes: updatedCauses
              },
              lastUpdated: new Date()
            };
          });
        },

        removeCause: (causeId: string) => {
          set((state) => {
            const currentCauses = state.normalizedData.causes || { entities: {}, ids: [] };
            const updatedCauses = engine.removeEntity('causes', currentCauses, causeId);

            return {
              normalizedData: {
                ...state.normalizedData,
                causes: updatedCauses
              },
              lastUpdated: new Date()
            };
          });
        },

        toggleCauseSelection: (causeId: string) => {
          set((state) => {
            const selectedCauses = state.normalizedData.selectedCauses || { entities: {}, ids: [] };
            const cause = state.normalizedData.causes?.entities[causeId];
            
            if (!cause) return state;

            let updatedSelectedCauses;
            if (selectedCauses.entities[causeId]) {
              // Remove from selection
              updatedSelectedCauses = engine.removeEntity('causes', selectedCauses, causeId);
            } else {
              // Add to selection
              updatedSelectedCauses = engine.addEntity('causes', selectedCauses, cause);
            }

            return {
              normalizedData: {
                ...state.normalizedData,
                selectedCauses: updatedSelectedCauses
              },
              lastUpdated: new Date()
            };
          });
        },

        addSymptom: (symptom: PotentialSymptom) => {
          set((state) => {
            const currentSymptoms = state.normalizedData.symptoms || { entities: {}, ids: [] };
            const updatedSymptoms = engine.addEntity('symptoms', currentSymptoms, symptom);

            return {
              normalizedData: {
                ...state.normalizedData,
                symptoms: updatedSymptoms
              },
              lastUpdated: new Date()
            };
          });
        },

        removeSymptom: (symptomId: string) => {
          set((state) => {
            const currentSymptoms = state.normalizedData.symptoms || { entities: {}, ids: [] };
            const updatedSymptoms = engine.removeEntity('symptoms', currentSymptoms, symptomId);

            return {
              normalizedData: {
                ...state.normalizedData,
                symptoms: updatedSymptoms
              },
              lastUpdated: new Date()
            };
          });
        },

        toggleSymptomSelection: (symptomId: string) => {
          set((state) => {
            const selectedSymptoms = state.normalizedData.selectedSymptoms || { entities: {}, ids: [] };
            const symptom = state.normalizedData.symptoms?.entities[symptomId];
            
            if (!symptom) return state;

            let updatedSelectedSymptoms;
            if (selectedSymptoms.entities[symptomId]) {
              // Remove from selection
              updatedSelectedSymptoms = engine.removeEntity('symptoms', selectedSymptoms, symptomId);
            } else {
              // Add to selection
              updatedSelectedSymptoms = engine.addEntity('symptoms', selectedSymptoms, symptom);
            }

            return {
              normalizedData: {
                ...state.normalizedData,
                selectedSymptoms: updatedSelectedSymptoms
              },
              lastUpdated: new Date()
            };
          });
        },

        addProperty: (property: TherapeuticProperty) => {
          set((state) => {
            const currentProperties = state.normalizedData.properties || { entities: {}, ids: [] };
            const updatedProperties = engine.addEntity('properties', currentProperties, property);

            return {
              normalizedData: {
                ...state.normalizedData,
                properties: updatedProperties
              },
              lastUpdated: new Date()
            };
          });
        },

        removeProperty: (propertyId: string) => {
          set((state) => {
            const currentProperties = state.normalizedData.properties || { entities: {}, ids: [] };
            const updatedProperties = engine.removeEntity('properties', currentProperties, propertyId);

            return {
              normalizedData: {
                ...state.normalizedData,
                properties: updatedProperties
              },
              lastUpdated: new Date()
            };
          });
        },

        // Computed data getters
        getSelectedCauses: () => {
          const state = get();
          const selectedCauses = state.normalizedData.selectedCauses;
          if (!selectedCauses) return [];

          return withNormalizationMonitoring('denormalize-selected-causes', () =>
            engine.denormalize('causes', selectedCauses, state.normalizedData)
          );
        },

        getSelectedSymptoms: () => {
          const state = get();
          const selectedSymptoms = state.normalizedData.selectedSymptoms;
          if (!selectedSymptoms) return [];

          return withNormalizationMonitoring('denormalize-selected-symptoms', () =>
            engine.denormalize('symptoms', selectedSymptoms, state.normalizedData)
          );
        },

        getPropertiesWithRelationships: () => {
          const state = get();
          const properties = state.normalizedData.properties;
          if (!properties) return [];

          return withNormalizationMonitoring('denormalize-properties-with-relationships', () => {
            return properties.ids.map(id => {
              const property = properties.entities[id];
              return engine.resolveRelationships('properties', property, state.normalizedData);
            });
          });
        },

        getCausesWithComputedFields: () => {
          const state = get();
          const causes = state.normalizedData.causes;
          if (!causes) return [];

          return withNormalizationMonitoring('denormalize-causes-with-computed', () =>
            engine.denormalize('causes', causes, state.normalizedData)
          );
        },

        getSymptomsWithComputedFields: () => {
          const state = get();
          const symptoms = state.normalizedData.symptoms;
          if (!symptoms) return [];

          return withNormalizationMonitoring('denormalize-symptoms-with-computed', () =>
            engine.denormalize('symptoms', symptoms, state.normalizedData)
          );
        },

        // Navigation actions
        setCurrentStep: (step: RecipeStep) => {
          set((state) => ({
            currentStep: step,
            lastUpdated: new Date()
          }));
        },

        markStepCompleted: (step: RecipeStep) => {
          set((state) => ({
            completedSteps: state.completedSteps.includes(step) 
              ? state.completedSteps 
              : [...state.completedSteps, step],
            lastUpdated: new Date()
          }));
        },

        canNavigateToStep: (step: RecipeStep) => {
          const state = get();
          // Implementation depends on business logic
          return true;
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
            lastUpdated: new Date()
          }));
        },

        clearError: () => {
          set((state) => ({
            error: null,
            lastUpdated: new Date()
          }));
        },

        // Streaming actions
        setStreamingCauses: (streaming: boolean) => {
          set((state) => ({
            isStreamingCauses: streaming,
            lastUpdated: new Date()
          }));
        },

        setStreamingSymptoms: (streaming: boolean) => {
          set((state) => ({
            isStreamingSymptoms: streaming,
            lastUpdated: new Date()
          }));
        },

        setStreamingProperties: (streaming: boolean) => {
          set((state) => ({
            isStreamingProperties: streaming,
            lastUpdated: new Date()
          }));
        },

        setStreamingOils: (streaming: boolean) => {
          set((state) => ({
            isStreamingOils: streaming,
            lastUpdated: new Date()
          }));
        },

        setStreamingError: (error: string | null) => {
          set((state) => ({
            streamingError: error,
            lastUpdated: new Date()
          }));
        },

        clearStreamingError: () => {
          set((state) => ({
            streamingError: null,
            lastUpdated: new Date()
          }));
        },

        // Utility actions
        resetWizard: () => {
          set(() => ({
            ...initialState,
            sessionId: generateUUID(),
            lastUpdated: new Date()
          }));
        },

        exportDenormalizedData: () => {
          const state = get();
          return withNormalizationMonitoring('export-denormalized-data', () =>
            denormalizeRecipeData(state.normalizedData, engine)
          );
        }
      };
    }
  )
);

// ============================================================================
// OPTIMIZED SELECTORS
// ============================================================================

// Basic data selectors
export const useNormalizedHealthConcern = () => useNormalizedRecipeStore(
  useCallback((state) => state.healthConcern, [])
);

export const useNormalizedDemographics = () => useNormalizedRecipeStore(
  useCallback((state) => state.demographics, [])
);

// Normalized data selectors
export const useNormalizedCauses = () => useNormalizedRecipeStore(
  useCallback((state) => state.normalizedData.causes, [])
);

export const useNormalizedSelectedCauses = () => useNormalizedRecipeStore(
  useCallback((state) => state.normalizedData.selectedCauses, [])
);

export const useNormalizedSymptoms = () => useNormalizedRecipeStore(
  useCallback((state) => state.normalizedData.symptoms, [])
);

export const useNormalizedSelectedSymptoms = () => useNormalizedRecipeStore(
  useCallback((state) => state.normalizedData.selectedSymptoms, [])
);

export const useNormalizedProperties = () => useNormalizedRecipeStore(
  useCallback((state) => state.normalizedData.properties, [])
);

export const useNormalizedOils = () => useNormalizedRecipeStore(
  useCallback((state) => state.normalizedData.oils, [])
);

// Computed data selectors
export const useSelectedCausesWithComputed = () => useNormalizedRecipeStore(
  useCallback((state) => state.getSelectedCauses(), [])
);

export const useSelectedSymptomsWithComputed = () => useNormalizedRecipeStore(
  useCallback((state) => state.getSelectedSymptoms(), [])
);

export const usePropertiesWithRelationships = () => useNormalizedRecipeStore(
  useCallback((state) => state.getPropertiesWithRelationships(), [])
);

// Actions selectors
export const useNormalizedRecipeActions = () => useNormalizedRecipeStore(
  useCallback((state) => ({
    updateHealthConcern: state.updateHealthConcern,
    updateDemographics: state.updateDemographics,
    updatePotentialCauses: state.updatePotentialCauses,
    updateSelectedCauses: state.updateSelectedCauses,
    updatePotentialSymptoms: state.updatePotentialSymptoms,
    updateSelectedSymptoms: state.updateSelectedSymptoms,
    updateTherapeuticProperties: state.updateTherapeuticProperties,
    updateSuggestedOils: state.updateSuggestedOils,
    toggleCauseSelection: state.toggleCauseSelection,
    toggleSymptomSelection: state.toggleSymptomSelection,
    resetWizard: state.resetWizard
  }), [])
);
