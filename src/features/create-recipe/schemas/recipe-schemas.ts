/**
 * @fileoverview Zod validation schemas for Essential Oil Recipe Creator.
 * Provides comprehensive validation for all wizard steps and API interactions.
 */

import { z } from 'zod';
import { 
  HEALTH_CONCERN_VALIDATION,
  AGE_VALIDATION,
  SELECTION_REQUIREMENTS,
  GENDER_OPTIONS,
  AGE_CATEGORY_OPTIONS,
  LANGUAGE_OPTIONS
} from '../constants/recipe.constants';

// ============================================================================
// FORM VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for health concern input (Step 1)
 */
export const healthConcernSchema = z.object({
  healthConcern: z
    .string()
    .min(HEALTH_CONCERN_VALIDATION.minLength, {
      message: `Health concern must be at least ${HEALTH_CONCERN_VALIDATION.minLength} characters long`
    })
    .max(HEALTH_CONCERN_VALIDATION.maxLength, {
      message: `Health concern must be no more than ${HEALTH_CONCERN_VALIDATION.maxLength} characters long`
    })
    .trim()
    .refine(val => val.length > 0, {
      message: 'Health concern is required'
    })
});

/**
 * Schema for demographics form (Step 2)
 */
export const demographicsSchema = z.object({
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'Please select a valid gender' })
  }),
  ageCategory: z
    .string()
    .min(1, { message: 'Please select an age category' })
    .refine(
      val => AGE_CATEGORY_OPTIONS.some(option => option.value === val),
      { message: 'Please select a valid age category' }
    ),
  specificAge: z
    .number()
    .int({ message: 'Age must be a whole number' })
    .min(AGE_VALIDATION.min, { message: `Age must be at least ${AGE_VALIDATION.min}` })
    .max(AGE_VALIDATION.max, { message: `Age must be no more than ${AGE_VALIDATION.max}` })
});

/**
 * Schema for potential cause object
 */
export const potentialCauseSchema = z.object({
  cause_name: z.string().min(1, { message: 'Cause name is required' }),
  cause_suggestion: z.string().min(1, { message: 'Cause suggestion is required' }),
  explanation: z.string().min(1, { message: 'Cause explanation is required' })
});

/**
 * Schema for causes selection (Step 3)
 */
export const causesSelectionSchema = z.object({
  selectedCauses: z
    .array(potentialCauseSchema)
    .min(SELECTION_REQUIREMENTS.causes.min, {
      message: `Please select at least ${SELECTION_REQUIREMENTS.causes.min} cause`
    })
    .max(SELECTION_REQUIREMENTS.causes.max, {
      message: `Please select no more than ${SELECTION_REQUIREMENTS.causes.max} causes`
    })
});

/**
 * Schema for potential symptom object
 */
export const potentialSymptomSchema = z.object({
  symptom_name: z.string().min(1, { message: 'Symptom name is required' }),
  symptom_suggestion: z.string().min(1, { message: 'Symptom suggestion is required' }),
  explanation: z.string().min(1, { message: 'Symptom explanation is required' })
});

/**
 * Schema for symptoms selection (Step 4)
 */
export const symptomsSelectionSchema = z.object({
  selectedSymptoms: z
    .array(potentialSymptomSchema)
    .min(SELECTION_REQUIREMENTS.symptoms.min, {
      message: `Please select at least ${SELECTION_REQUIREMENTS.symptoms.min} symptom`
    })
    .max(SELECTION_REQUIREMENTS.symptoms.max, {
      message: `Please select no more than ${SELECTION_REQUIREMENTS.symptoms.max} symptoms`
    })
});

/**
 * Schema for therapeutic property object
 */
export const therapeuticPropertySchema = z.object({
  property_id: z.string().uuid({ message: 'Invalid property ID format' }),
  property_name: z.string().min(1, { message: 'Property name is required' }),
  property_name_in_english: z.string().min(1, { message: 'English property name is required' }),
  description: z.string().min(1, { message: 'Property description is required' }),
  causes_addressed: z.string(),
  symptoms_addressed: z.string(),
  relevancy: z.number().int().min(1).max(5, { message: 'Relevancy must be between 1 and 5' })
});

/**
 * Schema for essential oil object
 */
export const essentialOilSchema = z.object({
  name_english: z.string().min(1, { message: 'English oil name is required' }),
  name_local_language: z.string().min(1, { message: 'Local oil name is required' }),
  oil_description: z.string().min(1, { message: 'Oil description is required' }),
  relevancy: z.number().int().min(1).max(5, { message: 'Relevancy must be between 1 and 5' })
});

// ============================================================================
// API REQUEST SCHEMAS
// ============================================================================

/**
 * Base API request schema
 */
export const baseApiRequestSchema = z.object({
  health_concern: z.string().min(1, { message: 'Health concern is required' }),
  gender: z.enum(['male', 'female'], { message: 'Valid gender is required' }),
  age_category: z.string().min(1, { message: 'Age category is required' }),
  age_specific: z.string().min(1, { message: 'Specific age is required' }),
  user_language: z
    .string()
    .min(1, { message: 'User language is required' })
    .refine(
      val => LANGUAGE_OPTIONS.some(option => option.value === val),
      { message: 'Invalid language code' }
    )
});

/**
 * Schema for potential causes API request
 */
export const potentialCausesRequestSchema = baseApiRequestSchema.extend({
  step: z.literal('PotentialCauses')
});

/**
 * Schema for potential symptoms API request
 */
export const potentialSymptomsRequestSchema = baseApiRequestSchema.extend({
  selected_causes: z.array(potentialCauseSchema).min(1, { message: 'At least one cause is required' }),
  step: z.literal('PotentialSymptoms')
});

/**
 * Schema for medical properties API request
 */
export const medicalPropertiesRequestSchema = baseApiRequestSchema.extend({
  selected_causes: z.array(potentialCauseSchema).min(1, { message: 'At least one cause is required' }),
  selected_symptoms: z.array(potentialSymptomSchema).min(1, { message: 'At least one symptom is required' }),
  step: z.literal('MedicalProperties')
});

/**
 * Schema for suggested oils API request
 */
export const suggestedOilsRequestSchema = baseApiRequestSchema.extend({
  selected_causes: z.array(potentialCauseSchema).min(1, { message: 'At least one cause is required' }),
  selected_symptoms: z.array(potentialSymptomSchema).min(1, { message: 'At least one symptom is required' }),
  therapeutic_properties: z.array(therapeuticPropertySchema).min(1, { message: 'At least one property is required' }),
  step: z.literal('SuggestedOils')
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

/**
 * Generic API response wrapper schema
 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(contentSchema: T) =>
  z.array(
    z.object({
      index: z.number(),
      message: z.object({
        role: z.literal('assistant'),
        content: contentSchema,
        refusal: z.null(),
        annotations: z.array(z.any())
      }),
      logprobs: z.null(),
      finish_reason: z.literal('stop')
    })
  );

/**
 * Schema for potential causes API response
 */
export const potentialCausesResponseSchema = apiResponseSchema(
  z.object({
    potential_causes: z.array(potentialCauseSchema)
  })
);

/**
 * Schema for potential symptoms API response
 */
export const potentialSymptomsResponseSchema = apiResponseSchema(
  z.object({
    potential_symptoms: z.array(potentialSymptomSchema)
  })
);

/**
 * Schema for medical properties API response
 */
export const medicalPropertiesResponseSchema = apiResponseSchema(
  z.object({
    health_concern_in_english: z.string(),
    therapeutic_properties: z.array(therapeuticPropertySchema)
  })
);

/**
 * Schema for suggested oils API response
 */
export const suggestedOilsResponseSchema = apiResponseSchema(
  z.object({
    property_id: z.string().uuid(),
    property_name: z.string(),
    property_name_in_english: z.string(),
    description: z.string(),
    suggested_oils: z.array(essentialOilSchema)
  })
);

// ============================================================================
// WIZARD STATE SCHEMAS
// ============================================================================

/**
 * Schema for complete wizard state
 */
export const recipeWizardStateSchema = z.object({
  // Step data
  healthConcern: healthConcernSchema.nullable(),
  demographics: demographicsSchema.nullable(),
  selectedCauses: z.array(potentialCauseSchema),
  selectedSymptoms: z.array(potentialSymptomSchema),
  therapeuticProperties: z.array(therapeuticPropertySchema),
  suggestedOils: z.array(
    z.object({
      property_id: z.string().uuid(),
      property_name: z.string(),
      property_name_in_english: z.string(),
      description: z.string(),
      suggested_oils: z.array(essentialOilSchema)
    })
  ),
  
  // API response data
  potentialCauses: z.array(potentialCauseSchema),
  potentialSymptoms: z.array(potentialSymptomSchema),
  
  // Navigation state
  currentStep: z.enum(['health-concern', 'demographics', 'causes', 'symptoms', 'properties', 'oils']),
  completedSteps: z.array(z.enum(['health-concern', 'demographics', 'causes', 'symptoms', 'properties', 'oils'])),
  
  // Loading and error states
  isLoading: z.boolean(),
  error: z.string().nullable(),
  
  // Metadata
  lastUpdated: z.date(),
  sessionId: z.string().uuid()
});

// ============================================================================
// ERROR SCHEMAS
// ============================================================================

/**
 * Schema for API error responses
 */
export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  status: z.number(),
  timestamp: z.string()
});

/**
 * Schema for validation errors
 */
export const validationErrorSchema = z.object({
  field: z.string(),
  message: z.string()
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Export inferred types for use throughout the application
export type HealthConcernFormData = z.infer<typeof healthConcernSchema>;
export type DemographicsFormData = z.infer<typeof demographicsSchema>;
export type CausesSelectionFormData = z.infer<typeof causesSelectionSchema>;
export type SymptomsSelectionFormData = z.infer<typeof symptomsSelectionSchema>;
export type PotentialCauseData = z.infer<typeof potentialCauseSchema>;
export type PotentialSymptomData = z.infer<typeof potentialSymptomSchema>;
export type TherapeuticPropertyData = z.infer<typeof therapeuticPropertySchema>;
export type EssentialOilData = z.infer<typeof essentialOilSchema>;
export type RecipeWizardStateData = z.infer<typeof recipeWizardStateSchema>;
export type ApiErrorData = z.infer<typeof apiErrorSchema>;
export type ValidationErrorData = z.infer<typeof validationErrorSchema>;
