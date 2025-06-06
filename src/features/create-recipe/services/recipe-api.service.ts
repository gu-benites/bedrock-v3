/**
 * @fileoverview Service functions for Essential Oil Recipe Creator API calls.
 * Handles communication with the internal API proxy and data transformation.
 */

import {
  INTERNAL_API_ENDPOINT,
  API_STEPS,
  DEFAULT_API_LANGUAGE,
  ERROR_MESSAGES,
  API_RETRY_CONFIG
} from '../constants/recipe.constants';

import type {
  BaseApiRequest,
  PotentialCausesRequest,
  PotentialSymptomsRequest,
  MedicalPropertiesRequest,
  SuggestedOilsRequest,
  ApiResponse,
  PotentialCausesResponse,
  PotentialSymptomsResponse,
  MedicalPropertiesResponse,
  SuggestedOilsResponse,
  PotentialCause,
  PotentialSymptom,
  TherapeuticProperty,
  PropertyOilSuggestions,
  ApiError,
  DemographicsData,
  HealthConcernData
} from '../types/recipe.types';

/**
 * Custom error class for API service errors
 */
export class RecipeApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'RecipeApiError';
  }
}

/**
 * Base function to make API requests to the internal proxy with client-side retry logic
 */
async function makeApiRequest<T>(
  requestBody: any,
  endpoint: string = INTERNAL_API_ENDPOINT,
  attempt: number = 1
): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = ERROR_MESSAGES.API_ERROR;
      let errorCode = 'API_ERROR';

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errorCode = errorData.error || errorCode;
      } catch {
        // If we can't parse the error response, use the status text
        errorMessage = response.statusText || errorMessage;
      }

      // Check if this is a retryable error (5xx server errors or network issues)
      const isRetryable = response.status >= 500 || response.status === 408 || response.status === 429;

      if (isRetryable && attempt < API_RETRY_CONFIG.maxRetries) {
        const delay = API_RETRY_CONFIG.retryDelay * Math.pow(API_RETRY_CONFIG.backoffMultiplier, attempt - 1);
        console.warn(`API request failed (attempt ${attempt}), retrying in ${delay}ms...`, {
          status: response.status,
          message: errorMessage
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        return makeApiRequest<T>(requestBody, endpoint, attempt + 1);
      }

      throw new RecipeApiError(
        errorMessage,
        response.status,
        errorCode
      );
    }

    const data = await response.json();
    return data as T;

  } catch (error) {
    if (error instanceof RecipeApiError) {
      throw error;
    }

    // Handle network errors with retry logic
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (attempt < API_RETRY_CONFIG.maxRetries) {
        const delay = API_RETRY_CONFIG.retryDelay * Math.pow(API_RETRY_CONFIG.backoffMultiplier, attempt - 1);
        console.warn(`Network error (attempt ${attempt}), retrying in ${delay}ms...`, {
          error: error.message
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        return makeApiRequest<T>(requestBody, endpoint, attempt + 1);
      }

      throw new RecipeApiError(
        ERROR_MESSAGES.NETWORK_ERROR,
        0,
        'NETWORK_ERROR',
        error as Error
      );
    }

    // Handle other errors
    throw new RecipeApiError(
      ERROR_MESSAGES.GENERIC_ERROR,
      500,
      'UNKNOWN_ERROR',
      error as Error
    );
  }
}

/**
 * Creates base API request object from health concern and demographics data
 */
function createBaseRequest(
  healthConcern: HealthConcernData,
  demographics: DemographicsData,
  userLanguage: string = DEFAULT_API_LANGUAGE
): BaseApiRequest {
  return {
    health_concern: healthConcern.healthConcern,
    gender: demographics.gender,
    age_category: demographics.ageCategory,
    age_specific: demographics.specificAge.toString(),
    user_language: userLanguage
  };
}

/**
 * Fetches potential causes for the given health concern and demographics
 */
export async function fetchPotentialCauses(
  healthConcern: HealthConcernData,
  demographics: DemographicsData,
  userLanguage?: string
): Promise<PotentialCause[]> {
  const requestBody: PotentialCausesRequest = {
    ...createBaseRequest(healthConcern, demographics, userLanguage),
    step: API_STEPS.POTENTIAL_CAUSES
  };

  try {
    const response = await makeApiRequest<ApiResponse<PotentialCausesResponse>[]>(requestBody);
    
    // Extract the potential causes from the API response structure
    if (response && response.length > 0 && response[0].message?.content?.potential_causes) {
      return response[0].message.content.potential_causes;
    }

    throw new RecipeApiError(
      'Invalid response format for potential causes',
      500,
      'INVALID_RESPONSE'
    );

  } catch (error) {
    if (error instanceof RecipeApiError) {
      throw error;
    }
    throw new RecipeApiError(
      'Failed to fetch potential causes',
      500,
      'FETCH_CAUSES_ERROR',
      error as Error
    );
  }
}

/**
 * Fetches potential symptoms based on selected causes
 */
export async function fetchPotentialSymptoms(
  healthConcern: HealthConcernData,
  demographics: DemographicsData,
  selectedCauses: PotentialCause[],
  userLanguage?: string
): Promise<PotentialSymptom[]> {
  if (!selectedCauses || selectedCauses.length === 0) {
    throw new RecipeApiError(
      'At least one cause must be selected',
      400,
      'NO_CAUSES_SELECTED'
    );
  }

  const requestBody: PotentialSymptomsRequest = {
    ...createBaseRequest(healthConcern, demographics, userLanguage),
    selected_causes: selectedCauses,
    step: API_STEPS.POTENTIAL_SYMPTOMS
  };

  try {
    const response = await makeApiRequest<ApiResponse<PotentialSymptomsResponse>[]>(requestBody);
    
    if (response && response.length > 0 && response[0].message?.content?.potential_symptoms) {
      return response[0].message.content.potential_symptoms;
    }

    throw new RecipeApiError(
      'Invalid response format for potential symptoms',
      500,
      'INVALID_RESPONSE'
    );

  } catch (error) {
    if (error instanceof RecipeApiError) {
      throw error;
    }
    throw new RecipeApiError(
      'Failed to fetch potential symptoms',
      500,
      'FETCH_SYMPTOMS_ERROR',
      error as Error
    );
  }
}

/**
 * Fetches therapeutic properties based on selected causes and symptoms
 */
export async function fetchTherapeuticProperties(
  healthConcern: HealthConcernData,
  demographics: DemographicsData,
  selectedCauses: PotentialCause[],
  selectedSymptoms: PotentialSymptom[],
  userLanguage?: string
): Promise<TherapeuticProperty[]> {
  if (!selectedCauses || selectedCauses.length === 0) {
    throw new RecipeApiError(
      'At least one cause must be selected',
      400,
      'NO_CAUSES_SELECTED'
    );
  }

  if (!selectedSymptoms || selectedSymptoms.length === 0) {
    throw new RecipeApiError(
      'At least one symptom must be selected',
      400,
      'NO_SYMPTOMS_SELECTED'
    );
  }

  const requestBody: MedicalPropertiesRequest = {
    ...createBaseRequest(healthConcern, demographics, userLanguage),
    selected_causes: selectedCauses,
    selected_symptoms: selectedSymptoms,
    step: API_STEPS.MEDICAL_PROPERTIES
  };

  try {
    const response = await makeApiRequest<ApiResponse<MedicalPropertiesResponse>[]>(requestBody);
    
    if (response && response.length > 0 && response[0].message?.content?.therapeutic_properties) {
      return response[0].message.content.therapeutic_properties;
    }

    throw new RecipeApiError(
      'Invalid response format for therapeutic properties',
      500,
      'INVALID_RESPONSE'
    );

  } catch (error) {
    if (error instanceof RecipeApiError) {
      throw error;
    }
    throw new RecipeApiError(
      'Failed to fetch therapeutic properties',
      500,
      'FETCH_PROPERTIES_ERROR',
      error as Error
    );
  }
}

/**
 * Fetches suggested oils for a specific therapeutic property
 */
export async function fetchSuggestedOilsForProperty(
  healthConcern: HealthConcernData,
  demographics: DemographicsData,
  selectedCauses: PotentialCause[],
  selectedSymptoms: PotentialSymptom[],
  therapeuticProperty: TherapeuticProperty,
  userLanguage?: string
): Promise<PropertyOilSuggestions> {
  const requestBody: SuggestedOilsRequest = {
    ...createBaseRequest(healthConcern, demographics, userLanguage),
    selected_causes: selectedCauses,
    selected_symptoms: selectedSymptoms,
    therapeutic_properties: [therapeuticProperty],
    step: API_STEPS.SUGGESTED_OILS
  };

  try {
    const response = await makeApiRequest<ApiResponse<SuggestedOilsResponse>[]>(requestBody);
    
    if (response && response.length > 0 && response[0].message?.content) {
      const content = response[0].message.content;
      return {
        property_id: content.property_id,
        property_name: content.property_name,
        property_name_in_english: content.property_name_in_english,
        description: content.description,
        suggested_oils: content.suggested_oils
      };
    }

    throw new RecipeApiError(
      'Invalid response format for suggested oils',
      500,
      'INVALID_RESPONSE'
    );

  } catch (error) {
    if (error instanceof RecipeApiError) {
      throw error;
    }
    throw new RecipeApiError(
      'Failed to fetch suggested oils',
      500,
      'FETCH_OILS_ERROR',
      error as Error
    );
  }
}

/**
 * Fetches suggested oils for multiple therapeutic properties
 * Makes concurrent requests for better performance
 */
export async function fetchSuggestedOilsForAllProperties(
  healthConcern: HealthConcernData,
  demographics: DemographicsData,
  selectedCauses: PotentialCause[],
  selectedSymptoms: PotentialSymptom[],
  therapeuticProperties: TherapeuticProperty[],
  userLanguage?: string
): Promise<PropertyOilSuggestions[]> {
  if (!therapeuticProperties || therapeuticProperties.length === 0) {
    throw new RecipeApiError(
      'At least one therapeutic property is required',
      400,
      'NO_PROPERTIES_PROVIDED'
    );
  }

  try {
    // Make concurrent requests for all properties
    const promises = therapeuticProperties.map(property =>
      fetchSuggestedOilsForProperty(
        healthConcern,
        demographics,
        selectedCauses,
        selectedSymptoms,
        property,
        userLanguage
      )
    );

    const results = await Promise.allSettled(promises);
    
    // Process results and handle any failures
    const successfulResults: PropertyOilSuggestions[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value);
      } else {
        const propertyName = therapeuticProperties[index].property_name;
        errors.push(`Failed to fetch oils for ${propertyName}: ${result.reason.message}`);
      }
    });

    // If we have some successful results, return them
    if (successfulResults.length > 0) {
      if (errors.length > 0) {
        console.warn('Some oil suggestions failed to load:', errors);
      }
      return successfulResults;
    }

    // If all requests failed, throw an error
    throw new RecipeApiError(
      'Failed to fetch oil suggestions for any therapeutic property',
      500,
      'ALL_OILS_FETCH_FAILED'
    );

  } catch (error) {
    if (error instanceof RecipeApiError) {
      throw error;
    }
    throw new RecipeApiError(
      'Failed to fetch suggested oils for properties',
      500,
      'FETCH_ALL_OILS_ERROR',
      error as Error
    );
  }
}

/**
 * Health check function to verify API connectivity
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(INTERNAL_API_ENDPOINT, {
      method: 'GET',
    });
    
    return response.ok;
  } catch {
    return false;
  }
}
