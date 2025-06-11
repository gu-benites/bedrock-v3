/**
 * @fileoverview TypeScript type definitions for the Recipe Wizard feature using OpenAI Agents SDK.
 * These types define the wizard steps, AI agent responses, and state management structures.
 */

// ============================================================================
// WIZARD STEP TYPES
// ============================================================================

/**
 * Enum representing the available wizard steps (MVP: first 3 steps only)
 */
export enum RecipeWizardStep {
  HEALTH_CONCERN = 'health-concern',
  DEMOGRAPHICS = 'demographics',
  POTENTIAL_CAUSES = 'potential-causes'
}

/**
 * Type for wizard step navigation
 */
export type RecipeWizardStepKey = keyof typeof RecipeWizardStep;

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
  ageCategory: 'child' | 'teen' | 'adult' | 'senior';
  specificAge: number;
  language: 'PT_BR' | 'EN_US' | 'ES_ES' | 'FR_FR';
}

/**
 * Step 3: Potential cause data from AI agent (aligned with API specification)
 */
export interface PotentialCause {
  cause_id: string;
  name_localized: string;
  suggestion_localized: string;
  explanation_localized: string;
}

// Note: Additional step interfaces (symptoms, properties, oils) will be added
// in future iterations following test-first development approach

// ============================================================================
// AI AGENT REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Base context for all AI agent requests
 */
export interface BaseAgentContext {
  healthConcern: string;
  demographics: DemographicsData;
  sessionId: string;
  language: string;
}

/**
 * Request context for potential causes agent (MVP: only step implemented)
 */
export interface PotentialCausesContext extends BaseAgentContext {
  step: 'potential-causes';
}

// Note: Additional context interfaces (symptoms, properties, oils) will be added
// in future iterations following test-first development approach

/**
 * AI agent response for potential causes (MVP: only response implemented)
 */
export interface PotentialCausesResponse {
  health_concern_analysis: string;
  potential_causes: PotentialCause[];
  confidence_level: number;
  medical_disclaimer: string;
}

// Note: Additional response interfaces (symptoms, properties, oils) will be added
// in future iterations following test-first development approach

// ============================================================================
// WIZARD STATE TYPES
// ============================================================================

/**
 * Wizard state for MVP (Health Concern → Demographics → Potential Causes)
 */
export interface RecipeWizardState {
  // Step data (MVP: first 3 steps only)
  healthConcern: HealthConcernData | null;
  demographics: DemographicsData | null;
  selectedCauses: PotentialCause[];

  // AI response data (MVP: only potential causes)
  potentialCauses: PotentialCause[];

  // Navigation state
  currentStep: RecipeWizardStep;
  completedSteps: RecipeWizardStep[];

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Metadata
  lastUpdated: Date;
  sessionId: string;
}

/**
 * Actions for the recipe wizard store (MVP: first 3 steps only)
 */
export interface RecipeWizardActions {
  // Step navigation
  setCurrentStep: (step: RecipeWizardStep) => void;
  markStepCompleted: (step: RecipeWizardStep) => void;
  canNavigateToStep: (step: RecipeWizardStep) => boolean;

  // Data updates (MVP: health concern, demographics, selected causes)
  updateHealthConcern: (data: HealthConcernData) => void;
  updateDemographics: (data: DemographicsData) => void;
  updateSelectedCauses: (causes: PotentialCause[]) => void;

  // AI data updates (MVP: only potential causes)
  setPotentialCauses: (causes: PotentialCause[]) => void;

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetWizard: () => void;
  clearError: () => void;
  clearStepsAfter: (step: RecipeWizardStep) => void;
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
  details?: Record<string, any>;
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
export interface PersistedWizardData {
  state: RecipeWizardState;
  timestamp: number;
  version: string;
}

/**
 * Type for YAML prompt configuration
 */
export interface PromptConfig {
  template: string;
  config: {
    model: string;
    temperature: number;
    max_tokens: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
  schema: Record<string, any>;
  version: string;
  description: string;
}
