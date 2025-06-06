/**
 * @fileoverview API route handler for proxying Essential Oil Recipe Creator requests
 * to the external AromaRx API. Handles server-side API key management and security.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerLogger } from '@/lib/logger';
import { 
  EXTERNAL_API_URL, 
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
 * Validates the external API key is available
 */
function validateApiKey(): string {
  const apiKey = process.env.EXTERNAL_APIKEY;
  
  if (!apiKey) {
    logger.error('External API key not configured', {
      operation: 'validateApiKey',
      environment: process.env.NODE_ENV
    });
    throw new Error('External API key not configured');
  }
  
  return apiKey;
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
 * Makes a request to the external API with retry logic
 */
async function makeExternalApiRequest(
  requestBody: ExternalApiRequest,
  apiKey: string,
  attempt: number = 1
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    logger.info('Making external API request', {
      operation: 'makeExternalApiRequest',
      step: requestBody.step,
      attempt,
      maxRetries: API_RETRY_CONFIG.maxRetries
    });
    
    const response = await fetch(EXTERNAL_API_URL, {
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
      responseSize: JSON.stringify(data).length
    });
    
    return data;
    
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
      return makeExternalApiRequest(requestBody, apiKey, attempt + 1);
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
    // Validate API key
    const apiKey = validateApiKey();
    
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
    
    // Make request to external API
    const apiResponse = await makeExternalApiRequest(validatedBody, apiKey);
    
    const duration = Date.now() - startTime;
    
    logger.info('Recipe API request completed successfully', {
      operation: 'POST /api/create-recipe',
      step: validatedBody.step,
      duration,
      responseSize: JSON.stringify(apiResponse).length
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
          error.message.includes('Invalid step')) {
        return createErrorResponse(error.message, 400, 'Bad Request');
      }
      
      if (error.message.includes('not configured')) {
        return createErrorResponse(
          'Service temporarily unavailable. Please try again later.',
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
    const hasApiKey = !!process.env.EXTERNAL_APIKEY;
    
    return NextResponse.json({
      status: 'healthy',
      service: 'Recipe Creator API Proxy',
      version: '1.0.0',
      configured: hasApiKey,
      endpoints: {
        external: EXTERNAL_API_URL,
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
