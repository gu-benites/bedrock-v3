/**
 * @fileoverview TypeScript type definitions for the Essential Oil Recipe Creator feature.
 * These types are based on the AromaRx API responses and wizard step requirements.
 */

// ============================================================================
// WIZARD STEP TYPES
// ============================================================================

/**
 * Enum representing the available wizard steps
 */
export enum RecipeStep {
  HEALTH_CONCERN = 'health-concern',
  DEMOGRAPHICS = 'demographics', 
  CAUSES = 'causes',
  SYMPTOMS = 'symptoms',
  PROPERTIES = 'properties',
  OILS = 'oils'
}

/**
 * Type for wizard step navigation
 */
export type RecipeStepKey = keyof typeof RecipeStep;

// ============================================================================
// FORM DATA TYPES
// ============================================================================

/**
 * Step 1: Health concern input data
 */
export interface HealthConcernData {
  healthConcern: string;
}

/**
 * Step 2: Demographics form data
 */
export interface DemographicsData {
  gender: 'male' | 'female';
  ageCategory: string;
  specificAge: number;
}

/**
 * Step 3: Potential cause selection data
 */
export interface PotentialCause {
  cause_name: string;
  cause_suggestion: string;
  explanation: string;
}

/**
 * Step 4: Symptom selection data
 */
export interface PotentialSymptom {
  symptom_name: string;
  symptom_suggestion: string;
  explanation: string;
}

/**
 * Step 5: Therapeutic property data
 */
export interface TherapeuticProperty {
  property_id: string;
  property_name: string;
  property_name_in_english: string;
  description: string;
  causes_addressed: string;
  symptoms_addressed: string;
  relevancy: number;
}

/**
 * Step 6: Essential oil suggestion data
 */
export interface EssentialOil {
  name_english: string;
  name_local_language: string;
  oil_description: string;
  relevancy: number;
}

/**
 * Oil suggestions grouped by therapeutic property
 */
export interface PropertyOilSuggestions {
  property_id: string;
  property_name: string;
  property_name_in_english: string;
  description: string;
  suggested_oils: EssentialOil[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Base API request structure
 */
export interface BaseApiRequest {
  health_concern: string;
  gender: 'male' | 'female';
  age_category: string;
  age_specific: string;
  user_language: string;
}

/**
 * API request for potential causes step
 */
export interface PotentialCausesRequest extends BaseApiRequest {
  step: 'PotentialCauses';
}

/**
 * API request for potential symptoms step
 */
export interface PotentialSymptomsRequest extends BaseApiRequest {
  selected_causes: PotentialCause[];
  step: 'PotentialSymptoms';
}

/**
 * API request for medical properties step
 */
export interface MedicalPropertiesRequest extends BaseApiRequest {
  selected_causes: PotentialCause[];
  selected_symptoms: PotentialSymptom[];
  step: 'MedicalProperties';
}

/**
 * API request for suggested oils step
 */
export interface SuggestedOilsRequest extends BaseApiRequest {
  selected_causes: PotentialCause[];
  selected_symptoms: PotentialSymptom[];
  therapeutic_properties: TherapeuticProperty[];
  step: 'SuggestedOils';
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  index: number;
  message: {
    role: 'assistant';
    content: T;
    refusal: null;
    annotations: any[];
  };
  logprobs: null;
  finish_reason: 'stop';
}

/**
 * API response for potential causes
 */
export interface PotentialCausesResponse {
  potential_causes: PotentialCause[];
}

/**
 * API response for potential symptoms
 */
export interface PotentialSymptomsResponse {
  potential_symptoms: PotentialSymptom[];
}

/**
 * API response for medical properties
 */
export interface MedicalPropertiesResponse {
  health_concern_in_english: string;
  therapeutic_properties: TherapeuticProperty[];
}

/**
 * API response for suggested oils
 */
export interface SuggestedOilsResponse {
  property_id: string;
  property_name: string;
  property_name_in_english: string;
  description: string;
  suggested_oils: EssentialOil[];
}

// ============================================================================
// WIZARD STATE TYPES
// ============================================================================

/**
 * Complete wizard state containing all step data
 */
export interface RecipeWizardState {
  // Step data
  healthConcern: HealthConcernData | null;
  demographics: DemographicsData | null;
  selectedCauses: PotentialCause[];
  selectedSymptoms: PotentialSymptom[];
  therapeuticProperties: TherapeuticProperty[];
  suggestedOils: PropertyOilSuggestions[];
  
  // API response data
  potentialCauses: PotentialCause[];
  potentialSymptoms: PotentialSymptom[];
  
  // Navigation state
  currentStep: RecipeStep;
  completedSteps: RecipeStep[];
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // AI Streaming states
  isStreamingCauses: boolean;
  streamingError: string | null;
  
  // Metadata
  lastUpdated: Date;
  sessionId: string;
}

/**
 * Actions for the recipe wizard store
 */
export interface RecipeWizardActions {
  // Step navigation
  setCurrentStep: (step: RecipeStep) => void;
  markStepCompleted: (step: RecipeStep) => void;
  canNavigateToStep: (step: RecipeStep) => boolean;
  
  // Data updates
  updateHealthConcern: (data: HealthConcernData) => void;
  updateDemographics: (data: DemographicsData) => void;
  updateSelectedCauses: (causes: PotentialCause[]) => void;
  updateSelectedSymptoms: (symptoms: PotentialSymptom[]) => void;
  updateTherapeuticProperties: (properties: TherapeuticProperty[]) => void;
  updateSuggestedOils: (oils: PropertyOilSuggestions[]) => void;
  
  // API data updates
  setPotentialCauses: (causes: PotentialCause[]) => void;
  setPotentialSymptoms: (symptoms: PotentialSymptom[]) => void;
  
  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetWizard: () => void;
  clearError: () => void;

  // AI Streaming state management
  setStreamingCauses: (isStreaming: boolean) => void;
  setStreamingError: (error: string | null) => void;
  clearStreamingError: () => void;

  // State clearing for navigation consistency
  clearStepsAfter: (currentStep: RecipeStep) => void;
  clearStepData: (step: RecipeStep) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for API error responses
 */
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

/**
 * Type for form validation errors
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Type for local storage persistence
 */
export interface PersistedRecipeData {
  state: RecipeWizardState;
  timestamp: number;
  version: string;
}
