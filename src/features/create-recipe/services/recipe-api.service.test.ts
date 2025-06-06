/**
 * @fileoverview Unit tests for Essential Oil Recipe Creator API service.
 * Tests API calls, error handling, retry logic, and data transformation.
 */

import {
  fetchPotentialCauses,
  fetchPotentialSymptoms,
  fetchTherapeuticProperties,
  fetchSuggestedOilsForProperty,
  fetchSuggestedOilsForAllProperties,
  checkApiHealth,
  RecipeApiError
} from './recipe-api.service';

import type {
  HealthConcernData,
  DemographicsData,
  PotentialCause,
  PotentialSymptom,
  TherapeuticProperty
} from '../types/recipe.types';

// Mock fetch globally
global.fetch = jest.fn();

describe('Recipe API Service', () => {
  const mockHealthConcern: HealthConcernData = {
    healthConcern: 'Anxiety and stress'
  };

  const mockDemographics: DemographicsData = {
    gender: 'female',
    ageCategory: 'adult',
    specificAge: 30
  };

  const mockCause: PotentialCause = {
    cause_name: 'Work Stress',
    cause_suggestion: 'High pressure work environment',
    explanation: 'Demanding job with tight deadlines'
  };

  const mockSymptom: PotentialSymptom = {
    symptom_name: 'Tension Headache',
    symptom_suggestion: 'Head and neck pain',
    explanation: 'Pain caused by muscle tension'
  };

  const mockProperty: TherapeuticProperty = {
    property_id: '123e4567-e89b-12d3-a456-426614174000',
    property_name: 'Calming',
    property_name_in_english: 'Calming',
    description: 'Helps reduce anxiety and stress',
    causes_addressed: 'Stress, anxiety',
    symptoms_addressed: 'Tension, restlessness',
    relevancy: 4
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('fetchPotentialCauses', () => {
    it('should fetch potential causes successfully', async () => {
      const mockResponse = [{
        index: 0,
        message: {
          role: 'assistant',
          content: {
            potential_causes: [mockCause]
          },
          refusal: null,
          annotations: []
        },
        logprobs: null,
        finish_reason: 'stop'
      }];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await fetchPotentialCauses(mockHealthConcern, mockDemographics);

      expect(result).toEqual([mockCause]);
      expect(fetch).toHaveBeenCalledWith('/api/create-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          health_concern: 'Anxiety and stress',
          gender: 'female',
          age_category: 'adult',
          age_specific: '30',
          user_language: 'PT_BR',
          step: 'PotentialCauses'
        })
      });
    });

    it('should handle API error response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Bad Request',
          message: 'Invalid input'
        })
      });

      await expect(fetchPotentialCauses(mockHealthConcern, mockDemographics))
        .rejects.toThrow();
    });

    it('should handle network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network error'));

      await expect(fetchPotentialCauses(mockHealthConcern, mockDemographics))
        .rejects.toThrow();
    });

    it('should handle invalid response format', async () => {
      const mockResponse = [{
        index: 0,
        message: {
          role: 'assistant',
          content: {
            // Missing potential_causes field
          },
          refusal: null,
          annotations: []
        },
        logprobs: null,
        finish_reason: 'stop'
      }];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await expect(fetchPotentialCauses(mockHealthConcern, mockDemographics))
        .rejects.toThrow();
    });
  });

  describe('fetchPotentialSymptoms', () => {
    it('should fetch potential symptoms successfully', async () => {
      const mockResponse = [{
        index: 0,
        message: {
          role: 'assistant',
          content: {
            potential_symptoms: [mockSymptom]
          },
          refusal: null,
          annotations: []
        },
        logprobs: null,
        finish_reason: 'stop'
      }];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await fetchPotentialSymptoms(
        mockHealthConcern, 
        mockDemographics, 
        [mockCause]
      );

      expect(result).toEqual([mockSymptom]);
      expect(fetch).toHaveBeenCalledWith('/api/create-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          health_concern: 'Anxiety and stress',
          gender: 'female',
          age_category: 'adult',
          age_specific: '30',
          user_language: 'PT_BR',
          selected_causes: [mockCause],
          step: 'PotentialSymptoms'
        })
      });
    });

    it('should reject when no causes are provided', async () => {
      await expect(fetchPotentialSymptoms(mockHealthConcern, mockDemographics, []))
        .rejects.toThrow('At least one cause must be selected');
    });
  });

  describe('fetchTherapeuticProperties', () => {
    it('should fetch therapeutic properties successfully', async () => {
      const mockResponse = [{
        index: 0,
        message: {
          role: 'assistant',
          content: {
            health_concern_in_english: 'Anxiety and stress',
            therapeutic_properties: [mockProperty]
          },
          refusal: null,
          annotations: []
        },
        logprobs: null,
        finish_reason: 'stop'
      }];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await fetchTherapeuticProperties(
        mockHealthConcern,
        mockDemographics,
        [mockCause],
        [mockSymptom]
      );

      expect(result).toEqual([mockProperty]);
    });

    it('should reject when no causes are provided', async () => {
      await expect(fetchTherapeuticProperties(
        mockHealthConcern,
        mockDemographics,
        [],
        [mockSymptom]
      )).rejects.toThrow('At least one cause must be selected');
    });

    it('should reject when no symptoms are provided', async () => {
      await expect(fetchTherapeuticProperties(
        mockHealthConcern,
        mockDemographics,
        [mockCause],
        []
      )).rejects.toThrow('At least one symptom must be selected');
    });
  });

  describe('fetchSuggestedOilsForProperty', () => {
    it('should fetch suggested oils for a property successfully', async () => {
      const mockOil = {
        name_english: 'Lavender',
        name_local_language: 'Lavanda',
        oil_description: 'Calming essential oil',
        relevancy: 5
      };

      const mockResponse = [{
        index: 0,
        message: {
          role: 'assistant',
          content: {
            property_id: mockProperty.property_id,
            property_name: mockProperty.property_name,
            property_name_in_english: mockProperty.property_name_in_english,
            description: mockProperty.description,
            suggested_oils: [mockOil]
          },
          refusal: null,
          annotations: []
        },
        logprobs: null,
        finish_reason: 'stop'
      }];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await fetchSuggestedOilsForProperty(
        mockHealthConcern,
        mockDemographics,
        [mockCause],
        [mockSymptom],
        mockProperty
      );

      expect(result).toEqual({
        property_id: mockProperty.property_id,
        property_name: mockProperty.property_name,
        property_name_in_english: mockProperty.property_name_in_english,
        description: mockProperty.description,
        suggested_oils: [mockOil]
      });
    });
  });

  describe('fetchSuggestedOilsForAllProperties', () => {
    it('should fetch oils for multiple properties successfully', async () => {
      const mockOil = {
        name_english: 'Lavender',
        name_local_language: 'Lavanda',
        oil_description: 'Calming essential oil',
        relevancy: 5
      };

      const mockResponse = [{
        index: 0,
        message: {
          role: 'assistant',
          content: {
            property_id: mockProperty.property_id,
            property_name: mockProperty.property_name,
            property_name_in_english: mockProperty.property_name_in_english,
            description: mockProperty.description,
            suggested_oils: [mockOil]
          },
          refusal: null,
          annotations: []
        },
        logprobs: null,
        finish_reason: 'stop'
      }];

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await fetchSuggestedOilsForAllProperties(
        mockHealthConcern,
        mockDemographics,
        [mockCause],
        [mockSymptom],
        [mockProperty]
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.suggested_oils).toEqual([mockOil]);
    });

    it('should handle partial failures gracefully', async () => {
      const mockOil = {
        name_english: 'Lavender',
        name_local_language: 'Lavanda',
        oil_description: 'Calming essential oil',
        relevancy: 5
      };

      const mockResponse = [{
        index: 0,
        message: {
          role: 'assistant',
          content: {
            property_id: mockProperty.property_id,
            property_name: mockProperty.property_name,
            property_name_in_english: mockProperty.property_name_in_english,
            description: mockProperty.description,
            suggested_oils: [mockOil]
          },
          refusal: null,
          annotations: []
        },
        logprobs: null,
        finish_reason: 'stop'
      }];

      // First call succeeds, second fails
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        })
        .mockRejectedValueOnce(new Error('Network error for second property'));

      const properties = [
        mockProperty,
        { ...mockProperty, property_id: '456e7890-e89b-12d3-a456-426614174001', property_name: 'Relaxing' }
      ];
      
      const result = await fetchSuggestedOilsForAllProperties(
        mockHealthConcern,
        mockDemographics,
        [mockCause],
        [mockSymptom],
        properties
      );

      // Should return successful results even if some fail
      expect(result).toHaveLength(1);
    });

    it('should reject when no properties are provided', async () => {
      await expect(fetchSuggestedOilsForAllProperties(
        mockHealthConcern,
        mockDemographics,
        [mockCause],
        [mockSymptom],
        []
      )).rejects.toThrow('At least one therapeutic property is required');
    });
  });

  describe('checkApiHealth', () => {
    it('should return true when API is healthy', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      });

      const result = await checkApiHealth();
      expect(result).toBe(true);
    });

    it('should return false when API is unhealthy', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      });

      const result = await checkApiHealth();
      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await checkApiHealth();
      expect(result).toBe(false);
    });
  });

  describe('RecipeApiError', () => {
    it('should create error with correct properties', () => {
      const error = new RecipeApiError('Test message', 400, 'TEST_ERROR');
      
      expect(error.message).toBe('Test message');
      expect(error.status).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('RecipeApiError');
    });

    it('should create error with default status', () => {
      const error = new RecipeApiError('Test message');
      
      expect(error.status).toBe(500);
    });
  });
});
