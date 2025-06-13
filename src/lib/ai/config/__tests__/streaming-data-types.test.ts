/**
 * Tests for streaming data types configuration
 */

import {
  STREAMING_DATA_TYPES,
  isItemComplete,
  cleanItemData,
  detectDataTypes,
  getPrimaryDisplayField,
  validateStreamingResponse,
  transformStreamingData
} from '../streaming-data-types';

describe('Streaming Data Types Configuration', () => {
  describe('isItemComplete', () => {
    it('should validate potential_causes correctly', () => {
      const config = STREAMING_DATA_TYPES.potential_causes;
      
      // Valid cause
      const validCause = {
        cause_id: 'cause_1',
        name_localized: 'Valid cause name that is long enough',
        suggestion_localized: 'Valid suggestion that meets minimum length requirements',
        explanation_localized: 'Valid explanation that is definitely long enough to meet the minimum requirements'
      };
      expect(isItemComplete(validCause, config)).toBe(true);

      // Invalid cause - too short
      const invalidCause = {
        cause_id: 'cause_2',
        name_localized: 'Short',
        suggestion_localized: 'Too short',
        explanation_localized: 'Also too short'
      };
      expect(isItemComplete(invalidCause, config)).toBe(false);

      // Invalid cause - missing field
      const missingFieldCause = {
        cause_id: 'cause_3',
        name_localized: 'Valid cause name that is long enough',
        suggestion_localized: 'Valid suggestion that meets minimum length requirements'
        // missing explanation_localized
      };
      expect(isItemComplete(missingFieldCause, config)).toBe(false);
    });

    it('should validate potential_symptoms correctly', () => {
      const config = STREAMING_DATA_TYPES.potential_symptoms;
      
      // Valid symptom
      const validSymptom = {
        symptom_id: 'symptom_1',
        name_localized: 'Valid symptom',
        suggestion_localized: 'Valid suggestion text',
        explanation_localized: 'Valid explanation'
      };
      expect(isItemComplete(validSymptom, config)).toBe(true);

      // Invalid symptom - ends with ellipsis
      const incompleteSymptom = {
        symptom_id: 'symptom_2',
        name_localized: 'Incomplete...',
        suggestion_localized: 'Valid suggestion text',
        explanation_localized: 'Valid explanation'
      };
      expect(isItemComplete(incompleteSymptom, config)).toBe(false);
    });
  });

  describe('cleanItemData', () => {
    it('should clean potential_causes data correctly', () => {
      const config = STREAMING_DATA_TYPES.potential_causes;
      const rawItem = {
        cause_id: 'cause_1',
        name_localized: '  Stress and anxiety  ',
        suggestion_localized: '  Manage stress levels  ',
        explanation_localized: '  High stress can trigger symptoms  ',
        confidence: 0.8,
        tags: ['stress', 'mental'],
        unwanted_field: 'should be removed'
      };

      const cleaned = cleanItemData(rawItem, config);
      
      expect(cleaned).toEqual({
        cause_id: 'cause_1',
        name_localized: 'Stress and anxiety',
        suggestion_localized: 'Manage stress levels',
        explanation_localized: 'High stress can trigger symptoms',
        confidence: 0.8,
        tags: ['stress', 'mental']
      });
      expect(cleaned.unwanted_field).toBeUndefined();
    });
  });

  describe('detectDataTypes', () => {
    it('should detect multiple data types in response', () => {
      const response = {
        data: {
          potential_causes: [{ cause_id: '1' }],
          potential_symptoms: [{ symptom_id: '1' }],
          therapeutic_properties: [{ property_id: '1' }],
          unknown_type: [{ id: '1' }] // Should be ignored
        }
      };

      const detected = detectDataTypes(response);
      expect(detected).toContain('potential_causes');
      expect(detected).toContain('potential_symptoms');
      expect(detected).toContain('therapeutic_properties');
      expect(detected).not.toContain('unknown_type');
    });

    it('should return empty array for invalid response', () => {
      expect(detectDataTypes(null)).toEqual([]);
      expect(detectDataTypes({})).toEqual([]);
      expect(detectDataTypes({ data: null })).toEqual([]);
    });
  });

  describe('getPrimaryDisplayField', () => {
    it('should return name_localized for most types', () => {
      expect(getPrimaryDisplayField('potential_causes')).toBe('name_localized');
      expect(getPrimaryDisplayField('potential_symptoms')).toBe('name_localized');
    });

    it('should return first required field for unknown types', () => {
      expect(getPrimaryDisplayField('unknown_type')).toBe('unknown');
    });
  });

  describe('validateStreamingResponse', () => {
    it('should validate correct response structure', () => {
      const response = {
        data: {
          potential_causes: [
            {
              cause_id: 'cause_1',
              name_localized: 'Valid cause name',
              suggestion_localized: 'Valid suggestion',
              explanation_localized: 'Valid explanation'
            }
          ]
        }
      };

      const result = validateStreamingResponse(response);
      expect(result.isValid).toBe(true);
      expect(result.detectedTypes).toContain('potential_causes');
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid response structure', () => {
      const result = validateStreamingResponse(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Response is null or undefined');
    });
  });

  describe('transformStreamingData', () => {
    it('should transform and filter data correctly', () => {
      const config = STREAMING_DATA_TYPES.potential_causes;
      const items = [
        {
          cause_id: 'cause_1',
          name_localized: 'Valid cause name that is long enough',
          suggestion_localized: 'Valid suggestion that meets minimum length requirements',
          explanation_localized: 'Valid explanation that is definitely long enough to meet the minimum requirements',
          unwanted_field: 'remove me'
        },
        {
          cause_id: 'cause_2',
          name_localized: 'Short', // Too short, should be filtered out
          suggestion_localized: 'Also short',
          explanation_localized: 'Too short'
        }
      ];

      const transformed = transformStreamingData(items, 'potential_causes');
      
      expect(transformed).toHaveLength(1);
      expect(transformed[0]).toEqual({
        cause_id: 'cause_1',
        name_localized: 'Valid cause name that is long enough',
        suggestion_localized: 'Valid suggestion that meets minimum length requirements',
        explanation_localized: 'Valid explanation that is definitely long enough to meet the minimum requirements'
      });
      expect(transformed[0].unwanted_field).toBeUndefined();
    });

    it('should apply custom transform function', () => {
      const items = [
        {
          symptom_id: 'symptom_1',
          name_localized: 'Valid symptom',
          suggestion_localized: 'Valid suggestion text',
          explanation_localized: 'Valid explanation'
        }
      ];

      const customTransform = (item: any) => ({
        ...item,
        custom_field: 'added by transform'
      });

      const transformed = transformStreamingData(items, 'potential_symptoms', customTransform);
      
      expect(transformed[0].custom_field).toBe('added by transform');
    });
  });

  describe('Configuration completeness', () => {
    it('should have all required fields for each data type', () => {
      Object.entries(STREAMING_DATA_TYPES).forEach(([dataType, config]) => {
        expect(config.idField).toBeDefined();
        expect(config.requiredFields).toBeDefined();
        expect(Array.isArray(config.requiredFields)).toBe(true);
        expect(config.minLengths).toBeDefined();
        expect(config.optionalFields).toBeDefined();
        expect(Array.isArray(config.optionalFields)).toBe(true);
        expect(config.displayName).toBeDefined();
      });
    });
  });
});
