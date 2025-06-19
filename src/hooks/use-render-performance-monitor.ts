/**
 * React Performance Monitoring Hook
 * Tracks component re-renders and identifies performance hotspots
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface RenderInfo {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
  props?: any;
  reasons?: string[];
}

interface PerformanceMetrics {
  totalRenders: number;
  componentsTracked: number;
  hotspots: RenderInfo[];
  averageRenderTime: number;
}

// Global render tracking store
const renderTracker = new Map<string, RenderInfo>();
let isMonitoringEnabled = process.env.NODE_ENV === 'development';

/**
 * Hook to monitor component render performance
 */
export const useRenderPerformanceMonitor = (
  componentName: string,
  props?: any,
  options: {
    enabled?: boolean;
    logThreshold?: number; // Log if render count exceeds this
    trackProps?: boolean;
  } = {}
) => {
  const {
    enabled = isMonitoringEnabled,
    logThreshold = 10,
    trackProps = false
  } = options;

  const renderCountRef = useRef(0);
  const lastPropsRef = useRef(props);
  const renderStartTimeRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    renderStartTimeRef.current = performance.now();
    renderCountRef.current += 1;

    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTimeRef.current;

    // Update global tracking
    const existing = renderTracker.get(componentName);
    const newInfo: RenderInfo = {
      componentName,
      renderCount: renderCountRef.current,
      lastRenderTime: renderTime,
      averageRenderTime: existing 
        ? (existing.totalRenderTime + renderTime) / renderCountRef.current
        : renderTime,
      totalRenderTime: (existing?.totalRenderTime || 0) + renderTime,
      props: trackProps ? props : undefined,
      reasons: trackProps ? getChangeReasons(lastPropsRef.current, props) : undefined
    };

    renderTracker.set(componentName, newInfo);

    // Log performance warnings
    if (renderCountRef.current > logThreshold) {
      console.warn(`🔥 Performance Warning: ${componentName} has rendered ${renderCountRef.current} times`, {
        averageRenderTime: newInfo.averageRenderTime.toFixed(2) + 'ms',
        totalRenderTime: newInfo.totalRenderTime.toFixed(2) + 'ms',
        reasons: newInfo.reasons
      });
    }

    // Update last props for comparison
    if (trackProps) {
      lastPropsRef.current = props;
    }
  });

  return {
    renderCount: renderCountRef.current,
    getMetrics: () => renderTracker.get(componentName)
  };
};

/**
 * Hook to get overall performance metrics
 */
export const usePerformanceMetrics = (): PerformanceMetrics => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalRenders: 0,
    componentsTracked: 0,
    hotspots: [],
    averageRenderTime: 0
  });

  const updateMetrics = useCallback(() => {
    const components = Array.from(renderTracker.values());
    const totalRenders = components.reduce((sum, comp) => sum + comp.renderCount, 0);
    const totalTime = components.reduce((sum, comp) => sum + comp.totalRenderTime, 0);
    
    // Identify hotspots (components with high render counts or slow renders)
    const hotspots = components
      .filter(comp => comp.renderCount > 5 || comp.averageRenderTime > 10)
      .sort((a, b) => (b.renderCount * b.averageRenderTime) - (a.renderCount * a.averageRenderTime))
      .slice(0, 10);

    setMetrics({
      totalRenders,
      componentsTracked: components.length,
      hotspots,
      averageRenderTime: totalTime / totalRenders || 0
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(updateMetrics, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, [updateMetrics]);

  return metrics;
};

/**
 * Get reasons why props changed
 */
function getChangeReasons(prevProps: any, nextProps: any): string[] {
  if (!prevProps || !nextProps) return ['Initial render'];

  const reasons: string[] = [];
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  // Check for added/removed props
  const addedKeys = nextKeys.filter(key => !prevKeys.includes(key));
  const removedKeys = prevKeys.filter(key => !nextKeys.includes(key));

  if (addedKeys.length > 0) {
    reasons.push(`Added props: ${addedKeys.join(', ')}`);
  }
  if (removedKeys.length > 0) {
    reasons.push(`Removed props: ${removedKeys.join(', ')}`);
  }

  // Check for changed props
  const changedKeys = nextKeys.filter(key => {
    if (!prevKeys.includes(key)) return false;
    return !Object.is(prevProps[key], nextProps[key]);
  });

  if (changedKeys.length > 0) {
    reasons.push(`Changed props: ${changedKeys.join(', ')}`);
  }

  return reasons.length > 0 ? reasons : ['Props unchanged'];
}

/**
 * Performance monitoring controls
 */
export const performanceMonitor = {
  enable: () => {
    isMonitoringEnabled = true;
    console.log('🔍 Performance monitoring enabled');
  },
  
  disable: () => {
    isMonitoringEnabled = false;
    console.log('🔍 Performance monitoring disabled');
  },
  
  clear: () => {
    renderTracker.clear();
    console.log('🧹 Performance tracking data cleared');
  },
  
  getReport: (): PerformanceMetrics => {
    const components = Array.from(renderTracker.values());
    const totalRenders = components.reduce((sum, comp) => sum + comp.renderCount, 0);
    const totalTime = components.reduce((sum, comp) => sum + comp.totalRenderTime, 0);
    
    const hotspots = components
      .filter(comp => comp.renderCount > 5 || comp.averageRenderTime > 10)
      .sort((a, b) => (b.renderCount * b.averageRenderTime) - (a.renderCount * a.averageRenderTime));

    return {
      totalRenders,
      componentsTracked: components.length,
      hotspots,
      averageRenderTime: totalTime / totalRenders || 0
    };
  },
  
  logReport: () => {
    const report = performanceMonitor.getReport();
    console.group('📊 Performance Monitoring Report');
    console.log(`Total Renders: ${report.totalRenders}`);
    console.log(`Components Tracked: ${report.componentsTracked}`);
    console.log(`Average Render Time: ${report.averageRenderTime.toFixed(2)}ms`);
    
    if (report.hotspots.length > 0) {
      console.group('🔥 Performance Hotspots:');
      report.hotspots.forEach((hotspot, index) => {
        console.log(`${index + 1}. ${hotspot.componentName}:`, {
          renders: hotspot.renderCount,
          avgTime: hotspot.averageRenderTime.toFixed(2) + 'ms',
          totalTime: hotspot.totalRenderTime.toFixed(2) + 'ms',
          reasons: hotspot.reasons
        });
      });
      console.groupEnd();
    }
    console.groupEnd();
  }
};

/**
 * React DevTools Profiler integration
 */
export const withPerformanceProfiler = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const WrappedComponent = (props: P) => {
    useRenderPerformanceMonitor(
      componentName || Component.displayName || Component.name || 'Unknown',
      props,
      { trackProps: true }
    );

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceProfiler(${componentName || Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Make performance monitor available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).performanceMonitor = performanceMonitor;
}
