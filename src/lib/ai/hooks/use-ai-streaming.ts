// src/lib/ai/hooks/use-ai-streaming.ts
// Core reusable hook for OpenAI Agents JS SDK streaming with generic type support

import { useState, useEffect, useRef, useCallback } from 'react';
import { parse } from 'best-effort-json-parser';

/**
 * Configuration options for the streaming hook.
 */
export interface StreamConfig {
  /** Maximum number of retry attempts for failed requests. */
  maxRetries?: number;
  /** Delay between retry attempts in milliseconds. */
  retryDelay?: number;
  /** Request timeout in milliseconds. */
  timeout?: number;
  /**
   * Callback for handling errors during streaming.
   * @param error The error that occurred.
   * @param retryCount Current retry attempt number (0-based).
   * @returns boolean Whether to continue retrying (true) or stop (false).
   */
  onError?: (error: Error, retryCount: number) => boolean | Promise<boolean>;
  /** Path to the array of items in a JSON text stream, e.g., 'data.potential_causes'. */
  jsonArrayPath?: string;
}

/**
 * Stream event types from SSE.
 */
export interface StreamEvent {
  type: 'text_chunk' | 'structured_data' | 'structured_complete' | 'completion' | 'error';
  content?: string;
  data?: any;
  message?: string;
}

/**
 * Request data structure for streaming API.
 */
export interface StreamRequest {
  feature: string;
  step: string;
  data: any;
}

/**
 * Hook state interface.
 */
export interface StreamState<T> {
  streamingText: string;
  partialData: T | null;
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
  finalData: T | null;
  startStream: (url: string, requestData: StreamRequest) => Promise<void>;
  resetStream: () => void;
}

/**
 * Default configuration.
 */
const DEFAULT_CONFIG: Required<StreamConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  onError: () => true, // Default: always retry on error
  jsonArrayPath: '',
};

/**
 * Reusable hook for OpenAI Agents JS SDK streaming
 * Provides real-time text accumulation, error handling, and SSE connection management
 */
export function useAIStreaming<T = any>(config: StreamConfig = {}): StreamState<T> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // State management
  const [streamingText, setStreamingText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [finalData, setFinalData] = useState<T | null>(null);
  const [partialData, setPartialData] = useState<T | null>(null);

  // Refs for cleanup and retry logic
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const retryCountRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Clean up connections and timers
   */
  const cleanup = useCallback(() => {
    try {
      // Abort any ongoing request first
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Clear reader reference without calling releaseLock
      // The abort signal will handle the cleanup
      if (readerRef.current) {
        readerRef.current = null;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (cleanupError) {
      // Ignore cleanup errors - they're usually harmless
      console.debug('Cleanup error (harmless):', cleanupError);
    }
  }, []);

  /**
   * Reset stream state to initial values
   */
  const resetStream = useCallback(() => {
    cleanup();
    setStreamingText('');
    setIsStreaming(false);
    setIsComplete(false);
    setError(null);
    setFinalData(null);
    setPartialData(null);
    retryCountRef.current = 0;
  }, [cleanup]);

  /**
   * Handle stream events from SSE
   */
  const handleStreamEvent = useCallback((event: MessageEvent) => {
    try {
      const streamEvent: StreamEvent = JSON.parse(event.data);

      switch (streamEvent.type) {
        case 'text_chunk':
          if (streamEvent.content) {
            setStreamingText(prev => {
              const newText = prev + streamEvent.content;
              if (mergedConfig.jsonArrayPath) {
                try {
                  const parsed = parse(newText);
                  const get = (p: string, o: any) =>
                    p.split('.').reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);
                  const partialArray = get(mergedConfig.jsonArrayPath, parsed);

                  if (Array.isArray(partialArray)) {
                    setPartialData(partialArray as T);
                  }
                } catch (e) {
                  // Best-effort parser can fail on intermediate chunks, ignore
                }
              }
              return newText;
            });
          }
          break;

        case 'structured_data':
          if (streamEvent.data) {
            console.log('📦 Received complete structured item:', {
              index: (streamEvent as any).index,
              name: streamEvent.data.name_localized,
              hasAllFields: !!(streamEvent.data.name_localized && streamEvent.data.suggestion_localized && streamEvent.data.explanation_localized)
            });

            setPartialData(prev => {
              const prevArray = Array.isArray(prev) ? prev : [];

              // Only add if this is a complete item with all required fields
              if (streamEvent.data.name_localized &&
                  streamEvent.data.suggestion_localized &&
                  streamEvent.data.explanation_localized) {
                const newArray = [...prevArray, streamEvent.data];
                console.log('✅ Added complete item, total items:', newArray.length);
                return newArray as T;
              } else {
                console.log('⏳ Skipping incomplete item');
                return prevArray as T;
              }
            });
          }
          break;

        case 'structured_complete':
          if (streamEvent.data) {
            setFinalData(streamEvent.data as T);
          }
          setIsComplete(true);
          setIsStreaming(false);
          // Don't call cleanup here - let the stream complete naturally
          break;

        case 'completion':
          setFinalData(streamEvent.data);
          setIsComplete(true);
          setIsStreaming(false);
          // Don't call cleanup here - let the stream complete naturally
          break;

        case 'error':
          setError(streamEvent.message || 'Unknown streaming error');
          setIsStreaming(false);
          // Don't call cleanup here - let the error handling in createStreamingConnection handle it
          break;

        default:
          console.warn('Unknown stream event type:', streamEvent.type);
      }
    } catch (parseError) {
      console.error('Failed to parse stream event:', parseError);
      setError('Failed to parse streaming response');
      setIsStreaming(false);
      cleanup();
    }
  }, [cleanup]);

  /**
   * Handle connection errors with retry logic
   */
  const handleConnectionError = useCallback((url: string, requestData: StreamRequest) => {
    if (retryCountRef.current < mergedConfig.maxRetries) {
      retryCountRef.current += 1;
      const delay = mergedConfig.retryDelay * Math.pow(2, retryCountRef.current - 1);

      console.log(`Retrying connection (attempt ${retryCountRef.current}/${mergedConfig.maxRetries}) in ${delay}ms`);

      timeoutRef.current = setTimeout(() => {
        // Retry by creating a new streaming connection
        createStreamingConnection(url, requestData);
      }, delay);
    } else {
      setError('Failed to establish streaming connection after maximum retries');
      setIsStreaming(false);
      cleanup();
    }
  }, [mergedConfig.maxRetries, mergedConfig.retryDelay, cleanup]);

  /**
   * Create fetch-based streaming connection (replaces EventSource)
   */
  const createStreamingConnection = useCallback(async (url: string, requestData: StreamRequest) => {
    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Set up timeout
      timeoutRef.current = setTimeout(() => {
        setError('Streaming connection timeout');
        setIsStreaming(false);
        cleanup();
      }, mergedConfig.timeout);

      // Make POST request with streaming
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(requestData),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body available for streaming');
      }

      // Reset retry count on successful connection
      retryCountRef.current = 0;

      // Clear timeout since connection is established
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Process streaming response
      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();

      try {
        while (true) {
          // Check if we should abort before reading
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          const { done, value } = await reader.read();

          if (done) {
            // Stream completed successfully
            console.log('Stream completed naturally');
            setIsComplete(true);
            setIsStreaming(false);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });

          // Parse SSE data
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));

                // Create synthetic event object for compatibility
                const syntheticEvent = {
                  data: JSON.stringify(data),
                  type: 'message'
                } as MessageEvent;

                handleStreamEvent(syntheticEvent);
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', line);
              }
            }
          }
        }
      } catch (readError) {
        // Don't log errors if the request was aborted
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('Error reading stream:', readError);
          throw readError;
        }
      } finally {
        // Clean up reader reference and set streaming to false
        readerRef.current = null;
        setIsStreaming(false);
      }

    } catch (error) {
      // Don't retry if the request was aborted
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
        console.log('Streaming connection aborted - this is normal during cleanup');
        setIsStreaming(false);
        return;
      }

      console.error('Streaming connection error:', error);
      setIsStreaming(false);
      handleConnectionError(url, requestData);
    }
  }, [mergedConfig.timeout, cleanup, handleStreamEvent, handleConnectionError]);

  /**
   * Start streaming from the specified URL
   */
  const startStream = useCallback(async (url: string, requestData: StreamRequest) => {
    // Prevent starting a new stream if one is already active
    if (isStreaming) {
      console.warn('Stream already active, cleaning up before starting new one');
      cleanup();
    }

    // Reset state for new stream
    setStreamingText('');
    setIsComplete(false);
    setError(null);
    setFinalData(null);
    setPartialData(null);
    setIsStreaming(true);

    // Clean up any existing connections
    cleanup();

    try {
      console.log('AI streaming initiated successfully');

      // Create streaming connection directly (no separate POST needed)
      await createStreamingConnection(url, requestData);

    } catch (fetchError) {
      console.error('Failed to initiate streaming:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to start streaming');
      setIsStreaming(false);
    }
  }, [isStreaming, cleanup, createStreamingConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    streamingText,
    isStreaming,
    isComplete,
    error,
    finalData,
    partialData,
    startStream,
    resetStream,
  };
}
