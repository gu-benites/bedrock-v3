/**
 * Navigation Timing Hook
 * React hook for easy integration of navigation timing in components
 */

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { navigationTiming, type TimingMetrics } from '@/lib/performance/navigation-timing';

interface UseNavigationTimingOptions {
  enabled?: boolean;
  logComponentMount?: boolean;
  logComponentUnmount?: boolean;
  trackRenders?: boolean;
  componentName?: string;
}

export const useNavigationTiming = (options: UseNavigationTimingOptions = {}) => {
  const {
    enabled = process.env.NODE_ENV === 'development',
    logComponentMount = true,
    logComponentUnmount = true,
    trackRenders = false,
    componentName = 'UnknownComponent'
  } = options;

  const router = useRouter();
  const mountTimeRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);

  // Track component mount/unmount
  useEffect(() => {
    if (!enabled) return;

    const mountTime = performance.now();
    mountTimeRef.current = mountTime;

    if (logComponentMount) {
      navigationTiming.logComponentLoad(componentName, 0, {
        phase: 'mount',
        timestamp: mountTime
      });
    }

    return () => {
      if (logComponentUnmount) {
        const unmountTime = performance.now();
        const mountDuration = unmountTime - mountTimeRef.current;
        
        navigationTiming.logComponentLoad(componentName, mountDuration, {
          phase: 'unmount',
          mountDuration,
          renderCount: renderCountRef.current
        });
      }
    };
  }, [enabled, logComponentMount, logComponentUnmount, componentName]);

  // Track renders
  useEffect(() => {
    if (!enabled || !trackRenders) return;

    const renderTime = performance.now();
    renderCountRef.current += 1;
    
    const timeSinceLastRender = lastRenderTimeRef.current > 0 
      ? renderTime - lastRenderTimeRef.current 
      : 0;
    
    lastRenderTimeRef.current = renderTime;

    navigationTiming.logComponentLoad(componentName, timeSinceLastRender, {
      phase: 'render',
      renderCount: renderCountRef.current,
      timeSinceLastRender
    });
  });

  /**
   * Start timing for a specific operation
   */
  const startTiming = useCallback((operationId: string, metadata?: Record<string, any>) => {
    if (!enabled) return;
    
    navigationTiming.startTiming(`${componentName}-${operationId}`, {
      component: componentName,
      ...metadata
    });
  }, [enabled, componentName]);

  /**
   * End timing for a specific operation
   */
  const endTiming = useCallback((operationId: string, metadata?: Record<string, any>): TimingMetrics | null => {
    if (!enabled) return null;
    
    return navigationTiming.endTiming(`${componentName}-${operationId}`, {
      component: componentName,
      ...metadata
    });
  }, [enabled, componentName]);

  /**
   * Log navigation event
   */
  const logNavigation = useCallback((fromStep: string, toStep: string, metadata?: Record<string, any>) => {
    if (!enabled) return;
    
    navigationTiming.logNavigation(fromStep, toStep, {
      component: componentName,
      ...metadata
    });
  }, [enabled, componentName]);

  /**
   * Log AI streaming event
   */
  const logAIStreaming = useCallback((
    step: string, 
    phase: 'start' | 'progress' | 'complete' | 'error', 
    metadata?: Record<string, any>
  ) => {
    if (!enabled) return;
    
    navigationTiming.logAIStreaming(step, phase, {
      component: componentName,
      ...metadata
    });
  }, [enabled, componentName]);

  /**
   * Log user interaction
   */
  const logUserInteraction = useCallback((action: string, metadata?: Record<string, any>) => {
    if (!enabled) return;
    
    const operationId = `user-${action}`;
    navigationTiming.startTiming(operationId, {
      component: componentName,
      action,
      ...metadata
    });
    
    // Auto-end after a short delay for simple interactions
    setTimeout(() => {
      navigationTiming.endTiming(operationId, {
        component: componentName,
        action,
        autoEnded: true,
        ...metadata
      });
    }, 10);
  }, [enabled, componentName]);

  /**
   * Measure async operation
   */
  const measureAsync = useCallback(async <T>(
    operationId: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    if (!enabled) return operation();

    startTiming(operationId, metadata);
    
    try {
      const result = await operation();
      endTiming(operationId, { ...metadata, success: true });
      return result;
    } catch (error) {
      endTiming(operationId, { 
        ...metadata, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, [enabled, startTiming, endTiming]);

  /**
   * Measure synchronous operation
   */
  const measureSync = useCallback(<T>(
    operationId: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T => {
    if (!enabled) return operation();

    startTiming(operationId, metadata);
    
    try {
      const result = operation();
      endTiming(operationId, { ...metadata, success: true });
      return result;
    } catch (error) {
      endTiming(operationId, { 
        ...metadata, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, [enabled, startTiming, endTiming]);

  return {
    startTiming,
    endTiming,
    logNavigation,
    logAIStreaming,
    logUserInteraction,
    measureAsync,
    measureSync,
    isEnabled: enabled,
    componentName,
    renderCount: renderCountRef.current
  };
};

/**
 * Hook for measuring navigation performance
 */
export const useNavigationPerformance = () => {
  const router = useRouter();
  const navigationStartRef = useRef<number>(0);

  /**
   * Start measuring navigation
   */
  const startNavigation = useCallback((fromStep: string, toStep: string) => {
    navigationStartRef.current = performance.now();
    navigationTiming.startTiming(`navigation-${fromStep}-to-${toStep}`, {
      fromStep,
      toStep,
      navigationStart: navigationStartRef.current
    });
  }, []);

  /**
   * End measuring navigation
   */
  const endNavigation = useCallback((fromStep: string, toStep: string, metadata?: Record<string, any>) => {
    const navigationTime = navigationTiming.endTiming(`navigation-${fromStep}-to-${toStep}`, {
      fromStep,
      toStep,
      ...metadata
    });

    if (navigationTime) {
      navigationTiming.logNavigation(fromStep, toStep, {
        navigationTime: navigationTime.totalTime,
        ...metadata
      });
    }

    return navigationTime;
  }, []);

  /**
   * Measure complete navigation with automatic timing
   */
  const measureNavigation = useCallback(async (
    fromStep: string,
    toStep: string,
    navigationFn: () => Promise<void> | void,
    metadata?: Record<string, any>
  ) => {
    startNavigation(fromStep, toStep);
    
    try {
      await navigationFn();
      return endNavigation(fromStep, toStep, { ...metadata, success: true });
    } catch (error) {
      endNavigation(fromStep, toStep, { 
        ...metadata, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, [startNavigation, endNavigation]);

  return {
    startNavigation,
    endNavigation,
    measureNavigation
  };
};

/**
 * Hook for AI streaming performance measurement
 */
export const useAIStreamingPerformance = (step: string) => {
  const streamingStartRef = useRef<number>(0);
  const itemCountRef = useRef<number>(0);

  /**
   * Start measuring AI streaming
   */
  const startStreaming = useCallback((metadata?: Record<string, any>) => {
    streamingStartRef.current = performance.now();
    itemCountRef.current = 0;
    
    navigationTiming.logAIStreaming(step, 'start', {
      streamingStart: streamingStartRef.current,
      ...metadata
    });
  }, [step]);

  /**
   * Log streaming progress
   */
  const logProgress = useCallback((itemsReceived: number, metadata?: Record<string, any>) => {
    itemCountRef.current = itemsReceived;
    
    navigationTiming.logAIStreaming(step, 'progress', {
      itemsReceived,
      streamingDuration: performance.now() - streamingStartRef.current,
      ...metadata
    });
  }, [step]);

  /**
   * End measuring AI streaming
   */
  const endStreaming = useCallback((success: boolean = true, metadata?: Record<string, any>) => {
    const streamingDuration = performance.now() - streamingStartRef.current;
    
    navigationTiming.logAIStreaming(step, success ? 'complete' : 'error', {
      streamingDuration,
      totalItems: itemCountRef.current,
      itemsPerSecond: itemCountRef.current / (streamingDuration / 1000),
      ...metadata
    });

    return {
      duration: streamingDuration,
      itemCount: itemCountRef.current,
      itemsPerSecond: itemCountRef.current / (streamingDuration / 1000)
    };
  }, [step]);

  return {
    startStreaming,
    logProgress,
    endStreaming
  };
};
