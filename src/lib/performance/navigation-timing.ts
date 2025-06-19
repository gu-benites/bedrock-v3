/**
 * Navigation Timing Logger
 * Comprehensive performance tracking for navigation events in create-recipe workflow
 */

interface NavigationEvent {
  eventId: string;
  eventType: 'navigation' | 'component_load' | 'ai_streaming' | 'user_interaction';
  fromStep?: string;
  toStep?: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
  performanceMarks?: PerformanceEntry[];
  userAgent?: string;
  connectionType?: string;
}

interface TimingMetrics {
  navigationTime: number;
  componentLoadTime: number;
  renderTime: number;
  aiStreamingTime: number;
  totalTime: number;
  memoryUsage?: number;
  networkLatency?: number;
}

interface PerformanceThresholds {
  navigation: number;      // Max acceptable navigation time (ms)
  componentLoad: number;   // Max acceptable component load time (ms)
  render: number;          // Max acceptable render time (ms)
  aiStreaming: number;     // Max acceptable AI streaming time (ms)
  memory: number;          // Max acceptable memory usage (MB)
}

class NavigationTimingLogger {
  private events: NavigationEvent[] = [];
  private activeTimings = new Map<string, number>();
  private performanceObserver?: PerformanceObserver;
  private thresholds: PerformanceThresholds;
  private maxEvents = 1000; // Limit stored events to prevent memory leaks

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = {
      navigation: 2000,      // 2 seconds
      componentLoad: 1000,   // 1 second
      render: 500,           // 500ms
      aiStreaming: 30000,    // 30 seconds
      memory: 100,           // 100MB
      ...thresholds
    };

    this.initializePerformanceObserver();
    this.setupNavigationObserver();
  }

  /**
   * Initialize Performance Observer for detailed metrics
   */
  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name.startsWith('create-recipe-')) {
            this.processPerformanceEntry(entry);
          }
        });
      });

      this.performanceObserver.observe({ 
        entryTypes: ['measure', 'mark', 'navigation', 'paint'] 
      });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  /**
   * Setup navigation observer for route changes
   */
  private setupNavigationObserver(): void {
    if (typeof window === 'undefined') return;

    // Listen for route changes (Next.js specific)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      this.handleRouteChange('pushState', args[2] as string);
      return originalPushState.apply(history, args);
    };

    history.replaceState = (...args) => {
      this.handleRouteChange('replaceState', args[2] as string);
      return originalReplaceState.apply(history, args);
    };

    window.addEventListener('popstate', (event) => {
      this.handleRouteChange('popstate', window.location.pathname);
    });
  }

  /**
   * Handle route change events
   */
  private handleRouteChange(type: string, url: string): void {
    const timestamp = performance.now();
    
    // Extract step from URL
    const step = this.extractStepFromUrl(url);
    
    this.logEvent({
      eventId: `route-change-${Date.now()}`,
      eventType: 'navigation',
      toStep: step,
      timestamp,
      metadata: {
        navigationType: type,
        url,
        userAgent: navigator.userAgent,
        connectionType: this.getConnectionType()
      }
    });
  }

  /**
   * Extract step from URL path
   */
  private extractStepFromUrl(url: string): string {
    const path = url.replace(/^\//, '');
    
    if (path === 'create-recipe') return 'health-concern';
    if (path.includes('demographics')) return 'demographics';
    if (path.includes('causes')) return 'causes';
    if (path.includes('symptoms')) return 'symptoms';
    if (path.includes('properties')) return 'properties';
    
    return 'unknown';
  }

  /**
   * Get connection type information
   */
  private getConnectionType(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || connection.type || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Process performance entries from PerformanceObserver
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    const eventId = `perf-${entry.name}-${Date.now()}`;
    
    this.logEvent({
      eventId,
      eventType: 'component_load',
      timestamp: entry.startTime,
      duration: entry.duration,
      metadata: {
        entryType: entry.entryType,
        name: entry.name,
        detail: (entry as any).detail
      }
    });
  }

  /**
   * Start timing for a specific operation
   */
  startTiming(operationId: string, metadata?: Record<string, any>): void {
    const timestamp = performance.now();
    this.activeTimings.set(operationId, timestamp);
    
    // Create performance mark
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`create-recipe-${operationId}-start`);
    }

    this.logEvent({
      eventId: `${operationId}-start`,
      eventType: 'user_interaction',
      timestamp,
      metadata: {
        operation: operationId,
        phase: 'start',
        ...metadata
      }
    });
  }

  /**
   * End timing for a specific operation
   */
  endTiming(operationId: string, metadata?: Record<string, any>): TimingMetrics | null {
    const endTime = performance.now();
    const startTime = this.activeTimings.get(operationId);
    
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationId}`);
      return null;
    }

    const duration = endTime - startTime;
    this.activeTimings.delete(operationId);

    // Create performance measure
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(
          `create-recipe-${operationId}`,
          `create-recipe-${operationId}-start`
        );
      } catch (error) {
        console.warn('Failed to create performance measure:', error);
      }
    }

    const metrics: TimingMetrics = {
      navigationTime: duration,
      componentLoadTime: 0,
      renderTime: 0,
      aiStreamingTime: 0,
      totalTime: duration,
      memoryUsage: this.getMemoryUsage(),
      networkLatency: this.getNetworkLatency()
    };

    this.logEvent({
      eventId: `${operationId}-end`,
      eventType: 'user_interaction',
      timestamp: endTime,
      duration,
      metadata: {
        operation: operationId,
        phase: 'end',
        metrics,
        ...metadata
      }
    });

    // Check thresholds and log warnings
    this.checkPerformanceThresholds(operationId, metrics);

    return metrics;
  }

  /**
   * Log navigation between steps
   */
  logNavigation(fromStep: string, toStep: string, metadata?: Record<string, any>): void {
    const timestamp = performance.now();
    
    this.logEvent({
      eventId: `nav-${fromStep}-to-${toStep}-${Date.now()}`,
      eventType: 'navigation',
      fromStep,
      toStep,
      timestamp,
      metadata: {
        userAgent: navigator.userAgent,
        connectionType: this.getConnectionType(),
        memoryUsage: this.getMemoryUsage(),
        ...metadata
      }
    });
  }

  /**
   * Log AI streaming events
   */
  logAIStreaming(step: string, phase: 'start' | 'progress' | 'complete' | 'error', metadata?: Record<string, any>): void {
    const timestamp = performance.now();
    
    this.logEvent({
      eventId: `ai-${step}-${phase}-${Date.now()}`,
      eventType: 'ai_streaming',
      toStep: step,
      timestamp,
      metadata: {
        phase,
        step,
        ...metadata
      }
    });
  }

  /**
   * Log component load events
   */
  logComponentLoad(componentName: string, loadTime: number, metadata?: Record<string, any>): void {
    const timestamp = performance.now();
    
    this.logEvent({
      eventId: `component-${componentName}-${Date.now()}`,
      eventType: 'component_load',
      timestamp,
      duration: loadTime,
      metadata: {
        componentName,
        loadTime,
        ...metadata
      }
    });
  }

  /**
   * Get memory usage information
   */
  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // Convert to MB
    }
    return undefined;
  }

  /**
   * Get network latency estimate
   */
  private getNetworkLatency(): number | undefined {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.rtt; // Round-trip time in ms
    }
    return undefined;
  }

  /**
   * Check performance thresholds and log warnings
   */
  private checkPerformanceThresholds(operationId: string, metrics: TimingMetrics): void {
    const warnings: string[] = [];

    if (metrics.navigationTime > this.thresholds.navigation) {
      warnings.push(`Navigation time exceeded threshold: ${metrics.navigationTime}ms > ${this.thresholds.navigation}ms`);
    }

    if (metrics.componentLoadTime > this.thresholds.componentLoad) {
      warnings.push(`Component load time exceeded threshold: ${metrics.componentLoadTime}ms > ${this.thresholds.componentLoad}ms`);
    }

    if (metrics.renderTime > this.thresholds.render) {
      warnings.push(`Render time exceeded threshold: ${metrics.renderTime}ms > ${this.thresholds.render}ms`);
    }

    if (metrics.memoryUsage && metrics.memoryUsage > this.thresholds.memory) {
      warnings.push(`Memory usage exceeded threshold: ${metrics.memoryUsage}MB > ${this.thresholds.memory}MB`);
    }

    if (warnings.length > 0) {
      console.warn(`⚠️ Performance thresholds exceeded for ${operationId}:`, warnings);
    }
  }

  /**
   * Log a navigation event
   */
  private logEvent(event: NavigationEvent): void {
    // Add performance marks if available
    if ('performance' in window && 'getEntriesByType' in performance) {
      event.performanceMarks = performance.getEntriesByType('mark')
        .filter(mark => mark.name.includes('create-recipe'))
        .slice(-5); // Last 5 marks
    }

    this.events.push(event);

    // Limit stored events to prevent memory leaks
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(event);
    }
  }

  /**
   * Log event to console with formatting
   */
  private logToConsole(event: NavigationEvent): void {
    const timestamp = new Date(Date.now() - performance.now() + event.timestamp).toISOString();
    const duration = event.duration ? ` (${event.duration.toFixed(2)}ms)` : '';
    
    let emoji = '📊';
    switch (event.eventType) {
      case 'navigation': emoji = '🧭'; break;
      case 'component_load': emoji = '🧩'; break;
      case 'ai_streaming': emoji = '🤖'; break;
      case 'user_interaction': emoji = '👆'; break;
    }

    console.log(
      `${emoji} [${timestamp}] ${event.eventType.toUpperCase()}: ${event.eventId}${duration}`,
      event.metadata
    );
  }

  /**
   * Get all logged events
   */
  getEvents(filter?: Partial<NavigationEvent>): NavigationEvent[] {
    if (!filter) return [...this.events];

    return this.events.filter(event => {
      return Object.entries(filter).every(([key, value]) => {
        return event[key as keyof NavigationEvent] === value;
      });
    });
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalEvents: number;
    averageNavigationTime: number;
    averageComponentLoadTime: number;
    memoryUsage: number | undefined;
    thresholdViolations: number;
  } {
    const navigationEvents = this.events.filter(e => e.eventType === 'navigation' && e.duration);
    const componentEvents = this.events.filter(e => e.eventType === 'component_load' && e.duration);
    
    const avgNavTime = navigationEvents.length > 0
      ? navigationEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / navigationEvents.length
      : 0;

    const avgComponentTime = componentEvents.length > 0
      ? componentEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / componentEvents.length
      : 0;

    const thresholdViolations = this.events.filter(e => {
      if (!e.duration) return false;
      
      switch (e.eventType) {
        case 'navigation': return e.duration > this.thresholds.navigation;
        case 'component_load': return e.duration > this.thresholds.componentLoad;
        default: return false;
      }
    }).length;

    return {
      totalEvents: this.events.length,
      averageNavigationTime: avgNavTime,
      averageComponentLoadTime: avgComponentTime,
      memoryUsage: this.getMemoryUsage(),
      thresholdViolations
    };
  }

  /**
   * Clear all logged events
   */
  clearEvents(): void {
    this.events = [];
    this.activeTimings.clear();
    console.log('🧹 Navigation timing events cleared');
  }

  /**
   * Export events as JSON
   */
  exportEvents(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      events: this.events,
      summary: this.getPerformanceSummary()
    }, null, 2);
  }
}

// Global navigation timing logger instance
export const navigationTiming = new NavigationTimingLogger({
  navigation: 2000,      // 2 seconds
  componentLoad: 1000,   // 1 second
  render: 500,           // 500ms
  aiStreaming: 30000,    // 30 seconds
  memory: 100            // 100MB
});

export { NavigationTimingLogger };
export type { NavigationEvent, TimingMetrics, PerformanceThresholds };
