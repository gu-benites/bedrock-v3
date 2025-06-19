/**
 * Route Prefetching Hook
 * Intelligently prefetches routes for faster navigation
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RecipeStep } from '@/features/create-recipe/types/recipe.types';
import { componentPreloader } from '@/lib/preload/component-preloader';

interface PrefetchOptions {
  enabled?: boolean;
  priority?: 'high' | 'low';
  delay?: number; // Delay before prefetching (ms)
  maxConcurrent?: number; // Max concurrent prefetch requests
  respectStreaming?: boolean; // Avoid prefetching during AI streaming
  networkThreshold?: 'slow-2g' | '2g' | '3g' | '4g'; // Minimum network speed
  cpuThreshold?: number; // Minimum CPU idle time (0-1)
  preloadComponents?: boolean; // Enable component preloading
  preloadAssets?: boolean; // Enable asset preloading
  preloadStyles?: boolean; // Enable stylesheet preloading
}

interface PrefetchState {
  prefetched: Set<string>;
  prefetching: Set<string>;
  failed: Set<string>;
  lastPrefetchTime: number;
}

// Global prefetch state to avoid duplicate requests
const globalPrefetchState: PrefetchState = {
  prefetched: new Set(),
  prefetching: new Set(),
  failed: new Set(),
  lastPrefetchTime: 0
};

// Global streaming state tracking
interface StreamingState {
  isAnyStreaming: boolean;
  activeStreams: Set<string>;
  streamingStartTime: number;
  lastStreamingActivity: number;
}

const globalStreamingState: StreamingState = {
  isAnyStreaming: false,
  activeStreams: new Set(),
  streamingStartTime: 0,
  lastStreamingActivity: 0
};

/**
 * Register streaming activity to coordinate with prefetching
 */
export const registerStreamingActivity = (streamId: string, isActive: boolean) => {
  if (isActive) {
    globalStreamingState.activeStreams.add(streamId);
    globalStreamingState.lastStreamingActivity = Date.now();

    if (!globalStreamingState.isAnyStreaming) {
      globalStreamingState.isAnyStreaming = true;
      globalStreamingState.streamingStartTime = Date.now();
      console.log(`🌊 Streaming activity started: ${streamId}`);
    }
  } else {
    globalStreamingState.activeStreams.delete(streamId);

    if (globalStreamingState.activeStreams.size === 0) {
      globalStreamingState.isAnyStreaming = false;
      console.log(`🌊 All streaming activity stopped`);
    }
  }
};

/**
 * Check if system resources are available for prefetching
 */
const checkResourceAvailability = async (options: PrefetchOptions): Promise<boolean> => {
  const {
    respectStreaming = true,
    networkThreshold = '3g',
    cpuThreshold = 0.5
  } = options;

  // Check if streaming is active and should be respected
  if (respectStreaming && globalStreamingState.isAnyStreaming) {
    const streamingDuration = Date.now() - globalStreamingState.streamingStartTime;

    // Allow prefetching after streaming has been active for a while (likely near completion)
    if (streamingDuration < 10000) { // Less than 10 seconds
      console.log(`⏸️ Deferring prefetch due to active streaming (${streamingDuration}ms)`);
      return false;
    }
  }

  // Check network conditions
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    const networkSpeeds = ['slow-2g', '2g', '3g', '4g'];
    const currentSpeedIndex = networkSpeeds.indexOf(connection.effectiveType);
    const thresholdIndex = networkSpeeds.indexOf(networkThreshold);

    if (currentSpeedIndex < thresholdIndex) {
      console.log(`📶 Network too slow for prefetching: ${connection.effectiveType} < ${networkThreshold}`);
      return false;
    }

    // Check if user has data saver enabled
    if (connection.saveData) {
      console.log(`💾 Data saver enabled, skipping prefetch`);
      return false;
    }
  }

  // Check CPU availability using requestIdleCallback
  if ('requestIdleCallback' in window) {
    return new Promise((resolve) => {
      (window as any).requestIdleCallback((deadline: any) => {
        const timeRemaining = deadline.timeRemaining();
        const isIdle = timeRemaining > 10; // At least 10ms of idle time

        if (!isIdle) {
          console.log(`⚡ CPU too busy for prefetching: ${timeRemaining}ms idle`);
        }

        resolve(isIdle);
      }, { timeout: 1000 });
    });
  }

  return true;
};

// Route mapping for create-recipe workflow
const ROUTE_MAP: Record<RecipeStep, string> = {
  [RecipeStep.HEALTH_CONCERN]: '/create-recipe',
  [RecipeStep.DEMOGRAPHICS]: '/create-recipe/demographics',
  [RecipeStep.CAUSES]: '/create-recipe/causes',
  [RecipeStep.SYMPTOMS]: '/create-recipe/symptoms',
  [RecipeStep.PROPERTIES]: '/create-recipe/properties'
};

// Component path mapping for preloading
const COMPONENT_MAP: Record<RecipeStep, string> = {
  [RecipeStep.HEALTH_CONCERN]: '@/features/create-recipe/components/health-concern-form',
  [RecipeStep.DEMOGRAPHICS]: '@/features/create-recipe/components/demographics-form',
  [RecipeStep.CAUSES]: '@/features/create-recipe/components/causes-selection',
  [RecipeStep.SYMPTOMS]: '@/features/create-recipe/components/symptoms-selection',
  [RecipeStep.PROPERTIES]: '@/features/create-recipe/components/properties-display'
};

// Step progression mapping
const NEXT_STEP_MAP: Record<RecipeStep, RecipeStep | null> = {
  [RecipeStep.HEALTH_CONCERN]: RecipeStep.DEMOGRAPHICS,
  [RecipeStep.DEMOGRAPHICS]: RecipeStep.CAUSES,
  [RecipeStep.CAUSES]: RecipeStep.SYMPTOMS,
  [RecipeStep.SYMPTOMS]: RecipeStep.PROPERTIES,
  [RecipeStep.PROPERTIES]: null // Final step
};

/**
 * Hook for intelligent route prefetching
 */
export const useRoutePrefetcher = (options: PrefetchOptions = {}) => {
  const {
    enabled = true,
    priority = 'low',
    delay = 1000,
    maxConcurrent = 2,
    respectStreaming = true,
    networkThreshold = '3g',
    cpuThreshold = 0.5,
    preloadComponents = true,
    preloadAssets = true,
    preloadStyles = true
  } = options;

  const router = useRouter();
  const prefetchTimeoutRef = useRef<NodeJS.Timeout>();
  const [isSupported, setIsSupported] = useState(false);

  // Check if prefetching is supported
  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' && 
      'requestIdleCallback' in window &&
      navigator.connection?.effectiveType !== 'slow-2g'
    );
  }, []);

  /**
   * Prefetch a route with component preloading
   */
  const prefetchRoute = useCallback(async (
    route: string,
    options: { immediate?: boolean; priority?: 'high' | 'low' } = {}
  ) => {
    if (!enabled || !isSupported) return false;

    const { immediate = false, priority: routePriority = priority } = options;

    // Skip if already prefetched, prefetching, or failed recently
    if (globalPrefetchState.prefetched.has(route) ||
        globalPrefetchState.prefetching.has(route) ||
        globalPrefetchState.failed.has(route)) {
      return false;
    }

    // Respect concurrent limits
    if (globalPrefetchState.prefetching.size >= maxConcurrent) {
      console.log(`🚦 Prefetch queue full, skipping: ${route}`);
      return false;
    }

    // Rate limiting - don't prefetch too frequently
    const now = Date.now();
    if (now - globalPrefetchState.lastPrefetchTime < 500) {
      console.log(`⏱️ Rate limiting prefetch: ${route}`);
      return false;
    }

    const executePrefetch = async () => {
      try {
        // Check resource availability before starting
        const resourcesAvailable = await checkResourceAvailability({
          respectStreaming,
          networkThreshold,
          cpuThreshold
        });

        if (!resourcesAvailable) {
          console.log(`⏸️ Resources not available for prefetching: ${route}`);
          return false;
        }

        globalPrefetchState.prefetching.add(route);
        globalPrefetchState.lastPrefetchTime = now;

        console.log(`🔄 Prefetching route: ${route} (priority: ${routePriority})`);

        // Use Next.js router prefetch for route
        router.prefetch(route);

        // Preload components for create-recipe workflow
        if (preloadComponents) {
          const step = Object.entries(ROUTE_MAP).find(([, r]) => r === route)?.[0] as RecipeStep;
          if (step && COMPONENT_MAP[step]) {
            try {
              const result = await componentPreloader.preloadComponent(COMPONENT_MAP[step], {
                priority: routePriority,
                preloadComponents: true,
                preloadAssets,
                preloadStyles
              });

              // Check if we got a fallback component
              if (result && result.__fallback) {
                console.warn(`⚠️ Using fallback for component: ${route}`);
              } else if (result && result.__errorBoundary) {
                console.error(`🚨 Component preload failed completely: ${route}`);
              } else {
                console.log(`🧩 Component preloaded successfully for route: ${route}`);
              }
            } catch (error) {
              console.warn(`⚠️ Component preload failed for ${route}:`, error);
              // Don't fail the entire prefetch operation due to component preload failure
            }
          }
        }

        // Preload additional assets if enabled
        if (preloadAssets || preloadStyles) {
          const preloadResources = [];

          if (preloadStyles) {
            // Add any route-specific stylesheets
            preloadResources.push({
              type: 'style' as const,
              path: `/styles/pages${route}.css`
            });
          }

          if (preloadAssets) {
            // Add any route-specific assets (icons, images)
            // This would be customized based on actual assets used
          }

          if (preloadResources.length > 0) {
            try {
              await componentPreloader.preloadBatch(preloadResources);
              console.log(`📦 Assets preloaded for route: ${route}`);
            } catch (error) {
              console.warn(`⚠️ Asset preload failed for ${route}:`, error);
            }
          }
        }

        globalPrefetchState.prefetched.add(route);
        globalPrefetchState.prefetching.delete(route);

        console.log(`✅ Successfully prefetched: ${route}`);
        return true;

      } catch (error) {
        console.error(`❌ Failed to prefetch ${route}:`, error);
        globalPrefetchState.failed.add(route);
        globalPrefetchState.prefetching.delete(route);

        // Remove from failed set after 30 seconds to allow retry
        setTimeout(() => {
          globalPrefetchState.failed.delete(route);
        }, 30000);

        return false;
      }
    };

    if (immediate || routePriority === 'high') {
      return executePrefetch();
    } else {
      // Use requestIdleCallback for low priority prefetching
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(executePrefetch, { timeout: 5000 });
      } else {
        setTimeout(executePrefetch, delay);
      }
      return true;
    }
  }, [enabled, isSupported, priority, delay, maxConcurrent, router]);

  /**
   * Prefetch next step in workflow
   */
  const prefetchNextStep = useCallback((currentStep: RecipeStep, immediate = false) => {
    const nextStep = NEXT_STEP_MAP[currentStep];
    if (!nextStep) return false;

    const nextRoute = ROUTE_MAP[nextStep];
    if (!nextRoute) return false;

    return prefetchRoute(nextRoute, { 
      immediate, 
      priority: immediate ? 'high' : 'low' 
    });
  }, [prefetchRoute]);

  /**
   * Prefetch multiple steps ahead
   */
  const prefetchAhead = useCallback((currentStep: RecipeStep, stepsAhead = 2) => {
    let step = currentStep;
    const prefetchPromises: Promise<boolean>[] = [];

    for (let i = 0; i < stepsAhead; i++) {
      const nextStep = NEXT_STEP_MAP[step];
      if (!nextStep) break;

      const route = ROUTE_MAP[nextStep];
      if (route) {
        prefetchPromises.push(
          prefetchRoute(route, { 
            priority: i === 0 ? 'high' : 'low' 
          })
        );
      }

      step = nextStep;
    }

    return Promise.all(prefetchPromises);
  }, [prefetchRoute]);

  /**
   * Clear prefetch timeout
   */
  const clearPrefetchTimeout = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = undefined;
    }
  }, []);

  /**
   * Schedule prefetch with delay
   */
  const schedulePrefetch = useCallback((
    route: string, 
    delayMs = delay,
    options: { priority?: 'high' | 'low' } = {}
  ) => {
    clearPrefetchTimeout();
    
    prefetchTimeoutRef.current = setTimeout(() => {
      prefetchRoute(route, options);
    }, delayMs);
  }, [delay, prefetchRoute, clearPrefetchTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPrefetchTimeout();
    };
  }, [clearPrefetchTimeout]);

  return {
    prefetchRoute,
    prefetchNextStep,
    prefetchAhead,
    schedulePrefetch,
    clearPrefetchTimeout,
    isSupported,
    getPrefetchState: () => ({
      prefetched: Array.from(globalPrefetchState.prefetched),
      prefetching: Array.from(globalPrefetchState.prefetching),
      failed: Array.from(globalPrefetchState.failed)
    })
  };
};

/**
 * Hook for AI streaming-aware prefetching with intelligent timing
 */
export const useStreamingPrefetcher = (
  currentStep: RecipeStep,
  isStreaming: boolean,
  options: PrefetchOptions = {}
) => {
  const streamId = `${currentStep}-streaming`;
  const { prefetchNextStep, prefetchAhead } = useRoutePrefetcher({
    ...options,
    respectStreaming: true, // Always respect streaming for this hook
    priority: 'low' // Lower priority during streaming
  });

  const hasTriggeredRef = useRef(false);
  const streamingStartTimeRef = useRef<number>(0);

  // Register streaming activity
  useEffect(() => {
    registerStreamingActivity(streamId, isStreaming);

    if (isStreaming) {
      streamingStartTimeRef.current = Date.now();
    }
  }, [isStreaming, streamId]);

  // Intelligent prefetching during streaming lifecycle
  useEffect(() => {
    if (isStreaming && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;

      console.log(`🎯 AI streaming started for ${currentStep}, scheduling intelligent prefetch...`);

      // Phase 1: Wait for streaming to establish (2 seconds)
      setTimeout(() => {
        if (isStreaming) {
          console.log(`📡 Phase 1: Streaming established, prefetching next step with low priority`);
          prefetchNextStep(currentStep, false); // Low priority, non-immediate
        }
      }, 2000);

      // Phase 2: Mid-streaming prefetch (8 seconds)
      setTimeout(() => {
        if (isStreaming) {
          console.log(`📡 Phase 2: Mid-streaming, prefetching additional steps`);
          prefetchAhead(currentStep, 2);
        }
      }, 8000);

      // Phase 3: Near completion prefetch (15 seconds)
      setTimeout(() => {
        if (isStreaming) {
          console.log(`📡 Phase 3: Near completion, high-priority prefetch`);
          prefetchNextStep(currentStep, true); // High priority for immediate navigation
        }
      }, 15000);
    }
  }, [isStreaming, currentStep, prefetchNextStep, prefetchAhead]);

  // Post-streaming prefetch optimization
  useEffect(() => {
    if (!isStreaming && hasTriggeredRef.current) {
      hasTriggeredRef.current = false;

      const streamingDuration = Date.now() - streamingStartTimeRef.current;
      console.log(`🏁 Streaming completed for ${currentStep} (${streamingDuration}ms), optimizing prefetch`);

      // Immediate high-priority prefetch after streaming completes
      setTimeout(() => {
        prefetchNextStep(currentStep, true);

        // Prefetch additional steps with higher priority now that streaming is done
        setTimeout(() => {
          prefetchAhead(currentStep, 3);
        }, 500);
      }, 100);
    }
  }, [isStreaming, currentStep, prefetchNextStep, prefetchAhead]);

  return {
    prefetchNextStep,
    prefetchAhead,
    getStreamingState: () => ({
      isStreaming,
      streamingDuration: isStreaming ? Date.now() - streamingStartTimeRef.current : 0,
      hasTriggered: hasTriggeredRef.current
    })
  };
};

// User behavior tracking for intelligent prefetching
interface UserBehavior {
  stepTimes: Record<RecipeStep, number[]>; // Time spent on each step
  navigationPatterns: Array<{ from: RecipeStep; to: RecipeStep; timestamp: number }>;
  backNavigationCount: number;
  totalSessions: number;
  averageSessionTime: number;
  preferredPaths: Record<string, number>; // Path frequency tracking
}

// Global user behavior state
const userBehavior: UserBehavior = {
  stepTimes: {
    [RecipeStep.HEALTH_CONCERN]: [],
    [RecipeStep.DEMOGRAPHICS]: [],
    [RecipeStep.CAUSES]: [],
    [RecipeStep.SYMPTOMS]: [],
    [RecipeStep.PROPERTIES]: []
  },
  navigationPatterns: [],
  backNavigationCount: 0,
  totalSessions: 0,
  averageSessionTime: 0,
  preferredPaths: {}
};

/**
 * Hook for intelligent prefetching based on user behavior
 */
export const useIntelligentPrefetcher = (
  currentStep: RecipeStep,
  options: PrefetchOptions = {}
) => {
  const { prefetchRoute, prefetchNextStep, prefetchAhead } = useRoutePrefetcher(options);
  const stepStartTimeRef = useRef<number>(Date.now());
  const lastStepRef = useRef<RecipeStep | null>(null);

  // Track step timing
  useEffect(() => {
    stepStartTimeRef.current = Date.now();

    // Record navigation pattern
    if (lastStepRef.current && lastStepRef.current !== currentStep) {
      const pattern = {
        from: lastStepRef.current,
        to: currentStep,
        timestamp: Date.now()
      };

      userBehavior.navigationPatterns.push(pattern);

      // Track back navigation
      const stepOrder = Object.values(RecipeStep);
      const fromIndex = stepOrder.indexOf(lastStepRef.current);
      const toIndex = stepOrder.indexOf(currentStep);

      if (toIndex < fromIndex) {
        userBehavior.backNavigationCount++;
      }

      // Track preferred paths
      const pathKey = `${lastStepRef.current}->${currentStep}`;
      userBehavior.preferredPaths[pathKey] = (userBehavior.preferredPaths[pathKey] || 0) + 1;
    }

    lastStepRef.current = currentStep;

    return () => {
      // Record time spent on step when leaving
      const timeSpent = Date.now() - stepStartTimeRef.current;
      userBehavior.stepTimes[currentStep].push(timeSpent);

      // Keep only last 10 entries per step
      if (userBehavior.stepTimes[currentStep].length > 10) {
        userBehavior.stepTimes[currentStep] = userBehavior.stepTimes[currentStep].slice(-10);
      }
    };
  }, [currentStep]);

  /**
   * Get intelligent prefetch recommendations based on user behavior
   */
  const getIntelligentRecommendations = useCallback(() => {
    const recommendations: Array<{ route: string; priority: 'high' | 'low'; reason: string }> = [];

    // 1. Predict next step based on navigation patterns
    const fromCurrentPatterns = userBehavior.navigationPatterns
      .filter(p => p.from === currentStep)
      .reduce((acc, pattern) => {
        acc[pattern.to] = (acc[pattern.to] || 0) + 1;
        return acc;
      }, {} as Record<RecipeStep, number>);

    const mostLikelyNext = Object.entries(fromCurrentPatterns)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostLikelyNext) {
      const [nextStep, frequency] = mostLikelyNext;
      const route = ROUTE_MAP[nextStep as RecipeStep];
      if (route) {
        recommendations.push({
          route,
          priority: frequency > 2 ? 'high' : 'low',
          reason: `User frequently navigates to ${nextStep} from ${currentStep} (${frequency} times)`
        });
      }
    }

    // 2. Prefetch based on time spent on current step
    const currentStepTimes = userBehavior.stepTimes[currentStep];
    if (currentStepTimes.length > 0) {
      const avgTime = currentStepTimes.reduce((a, b) => a + b, 0) / currentStepTimes.length;
      const currentTime = Date.now() - stepStartTimeRef.current;

      // If user is spending more time than usual, prefetch next step
      if (currentTime > avgTime * 0.8) {
        const nextStep = NEXT_STEP_MAP[currentStep];
        if (nextStep) {
          const route = ROUTE_MAP[nextStep];
          if (route) {
            recommendations.push({
              route,
              priority: 'high',
              reason: `User spending longer than average on ${currentStep}, likely to proceed soon`
            });
          }
        }
      }
    }

    // 3. Prefetch commonly accessed steps
    const stepFrequency = Object.values(RecipeStep).map(step => ({
      step,
      frequency: userBehavior.stepTimes[step].length
    })).sort((a, b) => b.frequency - a.frequency);

    stepFrequency.slice(0, 2).forEach(({ step }) => {
      if (step !== currentStep) {
        const route = ROUTE_MAP[step];
        if (route) {
          recommendations.push({
            route,
            priority: 'low',
            reason: `${step} is frequently accessed by user`
          });
        }
      }
    });

    // 4. Prefetch based on back navigation patterns
    if (userBehavior.backNavigationCount > 2) {
      // User tends to go back, prefetch previous steps
      const stepOrder = Object.values(RecipeStep);
      const currentIndex = stepOrder.indexOf(currentStep);

      if (currentIndex > 0) {
        const prevStep = stepOrder[currentIndex - 1];
        const route = ROUTE_MAP[prevStep];
        if (route) {
          recommendations.push({
            route,
            priority: 'low',
            reason: `User has history of back navigation (${userBehavior.backNavigationCount} times)`
          });
        }
      }
    }

    return recommendations;
  }, [currentStep]);

  /**
   * Execute intelligent prefetching
   */
  const executeIntelligentPrefetch = useCallback(async () => {
    const recommendations = getIntelligentRecommendations();

    console.log(`🧠 Intelligent prefetch recommendations for ${currentStep}:`, recommendations);

    const prefetchPromises = recommendations.map(({ route, priority, reason }) => {
      console.log(`🎯 Prefetching ${route}: ${reason}`);
      return prefetchRoute(route, { priority });
    });

    return Promise.all(prefetchPromises);
  }, [currentStep, getIntelligentRecommendations, prefetchRoute]);

  // Execute intelligent prefetching when step changes
  useEffect(() => {
    const timer = setTimeout(() => {
      executeIntelligentPrefetch();
    }, 2000); // Wait 2 seconds after step change

    return () => clearTimeout(timer);
  }, [executeIntelligentPrefetch]);

  return {
    getIntelligentRecommendations,
    executeIntelligentPrefetch,
    getUserBehaviorStats: () => ({
      totalNavigations: userBehavior.navigationPatterns.length,
      backNavigationRate: userBehavior.backNavigationCount / Math.max(userBehavior.navigationPatterns.length, 1),
      averageStepTimes: Object.entries(userBehavior.stepTimes).reduce((acc, [step, times]) => {
        acc[step] = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
        return acc;
      }, {} as Record<string, number>),
      preferredPaths: userBehavior.preferredPaths
    })
  };
};

/**
 * Performance monitoring for prefetching with component preloading
 */
export const usePrefetchMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalPrefetched: 0,
    totalFailed: 0,
    currentlyPrefetching: 0,
    successRate: 0,
    isStreamingActive: false,
    activeStreams: 0,
    streamingDuration: 0,
    componentsPreloaded: 0,
    assetsPreloaded: 0,
    stylesPreloaded: 0,
    preloadFailures: 0,
    averagePreloadTime: 0
  });

  useEffect(() => {
    const updateMetrics = () => {
      const total = globalPrefetchState.prefetched.size + globalPrefetchState.failed.size;
      const streamingDuration = globalStreamingState.isAnyStreaming
        ? Date.now() - globalStreamingState.streamingStartTime
        : 0;

      const preloadMetrics = componentPreloader.getMetrics();

      setMetrics({
        totalPrefetched: globalPrefetchState.prefetched.size,
        totalFailed: globalPrefetchState.failed.size,
        currentlyPrefetching: globalPrefetchState.prefetching.size,
        successRate: total > 0 ? (globalPrefetchState.prefetched.size / total) * 100 : 0,
        isStreamingActive: globalStreamingState.isAnyStreaming,
        activeStreams: globalStreamingState.activeStreams.size,
        streamingDuration,
        componentsPreloaded: preloadMetrics.componentsPreloaded,
        assetsPreloaded: preloadMetrics.assetsPreloaded,
        stylesPreloaded: preloadMetrics.stylesPreloaded,
        preloadFailures: preloadMetrics.failures,
        averagePreloadTime: preloadMetrics.averagePreloadTime
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  return metrics;
};
