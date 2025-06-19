/**
 * Core Web Vitals Monitoring
 * Production monitoring for Core Web Vitals metrics (LCP, FID, CLS, FCP, TTFB)
 */

interface WebVitalMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender';
  entries: PerformanceEntry[];
}

interface WebVitalData {
  metric: WebVitalMetric;
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
  sessionId: string;
  userId?: string;
  route: string;
  feature: string;
}

interface WebVitalThresholds {
  good: number;
  needsImprovement: number;
}

interface WebVitalConfig {
  enabled: boolean;
  reportingEndpoint?: string;
  sampleRate: number; // 0-1, percentage of sessions to monitor
  bufferSize: number; // Number of metrics to buffer before sending
  sendInterval: number; // Interval in ms to send buffered metrics
  thresholds: Record<string, WebVitalThresholds>;
}

class CoreWebVitalsMonitor {
  private config: WebVitalConfig;
  private buffer: WebVitalData[] = [];
  private sessionId: string;
  private sendTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: Partial<WebVitalConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      reportingEndpoint: '/api/analytics/web-vitals',
      sampleRate: 0.1, // Monitor 10% of sessions by default
      bufferSize: 10,
      sendInterval: 30000, // Send every 30 seconds
      thresholds: {
        CLS: { good: 0.1, needsImprovement: 0.25 },
        FID: { good: 100, needsImprovement: 300 },
        FCP: { good: 1800, needsImprovement: 3000 },
        LCP: { good: 2500, needsImprovement: 4000 },
        TTFB: { good: 800, needsImprovement: 1800 },
        INP: { good: 200, needsImprovement: 500 }
      },
      ...config
    };

    this.sessionId = this.generateSessionId();
    
    if (this.config.enabled && this.shouldSample()) {
      this.initialize();
    }
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      // Dynamic import of web-vitals library
      const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

      // Set up metric handlers
      onCLS(this.handleMetric.bind(this));
      onFID(this.handleMetric.bind(this));
      onFCP(this.handleMetric.bind(this));
      onLCP(this.handleMetric.bind(this));
      onTTFB(this.handleMetric.bind(this));
      onINP(this.handleMetric.bind(this));

      // Set up periodic sending
      this.setupPeriodicSending();

      // Set up page visibility change handler
      this.setupVisibilityChangeHandler();

      // Set up beforeunload handler
      this.setupBeforeUnloadHandler();

      this.isInitialized = true;
      console.log('📊 Core Web Vitals monitoring initialized');

    } catch (error) {
      console.error('Failed to initialize Core Web Vitals monitoring:', error);
    }
  }

  /**
   * Handle a web vital metric
   */
  private handleMetric(metric: WebVitalMetric): void {
    const webVitalData: WebVitalData = {
      metric,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceMemory: this.getDeviceMemory(),
      sessionId: this.sessionId,
      userId: this.getUserId(),
      route: this.getCurrentRoute(),
      feature: this.getCurrentFeature()
    };

    // Add to buffer
    this.buffer.push(webVitalData);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`, webVitalData);
    }

    // Send immediately if buffer is full
    if (this.buffer.length >= this.config.bufferSize) {
      this.sendMetrics();
    }

    // Check for poor performance and log warnings
    this.checkPerformanceWarnings(webVitalData);
  }

  /**
   * Check for performance warnings
   */
  private checkPerformanceWarnings(data: WebVitalData): void {
    const { metric } = data;
    
    if (metric.rating === 'poor') {
      console.warn(`⚠️ Poor ${metric.name} detected: ${metric.value.toFixed(2)}`, {
        threshold: this.config.thresholds[metric.name]?.needsImprovement,
        url: data.url,
        route: data.route
      });

      // Send critical metrics immediately
      this.sendCriticalMetric(data);
    }
  }

  /**
   * Send critical metric immediately
   */
  private async sendCriticalMetric(data: WebVitalData): Promise<void> {
    if (!this.config.reportingEndpoint) return;

    try {
      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'critical-web-vital',
          data: [data]
        })
      });
    } catch (error) {
      console.error('Failed to send critical web vital:', error);
    }
  }

  /**
   * Send buffered metrics
   */
  private async sendMetrics(): Promise<void> {
    if (this.buffer.length === 0 || !this.config.reportingEndpoint) return;

    const metricsToSend = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'web-vitals',
          data: metricsToSend
        }),
        keepalive: true // Ensure request completes even if page unloads
      });

      console.log(`📊 Sent ${metricsToSend.length} web vital metrics`);

    } catch (error) {
      console.error('Failed to send web vitals:', error);
      // Re-add to buffer for retry
      this.buffer.unshift(...metricsToSend);
    }
  }

  /**
   * Setup periodic sending of metrics
   */
  private setupPeriodicSending(): void {
    this.sendTimer = setInterval(() => {
      this.sendMetrics();
    }, this.config.sendInterval);
  }

  /**
   * Setup visibility change handler to send metrics when page becomes hidden
   */
  private setupVisibilityChangeHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendMetrics();
      }
    });
  }

  /**
   * Setup beforeunload handler to send metrics before page unloads
   */
  private setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.sendMetrics();
    });
  }

  /**
   * Get connection type
   */
  private getConnectionType(): string | undefined {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || connection.type;
    }
    return undefined;
  }

  /**
   * Get device memory
   */
  private getDeviceMemory(): number | undefined {
    if ('deviceMemory' in navigator) {
      return (navigator as any).deviceMemory;
    }
    return undefined;
  }

  /**
   * Get current route
   */
  private getCurrentRoute(): string {
    const path = window.location.pathname;
    
    // Extract create-recipe step
    if (path.includes('/create-recipe')) {
      if (path.includes('/demographics')) return '/create-recipe/demographics';
      if (path.includes('/causes')) return '/create-recipe/causes';
      if (path.includes('/symptoms')) return '/create-recipe/symptoms';
      if (path.includes('/properties')) return '/create-recipe/properties';
      return '/create-recipe';
    }
    
    return path;
  }

  /**
   * Get current feature
   */
  private getCurrentFeature(): string {
    const path = window.location.pathname;
    
    if (path.includes('/create-recipe')) return 'create-recipe';
    if (path.includes('/chat')) return 'chat';
    if (path.includes('/profile')) return 'profile';
    
    return 'unknown';
  }

  /**
   * Get user ID (implement based on your auth system)
   */
  private getUserId(): string | undefined {
    // Implement based on your authentication system
    // For example, from localStorage, cookies, or auth context
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine if this session should be sampled
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): {
    sessionId: string;
    metricsCollected: number;
    bufferedMetrics: number;
    isMonitoring: boolean;
  } {
    return {
      sessionId: this.sessionId,
      metricsCollected: this.buffer.length,
      bufferedMetrics: this.buffer.length,
      isMonitoring: this.isInitialized
    };
  }

  /**
   * Force send all buffered metrics
   */
  async flush(): Promise<void> {
    await this.sendMetrics();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<WebVitalConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('📊 Core Web Vitals config updated:', this.config);
  }

  /**
   * Cleanup monitoring
   */
  cleanup(): void {
    if (this.sendTimer) {
      clearInterval(this.sendTimer);
    }
    
    // Send any remaining metrics
    this.sendMetrics();
    
    this.isInitialized = false;
    console.log('📊 Core Web Vitals monitoring cleaned up');
  }
}

// Global Core Web Vitals monitor instance
export const coreWebVitalsMonitor = new CoreWebVitalsMonitor({
  enabled: process.env.NODE_ENV === 'production',
  sampleRate: parseFloat(process.env.NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE || '0.1'),
  reportingEndpoint: process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT || '/api/analytics/web-vitals'
});

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).coreWebVitalsMonitor = coreWebVitalsMonitor;
}

export { CoreWebVitalsMonitor };
export type { WebVitalMetric, WebVitalData, WebVitalConfig };
