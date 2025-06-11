/**
 * @fileoverview Streaming AI Service for Recipe Wizard
 * Integrates with bulletproof streaming infrastructure for real-time AI responses
 */

import { useAIStreaming } from '../../../lib/ai/hooks/use-ai-streaming';
import type {
  PotentialCause,
  DemographicsData
} from '../types/recipe-wizard.types';
import type { StreamState } from '../../../lib/ai/hooks/use-ai-streaming';

/**
 * Request interface for streaming AI service calls
 */
interface StreamingAIServiceRequest {
  healthConcern: string;
  demographics: DemographicsData;
}

/**
 * Streaming AI Service Error class for better error handling
 */
export class StreamingAIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'StreamingAIServiceError';
  }
}

/**
 * Streaming response type for potential causes
 */
export type StreamingPotentialCausesResponse = StreamState<PotentialCause[]>;

/**
 * Fetch potential causes with real-time streaming
 * Integrates with bulletproof streaming infrastructure
 * 
 * @param request - Health concern and demographics data
 * @returns Streaming response object with real-time updates
 */
export async function fetchPotentialCausesStreaming(
  request: StreamingAIServiceRequest
): Promise<StreamingPotentialCausesResponse> {
  // Input validation
  if (!request.healthConcern?.trim()) {
    throw new StreamingAIServiceError(
      'Health concern is required',
      'MISSING_HEALTH_CONCERN'
    );
  }

  if (!request.demographics) {
    throw new StreamingAIServiceError(
      'Demographics information is required',
      'MISSING_DEMOGRAPHICS'
    );
  }

  // Use the bulletproof streaming hook with PotentialCause[] type
  const streamingResponse = useAIStreaming<PotentialCause[]>({
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000
  });

  // Configure the streaming request data
  const streamRequestData = {
    feature: 'recipe-wizard',
    step: 'potential-causes',
    data: {
      healthConcern: request.healthConcern,
      demographics: request.demographics
    }
  };

  // Return the streaming response with pre-configured request data
  return {
    ...streamingResponse,
    // Override startStream to use our specific endpoint and data
    startStream: async (url?: string) => {
      const streamingUrl = url || '/api/ai/streaming';
      return streamingResponse.startStream(streamingUrl, streamRequestData);
    }
  };
}

/**
 * Start streaming potential causes analysis
 * Convenience function that immediately starts the streaming process
 * 
 * @param request - Health concern and demographics data
 * @param streamingMode - Optional streaming mode ('structured', 'hybrid', 'text', 'auto')
 * @returns Streaming response object with analysis already started
 */
export async function startPotentialCausesStreaming(
  request: StreamingAIServiceRequest,
  streamingMode: 'structured' | 'hybrid' | 'text' | 'auto' = 'structured'
): Promise<StreamingPotentialCausesResponse> {
  const streamingResponse = await fetchPotentialCausesStreaming(request);
  
  // Prepare request data with streaming mode
  const streamRequestData = {
    feature: 'recipe-wizard',
    step: 'potential-causes',
    data: {
      healthConcern: request.healthConcern,
      demographics: request.demographics
    },
    streamingMode
  };

  // Start streaming immediately
  await streamingResponse.startStream('/api/ai/streaming', streamRequestData);
  
  return streamingResponse;
}

/**
 * Health check for streaming AI service availability
 * Tests both the streaming endpoint and the bulletproof infrastructure
 */
export async function checkStreamingAIServiceHealth(): Promise<{
  available: boolean;
  endpoint: string;
  features: string[];
  streamingModes: string[];
}> {
  try {
    const response = await fetch('/api/ai/streaming', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return {
        available: false,
        endpoint: '/api/ai/streaming',
        features: [],
        streamingModes: []
      };
    }

    const data = await response.json();
    return {
      available: data.status === 'healthy' && data.configured === true,
      endpoint: '/api/ai/streaming',
      features: data.features || ['recipe-wizard'],
      streamingModes: ['structured', 'hybrid', 'text', 'auto']
    };
  } catch (error) {
    console.error('Streaming AI Service health check failed:', error);
    return {
      available: false,
      endpoint: '/api/ai/streaming',
      features: [],
      streamingModes: []
    };
  }
}

/**
 * Get streaming AI service configuration and capabilities
 */
export function getStreamingAIServiceInfo() {
  return {
    provider: 'OpenAI Agents JS SDK',
    version: '0.0.4',
    model: 'gpt-4o-mini',
    features: ['potential-causes-analysis'],
    streamingModes: ['structured', 'hybrid', 'text', 'auto'],
    infrastructure: 'bulletproof-streaming',
    parser: 'best-effort-json-parser',
    endpoint: '/api/ai/streaming',
    status: 'active'
  };
}

/**
 * Utility function to extract structured data from streaming response
 * Useful for components that need to access individual potential causes as they arrive
 * 
 * @param streamingResponse - The streaming response object
 * @returns Array of potential causes available so far
 */
export function extractAvailableCauses(
  streamingResponse: StreamingPotentialCausesResponse
): PotentialCause[] {
  // If streaming is complete, return final data
  if (streamingResponse.isComplete && streamingResponse.finalData) {
    return streamingResponse.finalData;
  }

  // For progressive streaming, we could parse the streaming text
  // but the bulletproof infrastructure handles this automatically
  // through structured streaming events
  return streamingResponse.finalData || [];
}

/**
 * Utility function to get streaming progress information
 * Useful for progress indicators and user feedback
 */
export function getStreamingProgress(
  streamingResponse: StreamingPotentialCausesResponse
): {
  isActive: boolean;
  hasContent: boolean;
  isComplete: boolean;
  hasError: boolean;
  progress: number; // 0-100
} {
  const hasContent = streamingResponse.streamingText.length > 0;
  const isActive = streamingResponse.isStreaming;
  const isComplete = streamingResponse.isComplete;
  const hasError = streamingResponse.error !== null;

  // Calculate rough progress based on content length and completion
  let progress = 0;
  if (hasError) {
    progress = 0;
  } else if (isComplete) {
    progress = 100;
  } else if (isActive && hasContent) {
    // Rough estimate: assume 7 causes, each ~200 chars
    const estimatedTotalLength = 7 * 200;
    progress = Math.min(90, (streamingResponse.streamingText.length / estimatedTotalLength) * 100);
  }

  return {
    isActive,
    hasContent,
    isComplete,
    hasError,
    progress: Math.round(progress)
  };
}
