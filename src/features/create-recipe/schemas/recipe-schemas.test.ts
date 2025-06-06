/**
 * @fileoverview Unit tests for Essential Oil Recipe Creator Zod validation schemas.
 * Tests form validation, API request/response validation, and error handling.
 */

import {
  healthConcernSchema,
  demographicsSchema,
  causesSelectionSchema,
  symptomsSelectionSchema,
  potentialCauseSchema,
  potentialSymptomSchema,
  therapeuticPropertySchema,
  essentialOilSchema,
  baseApiRequestSchema,
  potentialCausesRequestSchema,
  potentialSymptomsRequestSchema,
  medicalPropertiesRequestSchema,
  suggestedOilsRequestSchema,
  apiResponseSchema,
  potentialCausesResponseSchema,
  potentialSymptomsResponseSchema,
  medicalPropertiesResponseSchema,
  suggestedOilsResponseSchema,
  recipeWizardStateSchema,
  apiErrorSchema,
  validationErrorSchema
} from './recipe-schemas';

describe('Recipe Schemas', () => {
  describe('Form Validation Schemas', () => {
    describe('healthConcernSchema', () => {
      it('should validate valid health concern', () => {
        const validData = {
          healthConcern: 'I have anxiety and stress issues'
        };
        
        const result = healthConcernSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject health concern that is too short', () => {
        const invalidData = {
          healthConcern: 'Hi'
        };
        
        const result = healthConcernSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 3 characters');
        }
      });

      it('should reject health concern that is too long', () => {
        const invalidData = {
          healthConcern: 'A'.repeat(501)
        };
        
        const result = healthConcernSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('no more than 500 characters');
        }
      });

      it('should reject empty health concern', () => {
        const invalidData = {
          healthConcern: ''
        };
        
        const result = healthConcernSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should trim whitespace and validate', () => {
        const validData = {
          healthConcern: '   Valid concern   '
        };
        
        const result = healthConcernSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe('demographicsSchema', () => {
      it('should validate valid demographics', () => {
        const validData = {
          gender: 'female' as const,
          ageCategory: 'adult',
          specificAge: 30
        };
        
        const result = demographicsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid gender', () => {
        const invalidData = {
          gender: 'other',
          ageCategory: 'adult',
          specificAge: 30
        };
        
        const result = demographicsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject negative age', () => {
        const invalidData = {
          gender: 'male' as const,
          ageCategory: 'adult',
          specificAge: -5
        };
        
        const result = demographicsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject age over 120', () => {
        const invalidData = {
          gender: 'male' as const,
          ageCategory: 'adult',
          specificAge: 150
        };
        
        const result = demographicsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject non-integer age', () => {
        const invalidData = {
          gender: 'female' as const,
          ageCategory: 'adult',
          specificAge: 30.5
        };
        
        const result = demographicsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('causesSelectionSchema', () => {
      const validCause = {
        cause_name: 'Stress',
        cause_suggestion: 'Work-related stress',
        explanation: 'High pressure work environment'
      };

      it('should validate valid causes selection', () => {
        const validData = {
          selectedCauses: [validCause]
        };
        
        const result = causesSelectionSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty causes array', () => {
        const invalidData = {
          selectedCauses: []
        };
        
        const result = causesSelectionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 1 cause');
        }
      });

      it('should reject too many causes', () => {
        const invalidData = {
          selectedCauses: Array(11).fill(validCause)
        };
        
        const result = causesSelectionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('no more than 10 causes');
        }
      });
    });

    describe('symptomsSelectionSchema', () => {
      const validSymptom = {
        symptom_name: 'Headache',
        symptom_suggestion: 'Tension headache',
        explanation: 'Pain in head and neck area'
      };

      it('should validate valid symptoms selection', () => {
        const validData = {
          selectedSymptoms: [validSymptom]
        };
        
        const result = symptomsSelectionSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty symptoms array', () => {
        const invalidData = {
          selectedSymptoms: []
        };
        
        const result = symptomsSelectionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 1 symptom');
        }
      });

      it('should reject too many symptoms', () => {
        const invalidData = {
          selectedSymptoms: Array(16).fill(validSymptom)
        };
        
        const result = symptomsSelectionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('no more than 15 symptoms');
        }
      });
    });
  });

  describe('Data Object Schemas', () => {
    describe('potentialCauseSchema', () => {
      it('should validate valid potential cause', () => {
        const validData = {
          cause_name: 'Stress',
          cause_suggestion: 'Work-related stress',
          explanation: 'High pressure work environment'
        };
        
        const result = potentialCauseSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject cause with empty fields', () => {
        const invalidData = {
          cause_name: '',
          cause_suggestion: 'Work-related stress',
          explanation: 'High pressure work environment'
        };
        
        const result = potentialCauseSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('therapeuticPropertySchema', () => {
      it('should validate valid therapeutic property', () => {
        const validData = {
          property_id: '123e4567-e89b-12d3-a456-426614174000',
          property_name: 'Calming',
          property_name_in_english: 'Calming',
          description: 'Helps reduce anxiety and stress',
          causes_addressed: 'Stress, anxiety',
          symptoms_addressed: 'Tension, restlessness',
          relevancy: 4
        };
        
        const result = therapeuticPropertySchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid UUID', () => {
        const invalidData = {
          property_id: 'invalid-uuid',
          property_name: 'Calming',
          property_name_in_english: 'Calming',
          description: 'Helps reduce anxiety and stress',
          causes_addressed: 'Stress, anxiety',
          symptoms_addressed: 'Tension, restlessness',
          relevancy: 4
        };
        
        const result = therapeuticPropertySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject relevancy out of range', () => {
        const invalidData = {
          property_id: '123e4567-e89b-12d3-a456-426614174000',
          property_name: 'Calming',
          property_name_in_english: 'Calming',
          description: 'Helps reduce anxiety and stress',
          causes_addressed: 'Stress, anxiety',
          symptoms_addressed: 'Tension, restlessness',
          relevancy: 6
        };
        
        const result = therapeuticPropertySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('essentialOilSchema', () => {
      it('should validate valid essential oil', () => {
        const validData = {
          name_english: 'Lavender',
          name_local_language: 'Lavanda',
          oil_description: 'Calming and relaxing essential oil',
          relevancy: 5
        };
        
        const result = essentialOilSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject oil with empty name', () => {
        const invalidData = {
          name_english: '',
          name_local_language: 'Lavanda',
          oil_description: 'Calming and relaxing essential oil',
          relevancy: 5
        };
        
        const result = essentialOilSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('API Request Schemas', () => {
    describe('baseApiRequestSchema', () => {
      it('should validate valid base API request', () => {
        const validData = {
          health_concern: 'Anxiety and stress',
          gender: 'female' as const,
          age_category: 'adult',
          age_specific: '30',
          user_language: 'PT_BR'
        };
        
        const result = baseApiRequestSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid language code', () => {
        const invalidData = {
          health_concern: 'Anxiety and stress',
          gender: 'female' as const,
          age_category: 'adult',
          age_specific: '30',
          user_language: 'INVALID'
        };
        
        const result = baseApiRequestSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('potentialCausesRequestSchema', () => {
      it('should validate valid potential causes request', () => {
        const validData = {
          health_concern: 'Anxiety and stress',
          gender: 'female' as const,
          age_category: 'adult',
          age_specific: '30',
          user_language: 'PT_BR',
          step: 'PotentialCauses' as const
        };
        
        const result = potentialCausesRequestSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('API Response Schemas', () => {
    describe('apiResponseSchema', () => {
      it('should validate valid API response structure', () => {
        const contentSchema = potentialCauseSchema;
        const schema = apiResponseSchema(contentSchema);
        
        const validData = [{
          index: 0,
          message: {
            role: 'assistant' as const,
            content: {
              cause_name: 'Stress',
              cause_suggestion: 'Work-related stress',
              explanation: 'High pressure work environment'
            },
            refusal: null,
            annotations: []
          },
          logprobs: null,
          finish_reason: 'stop' as const
        }];
        
        const result = schema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Error Schemas', () => {
    describe('apiErrorSchema', () => {
      it('should validate valid API error', () => {
        const validData = {
          error: 'Bad Request',
          message: 'Invalid input provided',
          status: 400,
          timestamp: '2024-01-01T00:00:00.000Z'
        };
        
        const result = apiErrorSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe('validationErrorSchema', () => {
      it('should validate valid validation error', () => {
        const validData = {
          field: 'healthConcern',
          message: 'Health concern is required'
        };
        
        const result = validationErrorSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });
  });
});
