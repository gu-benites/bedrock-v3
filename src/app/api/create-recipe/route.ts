/**
 * @fileoverview API route handler for proxying Essential Oil Recipe Creator requests
 * to the external AromaRx API. Handles server-side API key management and security.
 *
 * Environment Variables Required:
 * - CREATE_RECIPE_APIKEY: API key for external recipe service authentication
 * - CREATE_RECIPE_BASE_URL: Base URL for the external recipe API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerLogger } from '@/lib/logger';
import {
  API_RETRY_CONFIG,
  API_TIMEOUT
} from '@/features/create-recipe/constants/recipe.constants';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const logger = getServerLogger();

/**
 * Interface for the external API request body
 */
interface ExternalApiRequest {
  health_concern: string;
  gender: 'male' | 'female';
  age_category: string;
  age_specific: string;
  step: string;
  user_language: string;
  selected_causes?: any[];
  selected_symptoms?: any[];
  therapeutic_properties?: any[];
  suggested_oils_for_properties?: any[];
}

/**
 * Interface for API error responses
 */
interface ApiErrorResponse {
  error: string;
  message: string;
  status: number;
  timestamp: string;
}

/**
 * Validates the recipe creator API key is available
 */
function validateApiKey(): string {
  const apiKey = process.env['CREATE_RECIPE_APIKEY'];

  if (!apiKey) {
    logger.error('Recipe creator API key not configured', {
      operation: 'validateApiKey',
      environment: process.env.NODE_ENV,
      variable: 'CREATE_RECIPE_APIKEY'
    });
    throw new Error('Recipe creator API key not configured');
  }

  return apiKey;
}

/**
 * Validates the recipe creator API base URL is available
 */
function validateApiBaseUrl(): string {
  const baseUrl = process.env['CREATE_RECIPE_BASE_URL'];

  if (!baseUrl) {
    logger.error('Recipe creator API base URL not configured', {
      operation: 'validateApiBaseUrl',
      environment: process.env.NODE_ENV,
      variable: 'CREATE_RECIPE_BASE_URL'
    });
    throw new Error('Recipe creator API base URL not configured');
  }

  return baseUrl;
}

/**
 * Validates the request body structure
 */
function validateRequestBody(body: any): ExternalApiRequest {
  const requiredFields = ['health_concern', 'gender', 'age_category', 'age_specific', 'step', 'user_language'];
  
  for (const field of requiredFields) {
    if (!body[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Validate gender
  if (!['male', 'female'].includes(body.gender)) {
    throw new Error('Invalid gender value. Must be "male" or "female"');
  }
  
  // Validate step
  const validSteps = ['PotentialCauses', 'PotentialSymptoms', 'MedicalProperties', 'SuggestedOils', 'RecipeChoices'];
  if (!validSteps.includes(body.step)) {
    throw new Error(`Invalid step value. Must be one of: ${validSteps.join(', ')}`);
  }
  
  return body as ExternalApiRequest;
}

/**
 * Validates the response format from the external API
 */
function validateResponseFormat(response: any, step: string): void {
  if (!response || typeof response !== 'object') {
    logger.error('Response validation failed: invalid response type', {
      operation: 'validateResponseFormat',
      step,
      responseType: typeof response,
      response: response
    });
    throw new Error('Invalid response format: response must be an object');
  }

  switch (step) {
    case 'PotentialCauses':
      if (!response.potential_causes || !Array.isArray(response.potential_causes)) {
        logger.error('Response validation failed: missing potential_causes', {
          operation: 'validateResponseFormat',
          step,
          responseKeys: Object.keys(response || {}),
          hasPotentialCauses: !!response.potential_causes,
          potentialCausesType: typeof response.potential_causes,
          responsePreview: JSON.stringify(response).substring(0, 500) + '...'
        });
        throw new Error('Invalid response format: missing or invalid potential_causes array');
      }
      break;
    case 'PotentialSymptoms':
      if (!response.potential_symptoms || !Array.isArray(response.potential_symptoms)) {
        logger.error('Response validation failed: missing potential_symptoms', {
          operation: 'validateResponseFormat',
          step,
          responseKeys: Object.keys(response || {}),
          hasPotentialSymptoms: !!response.potential_symptoms,
          potentialSymptomsType: typeof response.potential_symptoms,
          responsePreview: JSON.stringify(response).substring(0, 500) + '...'
        });
        throw new Error('Invalid response format: missing or invalid potential_symptoms array');
      }
      break;
    case 'MedicalProperties':
      if (!response.therapeutic_properties || !Array.isArray(response.therapeutic_properties)) {
        throw new Error('Invalid response format: missing or invalid therapeutic_properties array');
      }
      break;
    case 'SuggestedOils':
      if (!response.suggested_oils || !Array.isArray(response.suggested_oils)) {
        throw new Error('Invalid response format: missing or invalid suggested_oils array');
      }
      break;
    default:
      logger.warn('Unknown step for response validation', { step });
  }
}

/**
 * Makes a request to the external API with retry logic
 */
async function makeExternalApiRequest(
  requestBody: ExternalApiRequest,
  apiKey: string,
  baseUrl: string,
  attempt: number = 1
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    logger.info('Making external API request', {
      operation: 'makeExternalApiRequest',
      step: requestBody.step,
      attempt,
      maxRetries: API_RETRY_CONFIG.maxRetries,
      baseUrl: baseUrl.substring(0, 50) + '...' // Log partial URL for security
    });

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'AromaChat-Recipe-Creator/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('External API request failed', {
        operation: 'makeExternalApiRequest',
        status: response.status,
        statusText: response.statusText,
        errorText,
        attempt
      });
      
      throw new Error(`External API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();

    logger.info('External API request successful', {
      operation: 'makeExternalApiRequest',
      step: requestBody.step,
      attempt,
      responseSize: JSON.stringify(data).length,
      isArray: Array.isArray(data),
      hasFirstItem: Array.isArray(data) && data.length > 0,
      firstItemStructure: Array.isArray(data) && data.length > 0 ? Object.keys(data[0] || {}) : [],
      hasMessage: Array.isArray(data) && data.length > 0 && !!data[0].message,
      hasContent: Array.isArray(data) && data.length > 0 && !!data[0].message?.content,
      rawDataPreview: JSON.stringify(data).substring(0, 1000) + '...'
    });

    // Extract content from n8n workflow response format
    let processedData = data;

    // Handle array format (old n8n format)
    if (Array.isArray(data) && data.length > 0 && data[0].message?.content) {
      processedData = data[0].message.content;
      logger.info('Extracted content from n8n workflow array response format', {
        operation: 'makeExternalApiRequest',
        step: requestBody.step,
        extractedSize: JSON.stringify(processedData).length,
        extractedKeys: Object.keys(processedData || {}),
        extractedDataPreview: JSON.stringify(processedData).substring(0, 500) + '...'
      });
    }
    // Handle direct object format (new n8n format)
    else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      // Data is already in the correct format
      processedData = data;
      logger.info('Using direct n8n workflow response format', {
        operation: 'makeExternalApiRequest',
        step: requestBody.step,
        responseSize: JSON.stringify(processedData).length,
        responseKeys: Object.keys(processedData || {}),
        responsePreview: JSON.stringify(processedData).substring(0, 500) + '...'
      });
    }
    else {
      logger.warn('Unexpected n8n response format, using raw data', {
        operation: 'makeExternalApiRequest',
        step: requestBody.step,
        dataStructure: Array.isArray(data) ? 'array' : typeof data,
        dataKeys: typeof data === 'object' ? Object.keys(data || {}) : [],
        dataPreview: JSON.stringify(data).substring(0, 500) + '...'
      });
    }

    // Additional fallback: try to find the expected data structure anywhere in the response
    if (requestBody.step === 'PotentialCauses' && !processedData.potential_causes) {
      // Look for potential_causes in nested structures
      const searchForCauses = (obj: any): any => {
        if (obj && typeof obj === 'object') {
          if (obj.potential_causes && Array.isArray(obj.potential_causes)) {
            return obj;
          }
          for (const key in obj) {
            const result = searchForCauses(obj[key]);
            if (result) return result;
          }
        }
        return null;
      };

      const foundData = searchForCauses(data);
      if (foundData) {
        processedData = foundData;
        logger.info('Found potential_causes in nested structure', {
          operation: 'makeExternalApiRequest',
          step: requestBody.step,
          foundKeys: Object.keys(foundData || {})
        });
      }
    }

    // Additional fallback for symptoms
    if (requestBody.step === 'PotentialSymptoms' && !processedData.potential_symptoms) {
      // Look for potential_symptoms in nested structures
      const searchForSymptoms = (obj: any): any => {
        if (obj && typeof obj === 'object') {
          if (obj.potential_symptoms && Array.isArray(obj.potential_symptoms)) {
            return obj;
          }
          for (const key in obj) {
            const result = searchForSymptoms(obj[key]);
            if (result) return result;
          }
        }
        return null;
      };

      const foundData = searchForSymptoms(data);
      if (foundData) {
        processedData = foundData;
        logger.info('Found potential_symptoms in nested structure', {
          operation: 'makeExternalApiRequest',
          step: requestBody.step,
          foundKeys: Object.keys(foundData || {})
        });
      }
    }

    // Additional fallback for therapeutic properties
    if (requestBody.step === 'MedicalProperties' && !processedData.therapeutic_properties) {
      // Look for therapeutic_properties in nested structures
      const searchForProperties = (obj: any): any => {
        if (obj && typeof obj === 'object') {
          if (obj.therapeutic_properties && Array.isArray(obj.therapeutic_properties)) {
            return obj;
          }
          for (const key in obj) {
            const result = searchForProperties(obj[key]);
            if (result) return result;
          }
        }
        return null;
      };

      const foundData = searchForProperties(data);
      if (foundData) {
        processedData = foundData;
        logger.info('Found therapeutic_properties in nested structure', {
          operation: 'makeExternalApiRequest',
          step: requestBody.step,
          foundKeys: Object.keys(foundData || {})
        });
      }
    }

    // Additional fallback for suggested oils
    if (requestBody.step === 'SuggestedOils' && !processedData.suggested_oils) {
      // Look for suggested_oils in nested structures
      const searchForOils = (obj: any): any => {
        if (obj && typeof obj === 'object') {
          if (obj.suggested_oils && Array.isArray(obj.suggested_oils)) {
            return obj;
          }
          for (const key in obj) {
            const result = searchForOils(obj[key]);
            if (result) return result;
          }
        }
        return null;
      };

      const foundData = searchForOils(data);
      if (foundData) {
        processedData = foundData;
        logger.info('Found suggested_oils in nested structure', {
          operation: 'makeExternalApiRequest',
          step: requestBody.step,
          foundKeys: Object.keys(foundData || {})
        });
      }
    }

    return processedData;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error('External API request timed out', {
        operation: 'makeExternalApiRequest',
        timeout: API_TIMEOUT,
        attempt
      });
      throw new Error('Request timed out');
    }
    
    // Retry logic
    if (attempt < API_RETRY_CONFIG.maxRetries) {
      const delay = API_RETRY_CONFIG.retryDelay * Math.pow(API_RETRY_CONFIG.backoffMultiplier, attempt - 1);
      
      logger.warn('Retrying external API request', {
        operation: 'makeExternalApiRequest',
        attempt,
        nextAttempt: attempt + 1,
        delay,
        error: error instanceof Error ? error.message : String(error)
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeExternalApiRequest(requestBody, apiKey, baseUrl, attempt + 1);
    }
    
    logger.error('External API request failed after all retries', {
      operation: 'makeExternalApiRequest',
      attempts: attempt,
      error: error instanceof Error ? error.message : String(error)
    });
    
    throw error;
  }
}

/**
 * Creates an error response with consistent structure
 */
function createErrorResponse(
  message: string,
  status: number = 500,
  error?: string
): NextResponse<ApiErrorResponse> {
  const errorResponse: ApiErrorResponse = {
    error: error || 'Internal Server Error',
    message,
    status,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(errorResponse, { status });
}

/**
 * POST handler for recipe creation API requests
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Validate API key and base URL
    const apiKey = validateApiKey();
    const baseUrl = validateApiBaseUrl();

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = validateRequestBody(body);
    
    logger.info('Processing recipe API request', {
      operation: 'POST /api/create-recipe',
      step: validatedBody.step,
      healthConcern: validatedBody.health_concern?.substring(0, 50) + '...',
      gender: validatedBody.gender,
      ageCategory: validatedBody.age_category
    });
    
    // Make request to external API (this already extracts content from n8n format)
    const apiResponse = await makeExternalApiRequest(validatedBody, apiKey, baseUrl);

    // Validate response format based on step (after content extraction)
    validateResponseFormat(apiResponse, validatedBody.step);

    const duration = Date.now() - startTime;

    logger.info('Recipe API request completed successfully', {
      operation: 'POST /api/create-recipe',
      step: validatedBody.step,
      duration,
      responseSize: JSON.stringify(apiResponse).length,
      responseKeys: Object.keys(apiResponse || {})
    });
    
    // Return successful response
    return NextResponse.json(apiResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${duration}ms`
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Recipe API request failed', {
      operation: 'POST /api/create-recipe',
      duration,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Missing required field') ||
          error.message.includes('Invalid gender') ||
          error.message.includes('Invalid step') ||
          error.message.includes('Invalid response format')) {
        return createErrorResponse(error.message, 400, 'Bad Request');
      }
      
      if (error.message.includes('not configured')) {
        return createErrorResponse(
          'Recipe creator service is not properly configured. Please contact support.',
          503,
          'Service Unavailable'
        );
      }
      
      if (error.message.includes('timed out')) {
        return createErrorResponse(
          'Request timed out. Please try again.',
          408,
          'Request Timeout'
        );
      }
      
      if (error.message.includes('External API request failed')) {
        return createErrorResponse(
          'External service is currently unavailable. Please try again later.',
          502,
          'Bad Gateway'
        );
      }
    }
    
    // Generic error response
    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      500,
      'Internal Server Error'
    );
  }
}

/**
 * GET handler - returns API status and configuration
 */
export async function GET(): Promise<NextResponse> {
  try {
    const hasApiKey = !!process.env['CREATE_RECIPE_APIKEY'];
    const hasBaseUrl = !!process.env['CREATE_RECIPE_BASE_URL'];
    const isConfigured = hasApiKey && hasBaseUrl;

    return NextResponse.json({
      status: 'healthy',
      service: 'Recipe Creator API Proxy',
      version: '1.0.0',
      configured: isConfigured,
      configuration: {
        hasApiKey,
        hasBaseUrl,
        variables: {
          apiKey: 'CREATE_RECIPE_APIKEY',
          baseUrl: 'CREATE_RECIPE_BASE_URL'
        }
      },
      endpoints: {
        external: process.env['CREATE_RECIPE_BASE_URL'] || 'Not configured',
        timeout: API_TIMEOUT,
        retries: API_RETRY_CONFIG.maxRetries
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Health check failed', {
      operation: 'GET /api/create-recipe',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return createErrorResponse('Health check failed', 500);
  }
}
