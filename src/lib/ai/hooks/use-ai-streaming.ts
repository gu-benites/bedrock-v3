// src/lib/ai/hooks/use-ai-streaming.ts
// Core reusable hook for OpenAI Agents JS SDK streaming with generic type support

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Configuration options for the streaming hook
 */
export interface StreamConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Stream event types from SSE
 */
export interface StreamEvent {
  type: 'text_chunk' | 'completion' | 'error';
  content?: string;
  data?: any;
  message?: string;
}

/**
 * Request data structure for streaming API
 */
export interface StreamRequest {
  feature: string;
  step: string;
  data: any;
}

/**
 * Hook state interface
 */
export interface StreamState<T> {
  streamingText: string;
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
  finalData: T | null;
  startStream: (url: string, requestData: StreamRequest) => Promise<void>;
  resetStream: () => void;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<StreamConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000
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

  // Refs for cleanup and retry logic
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Clean up connections and timers
   */
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
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
            setStreamingText(prev => prev + streamEvent.content);
          }
          break;

        case 'completion':
          setFinalData(streamEvent.data);
          setIsComplete(true);
          setIsStreaming(false);
          cleanup();
          break;

        case 'error':
          setError(streamEvent.message || 'Unknown streaming error');
          setIsStreaming(false);
          cleanup();
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
        // Retry by creating a new EventSource
        createEventSourceConnection(url, requestData);
      }, delay);
    } else {
      setError('Failed to establish streaming connection after maximum retries');
      setIsStreaming(false);
      cleanup();
    }
  }, [mergedConfig.maxRetries, mergedConfig.retryDelay, cleanup]);

  /**
   * Create EventSource connection
   */
  const createEventSourceConnection = useCallback((url: string, requestData: StreamRequest) => {
    // Create SSE connection
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    // Set up timeout
    timeoutRef.current = setTimeout(() => {
      setError('Streaming connection timeout');
      setIsStreaming(false);
      cleanup();
    }, mergedConfig.timeout);

    // Handle connection events
    eventSource.onopen = () => {
      retryCountRef.current = 0; // Reset retry count on successful connection
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    eventSource.onmessage = handleStreamEvent;

    eventSource.onerror = () => {
      cleanup();
      handleConnectionError(url, requestData);
    };
  }, [mergedConfig.timeout, cleanup, handleStreamEvent, handleConnectionError]);

  /**
   * Start streaming from the specified URL
   */
  const startStream = useCallback(async (url: string, requestData: StreamRequest) => {
    // Reset state for new stream
    setStreamingText('');
    setIsComplete(false);
    setError(null);
    setFinalData(null);
    setIsStreaming(true);

    // Clean up any existing connections
    cleanup();

    try {
      // For testing purposes, we'll create the EventSource immediately
      // In a real implementation, you might want to send a POST first to initiate the stream

      // Send POST request to initiate streaming (optional, depends on API design)
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      // Create initial EventSource connection
      createEventSourceConnection(url, requestData);

    } catch (fetchError) {
      console.error('Failed to initiate streaming:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to start streaming');
      setIsStreaming(false);
    }
  }, [cleanup, createEventSourceConnection]);

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
    startStream,
    resetStream
  };
}
