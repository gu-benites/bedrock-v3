// src/lib/ai/utils/stream-helpers.ts
// Utility functions for SSE connection management and stream event processing

/**
 * Event handlers for SSE connections
 */
export interface SSEEventHandlers {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
}

/**
 * Processed stream event result
 */
export interface ProcessedStreamEvent {
  type: 'text_chunk' | 'completion' | 'error';
  content?: string;
  data?: any;
  message?: string;
  isValid: boolean;
  originalData?: string;
}

/**
 * Connection error handling result
 */
export interface ConnectionErrorResult {
  shouldRetry: boolean;
  retryDelay: number;
  retryCount: number;
  errorMessage: string;
}

/**
 * Stream event validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Create SSE connection with optional event handlers
 */
export function createSSEConnection(
  url: string, 
  handlers?: SSEEventHandlers
): EventSource {
  const eventSource = new EventSource(url);

  if (handlers) {
    if (handlers.onOpen) {
      eventSource.onopen = handlers.onOpen;
    }
    if (handlers.onMessage) {
      eventSource.onmessage = handlers.onMessage;
    }
    if (handlers.onError) {
      eventSource.onerror = handlers.onError;
    }
  }

  return eventSource;
}

/**
 * Process raw SSE message event into structured format
 */
export function processStreamEvent(event: MessageEvent): ProcessedStreamEvent {
  try {
    const parsedData = JSON.parse(event.data);

    // Validate event has type field
    if (!parsedData.type) {
      return {
        type: 'error',
        message: 'Invalid stream event: missing type',
        isValid: false,
        originalData: event.data
      };
    }

    // Validate known event types
    const validTypes = ['text_chunk', 'completion', 'error'];
    if (!validTypes.includes(parsedData.type)) {
      return {
        type: 'error',
        message: `Unknown stream event type: ${parsedData.type}`,
        isValid: false,
        originalData: event.data
      };
    }

    // Return valid event
    return {
      type: parsedData.type,
      content: parsedData.content,
      data: parsedData.data,
      message: parsedData.message,
      isValid: true
    };

  } catch (parseError) {
    return {
      type: 'error',
      message: 'Failed to parse stream event',
      isValid: false,
      originalData: event.data
    };
  }
}

/**
 * Parse final streamed response into typed format
 */
export function parseStreamedResponse<T>(responseText: string): T {
  try {
    return JSON.parse(responseText);
  } catch (error) {
    throw new Error('Failed to parse streamed response');
  }
}

/**
 * Handle connection errors with retry logic
 */
export function handleConnectionError(
  error: any,
  currentRetry: number,
  maxRetries: number,
  baseDelay: number = 1000
): ConnectionErrorResult {
  if (currentRetry >= maxRetries) {
    return {
      shouldRetry: false,
      retryDelay: 0,
      retryCount: currentRetry,
      errorMessage: 'Failed to establish streaming connection after maximum retries'
    };
  }

  const retryCount = currentRetry + 1;

  // Calculate exponential backoff delay
  const retryDelay = baseDelay * Math.pow(2, currentRetry);

  return {
    shouldRetry: true,
    retryDelay,
    retryCount,
    errorMessage: error instanceof Error ? error.message : String(error)
  };
}

/**
 * Validate stream event structure
 */
export function validateStreamEvent(event: any): ValidationResult {
  const errors: string[] = [];

  // Check for required type field
  if (!event.type) {
    errors.push('Missing required field: type');
  }

  // Validate specific event types
  if (event.type === 'text_chunk' && !event.content) {
    errors.push('text_chunk events must have content field');
  }

  if (event.type === 'completion' && event.data === undefined) {
    errors.push('completion events must have data field');
  }

  if (event.type === 'error' && !event.message) {
    errors.push('error events must have message field');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
