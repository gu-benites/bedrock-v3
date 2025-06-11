/**
 * @fileoverview Constants for the Recipe Wizard feature using OpenAI Agents SDK.
 * Contains configuration values, API endpoints, and default settings.
 */

import { RecipeWizardStep } from '../types/recipe-wizard.types';

// ============================================================================
// WIZARD CONFIGURATION
// ============================================================================

/**
 * Default wizard step
 */
export const DEFAULT_STEP = RecipeWizardStep.HEALTH_CONCERN;

/**
 * API endpoint for recipe wizard
 */
export const WIZARD_API_ENDPOINT = '/api/recipe-wizard';

/**
 * Default language for API requests
 */
export const DEFAULT_LANGUAGE = 'PT_BR';

/**
 * Storage version for data migration
 */
export const STORAGE_VERSION = '1.0.0';

/**
 * Data retention period in days
 */
export const DATA_RETENTION_DAYS = 30;

// ============================================================================
// STORAGE KEYS
// ============================================================================

/**
 * Local storage keys for wizard data persistence
 */
export const STORAGE_KEYS = {
  WIZARD_STATE: 'recipe-wizard-state',
  SESSION_ID: 'recipe-wizard-session',
  LAST_UPDATED: 'recipe-wizard-updated',
  VERSION: 'recipe-wizard-version'
} as const;

// ============================================================================
// API CONFIGURATION
// ============================================================================

/**
 * API timeout in milliseconds
 */
export const API_TIMEOUT = 60000; // 60 seconds

/**
 * API retry configuration
 */
export const API_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2
} as const;

/**
 * Agent step identifiers for API requests (MVP: only potential causes)
 */
export const AGENT_STEPS = {
  POTENTIAL_CAUSES: 'potential-causes'
} as const;

// ============================================================================
// FORM VALIDATION
// ============================================================================

/**
 * Minimum health concern length
 */
export const MIN_HEALTH_CONCERN_LENGTH = 10;

/**
 * Maximum health concern length
 */
export const MAX_HEALTH_CONCERN_LENGTH = 500;

/**
 * Age range constraints
 */
export const AGE_CONSTRAINTS = {
  MIN_AGE: 1,
  MAX_AGE: 120,
  CHILD_MAX: 12,
  TEEN_MAX: 17,
  ADULT_MAX: 64
} as const;

/**
 * Available age categories
 */
export const AGE_CATEGORIES = [
  { value: 'child', label: 'Child (1-12 years)', min: 1, max: 12 },
  { value: 'teen', label: 'Teen (13-17 years)', min: 13, max: 17 },
  { value: 'adult', label: 'Adult (18-64 years)', min: 18, max: 64 },
  { value: 'senior', label: 'Senior (65+ years)', min: 65, max: 120 }
] as const;

/**
 * Available languages
 */
export const LANGUAGES = [
  { value: 'PT_BR', label: 'Português (Brasil)' },
  { value: 'EN_US', label: 'English (US)' },
  { value: 'ES_ES', label: 'Español (España)' },
  { value: 'FR_FR', label: 'Français (France)' }
] as const;

/**
 * Gender options
 */
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
] as const;

// ============================================================================
// WIZARD NAVIGATION
// ============================================================================

/**
 * Step order for navigation validation (MVP: first 3 steps only)
 */
export const STEP_ORDER = [
  RecipeWizardStep.HEALTH_CONCERN,
  RecipeWizardStep.DEMOGRAPHICS,
  RecipeWizardStep.POTENTIAL_CAUSES
] as const;

/**
 * Step dependencies - which steps must be completed before accessing each step (MVP: first 3 steps)
 */
export const STEP_DEPENDENCIES = {
  [RecipeWizardStep.HEALTH_CONCERN]: [],
  [RecipeWizardStep.DEMOGRAPHICS]: [RecipeWizardStep.HEALTH_CONCERN],
  [RecipeWizardStep.POTENTIAL_CAUSES]: [RecipeWizardStep.HEALTH_CONCERN, RecipeWizardStep.DEMOGRAPHICS]
} as const;

/**
 * Minimum selections required for each step (MVP: only causes)
 */
export const MIN_SELECTIONS = {
  CAUSES: 1
} as const;

/**
 * Maximum selections allowed for each step (MVP: only causes)
 */
export const MAX_SELECTIONS = {
  CAUSES: 5
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * Error messages for user-facing errors
 */
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  API_ERROR: 'An error occurred while processing your request. Please try again.',
  TIMEOUT_ERROR: 'The request took too long to complete. Please try again.',
  
  // Validation errors
  HEALTH_CONCERN_REQUIRED: 'Please describe your health concern.',
  HEALTH_CONCERN_TOO_SHORT: `Health concern must be at least ${MIN_HEALTH_CONCERN_LENGTH} characters.`,
  HEALTH_CONCERN_TOO_LONG: `Health concern must be no more than ${MAX_HEALTH_CONCERN_LENGTH} characters.`,
  DEMOGRAPHICS_REQUIRED: 'Please complete your demographic information.',
  GENDER_REQUIRED: 'Please select your gender.',
  AGE_CATEGORY_REQUIRED: 'Please select your age category.',
  AGE_INVALID: 'Please enter a valid age.',
  AGE_OUT_OF_RANGE: `Age must be between ${AGE_CONSTRAINTS.MIN_AGE} and ${AGE_CONSTRAINTS.MAX_AGE}.`,
  AGE_CATEGORY_MISMATCH: 'Age does not match the selected category.',
  LANGUAGE_REQUIRED: 'Please select your preferred language.',
  
  // Selection errors (MVP: only causes)
  NO_CAUSES_SELECTED: `Please select at least ${MIN_SELECTIONS.CAUSES} potential cause(s).`,
  TOO_MANY_CAUSES: `Please select no more than ${MAX_SELECTIONS.CAUSES} causes.`,
  
  // Generic errors
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please start over.',
  INVALID_STEP: 'Invalid wizard step. Please start from the beginning.'
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

/**
 * Success messages for user feedback
 */
export const SUCCESS_MESSAGES = {
  HEALTH_CONCERN_SAVED: 'Health concern saved successfully.',
  DEMOGRAPHICS_SAVED: 'Demographics saved successfully.',
  CAUSES_ANALYZED: 'Potential causes analyzed successfully.'
} as const;

// ============================================================================
// PROMPT PATHS
// ============================================================================

/**
 * Paths to YAML prompt files (MVP: only potential causes)
 */
export const PROMPT_PATHS = {
  POTENTIAL_CAUSES: 'src/features/recipe-wizard/prompts/potential-causes.yaml'
} as const;

// ============================================================================
// AGENT CONFIGURATION
// ============================================================================

/**
 * Default agent configuration
 */
export const DEFAULT_AGENT_CONFIG = {
  model: 'gpt-4.1-nano',
  temperature: 0.3,
  max_tokens: 2000,
  top_p: 0.9
} as const;

/**
 * Agent-specific configurations (MVP: only potential causes)
 */
export const AGENT_CONFIGS = {
  POTENTIAL_CAUSES: {
    temperature: 0.3, // Conservative for medical analysis
    max_tokens: 1500
  }
} as const;
