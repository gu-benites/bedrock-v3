/**
 * @fileoverview Constants for the Essential Oil Recipe Creator feature.
 * Contains configuration values, options, and static data used throughout the wizard.
 */

import { RecipeStep } from '../types/recipe.types';

// ============================================================================
// FORM OPTIONS
// ============================================================================

/**
 * Gender options for demographics step
 * Simplified to only Male/Female as per user preferences
 */
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
] as const;

/**
 * Age category options for demographics step
 * Simplified to 5 basic categories as per user preferences
 */
export const AGE_CATEGORY_OPTIONS = [
  { value: 'child', label: 'Child (0-12 years)', minAge: 0, maxAge: 12 },
  { value: 'teen', label: 'Teen (13-17 years)', minAge: 13, maxAge: 17 },
  { value: 'adult', label: 'Adult (18-64 years)', minAge: 18, maxAge: 64 },
  { value: 'senior', label: 'Senior (65+ years)', minAge: 65, maxAge: 120 },
  { value: 'elderly', label: 'Elderly (80+ years)', minAge: 80, maxAge: 120 }
] as const;

/**
 * Language options for API requests
 * Limited to 4 languages as per user preferences
 */
export const LANGUAGE_OPTIONS = [
  { value: 'PT_BR', label: 'Portuguese', code: 'pt' },
  { value: 'EN_US', label: 'English', code: 'en' },
  { value: 'ES_ES', label: 'Spanish', code: 'es' },
  { value: 'FR_FR', label: 'French', code: 'fr' }
] as const;

// ============================================================================
// WIZARD CONFIGURATION
// ============================================================================

/**
 * Wizard step configuration with metadata
 */
export const WIZARD_STEPS = [
  {
    key: RecipeStep.HEALTH_CONCERN,
    title: 'Health Concern',
    description: 'Describe your health concern',
    stepNumber: 1,
    path: '/dashboard/create-recipe/health-concern',
    isRequired: true,
    hasForm: true
  },
  {
    key: RecipeStep.DEMOGRAPHICS,
    title: 'Demographics',
    description: 'Tell us about yourself',
    stepNumber: 2,
    path: '/dashboard/create-recipe/demographics',
    isRequired: true,
    hasForm: true
  },
  {
    key: RecipeStep.CAUSES,
    title: 'Potential Causes',
    description: 'Select relevant causes',
    stepNumber: 3,
    path: '/dashboard/create-recipe/causes',
    isRequired: true,
    hasForm: true,
    requiresApi: true
  },
  {
    key: RecipeStep.SYMPTOMS,
    title: 'Symptoms',
    description: 'Choose your symptoms',
    stepNumber: 4,
    path: '/dashboard/create-recipe/symptoms',
    isRequired: true,
    hasForm: true,
    requiresApi: true
  },
  {
    key: RecipeStep.PROPERTIES,
    title: 'Therapeutic Properties',
    description: 'Review therapeutic properties',
    stepNumber: 5,
    path: '/dashboard/create-recipe/properties',
    isRequired: false,
    hasForm: false,
    requiresApi: true
  },
  {
    key: RecipeStep.OILS,
    title: 'Essential Oils',
    description: 'Discover suggested oils',
    stepNumber: 6,
    path: '/dashboard/create-recipe/oils',
    isRequired: false,
    hasForm: false,
    requiresApi: true
  }
] as const;

/**
 * Total number of wizard steps
 */
export const TOTAL_STEPS = WIZARD_STEPS.length;

/**
 * Default step for new wizard sessions
 */
export const DEFAULT_STEP = RecipeStep.HEALTH_CONCERN;

// ============================================================================
// API CONFIGURATION
// ============================================================================

/**
 * External API endpoint for recipe generation
 * Configurable via CREATE_RECIPE_BASE_URL environment variable
 * Falls back to default URL for backward compatibility
 */
export const EXTERNAL_API_URL = process.env['CREATE_RECIPE_BASE_URL'] || 'https://webhook.daianefreitas.com/webhook/10p_build_recipe_protocols';

/**
 * Internal API proxy endpoint
 */
export const INTERNAL_API_ENDPOINT = '/api/create-recipe';

/**
 * API step names that match the external API requirements
 */
export const API_STEPS = {
  POTENTIAL_CAUSES: 'PotentialCauses',
  POTENTIAL_SYMPTOMS: 'PotentialSymptoms', 
  MEDICAL_PROPERTIES: 'MedicalProperties',
  SUGGESTED_OILS: 'SuggestedOils',
  RECIPE_CHOICES: 'RecipeChoices'
} as const;

/**
 * Default language for API requests
 */
export const DEFAULT_API_LANGUAGE = 'PT_BR';

/**
 * API retry configuration
 */
export const API_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2
} as const;

/**
 * API timeout configuration (in milliseconds)
 */
export const API_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Validation rules for health concern input
 */
export const HEALTH_CONCERN_VALIDATION = {
  minLength: 3,
  maxLength: 500,
  required: true
} as const;

/**
 * Validation rules for age input
 */
export const AGE_VALIDATION = {
  min: 0,
  max: 120,
  required: true
} as const;

/**
 * Minimum selections required for multi-select steps
 */
export const SELECTION_REQUIREMENTS = {
  causes: { min: 1, max: 10 },
  symptoms: { min: 1, max: 15 }
} as const;

// ============================================================================
// LOCAL STORAGE CONFIGURATION
// ============================================================================

/**
 * Local storage keys for data persistence
 */
export const STORAGE_KEYS = {
  WIZARD_STATE: 'recipe-wizard-state',
  SESSION_BACKUP: 'recipe-session-backup',
  USER_PREFERENCES: 'recipe-user-preferences'
} as const;

/**
 * Data retention period (in days)
 */
export const DATA_RETENTION_DAYS = 7;

/**
 * Storage version for data migration
 */
export const STORAGE_VERSION = '1.0.0';

// ============================================================================
// UI CONFIGURATION
// ============================================================================

/**
 * Loading state messages for different operations
 */
export const LOADING_MESSAGES = {
  FETCHING_CAUSES: 'Analyzing potential causes...',
  FETCHING_SYMPTOMS: 'Finding related symptoms...',
  FETCHING_PROPERTIES: 'Discovering therapeutic properties...',
  FETCHING_OILS: 'Suggesting essential oils...',
  SAVING_DATA: 'Saving your progress...',
  VALIDATING: 'Validating your input...'
} as const;

/**
 * Error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection and try again.',
  API_ERROR: 'We\'re experiencing technical difficulties. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please start over.',
  STORAGE_ERROR: 'Unable to save your progress. Please ensure you have sufficient storage space.',
  GENERIC_ERROR: 'Something went wrong. Please try again.'
} as const;

/**
 * Success messages for user feedback
 */
export const SUCCESS_MESSAGES = {
  STEP_COMPLETED: 'Step completed successfully!',
  DATA_SAVED: 'Your progress has been saved.',
  RECIPE_GENERATED: 'Your personalized recipe is ready!'
} as const;

// ============================================================================
// MOBILE OPTIMIZATION
// ============================================================================

/**
 * Mobile breakpoints for responsive design
 */
export const MOBILE_BREAKPOINTS = {
  SMALL: 320,
  MEDIUM: 768,
  LARGE: 1024
} as const;

/**
 * Touch target minimum sizes (in pixels)
 */
export const TOUCH_TARGETS = {
  MINIMUM_SIZE: 44,
  RECOMMENDED_SIZE: 48,
  SPACING: 8
} as const;

// ============================================================================
// ACCESSIBILITY
// ============================================================================

/**
 * ARIA labels for screen readers
 */
export const ARIA_LABELS = {
  WIZARD_PROGRESS: 'Recipe creation progress',
  STEP_NAVIGATION: 'Step navigation',
  FORM_VALIDATION: 'Form validation errors',
  LOADING_CONTENT: 'Content is loading',
  ERROR_ALERT: 'Error message'
} as const;

/**
 * Keyboard navigation keys
 */
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  TAB: 'Tab'
} as const;
