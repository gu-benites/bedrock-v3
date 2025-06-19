/**
 * Component Preloader
 * Preloads React components, JavaScript bundles, and static assets for faster navigation
 */

interface PreloadOptions {
  preloadComponents?: boolean;
  preloadAssets?: boolean;
  preloadStyles?: boolean;
  priority?: 'high' | 'low';
  timeout?: number;
}

interface PreloadMetrics {
  componentsPreloaded: number;
  assetsPreloaded: number;
  stylesPreloaded: number;
  failures: number;
  totalPreloadTime: number;
  averagePreloadTime: number;
  fallbacksUsed: number;
  retryAttempts: number;
  timeoutFailures: number;
  networkFailures: number;
}

// Component cache for loaded modules
const componentCache = new Map<string, any>();
const preloadPromises = new Map<string, Promise<any>>();
const failureTracker = new Map<string, { count: number; lastFailure: number; reason: string }>();

// Fallback strategies
interface FallbackStrategy {
  maxRetries: number;
  retryDelay: number;
  fallbackTimeout: number;
  enableGracefulDegradation: boolean;
  enableOfflineMode: boolean;
}

class ComponentPreloader {
  private metrics: PreloadMetrics = {
    componentsPreloaded: 0,
    assetsPreloaded: 0,
    stylesPreloaded: 0,
    failures: 0,
    totalPreloadTime: 0,
    averagePreloadTime: 0,
    fallbacksUsed: 0,
    retryAttempts: 0,
    timeoutFailures: 0,
    networkFailures: 0
  };

  private fallbackStrategy: FallbackStrategy = {
    maxRetries: 3,
    retryDelay: 1000,
    fallbackTimeout: 10000,
    enableGracefulDegradation: true,
    enableOfflineMode: true
  };

  /**
   * Preload a React component using dynamic import with retry and fallback logic
   */
  async preloadComponent(componentPath: string, options: PreloadOptions = {}): Promise<any> {
    const { priority = 'low', timeout = 5000 } = options;

    // Return cached component if available
    if (componentCache.has(componentPath)) {
      console.log(`⚡ Component already loaded: ${componentPath}`);
      return componentCache.get(componentPath);
    }

    // Return existing promise if already preloading
    if (preloadPromises.has(componentPath)) {
      console.log(`⏳ Component already preloading: ${componentPath}`);
      return preloadPromises.get(componentPath);
    }

    // Check failure history for this component
    const failureInfo = failureTracker.get(componentPath);
    if (failureInfo && failureInfo.count >= this.fallbackStrategy.maxRetries) {
      const timeSinceLastFailure = Date.now() - failureInfo.lastFailure;
      if (timeSinceLastFailure < 60000) { // 1 minute cooldown
        console.warn(`🚫 Component preload blocked due to repeated failures: ${componentPath}`);
        return this.handleGracefulDegradation(componentPath);
      } else {
        // Reset failure count after cooldown
        failureTracker.delete(componentPath);
      }
    }

    const startTime = performance.now();

    const preloadPromise = this.executeComponentPreloadWithRetry(componentPath, { priority, timeout });
    preloadPromises.set(componentPath, preloadPromise);

    try {
      const component = await preloadPromise;
      const endTime = performance.now();
      const preloadTime = endTime - startTime;

      componentCache.set(componentPath, component);
      this.metrics.componentsPreloaded++;
      this.metrics.totalPreloadTime += preloadTime;
      this.metrics.averagePreloadTime = this.metrics.totalPreloadTime / this.metrics.componentsPreloaded;

      // Clear failure history on success
      failureTracker.delete(componentPath);

      console.log(`✅ Component preloaded: ${componentPath} (${preloadTime.toFixed(2)}ms)`);
      return component;

    } catch (error) {
      this.trackFailure(componentPath, error);
      console.error(`❌ Failed to preload component: ${componentPath}`, error);

      // Try graceful degradation
      return this.handleGracefulDegradation(componentPath);
    } finally {
      preloadPromises.delete(componentPath);
    }
  }

  /**
   * Execute component preload with retry logic
   */
  private async executeComponentPreloadWithRetry(componentPath: string, options: PreloadOptions): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.fallbackStrategy.maxRetries; attempt++) {
      try {
        console.log(`🔄 Preload attempt ${attempt}/${this.fallbackStrategy.maxRetries}: ${componentPath}`);

        const component = await this.executeComponentPreload(componentPath, options);

        if (attempt > 1) {
          this.metrics.retryAttempts++;
          console.log(`✅ Component preload succeeded on retry ${attempt}: ${componentPath}`);
        }

        return component;

      } catch (error) {
        lastError = error as Error;
        this.metrics.retryAttempts++;

        if (error instanceof Error && error.message.includes('timeout')) {
          this.metrics.timeoutFailures++;
        } else {
          this.metrics.networkFailures++;
        }

        if (attempt < this.fallbackStrategy.maxRetries) {
          const delay = this.fallbackStrategy.retryDelay * attempt; // Exponential backoff
          console.warn(`⚠️ Preload attempt ${attempt} failed, retrying in ${delay}ms: ${componentPath}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`Failed to preload component after ${this.fallbackStrategy.maxRetries} attempts`);
  }

  /**
   * Execute component preload with timeout
   */
  private async executeComponentPreload(componentPath: string, options: PreloadOptions): Promise<any> {
    const { priority, timeout } = options;

    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Component preload timeout: ${componentPath}`));
      }, timeout);

      try {
        let component;

        // Use different strategies based on priority
        if (priority === 'high') {
          // Immediate import for high priority
          component = await import(componentPath);
        } else {
          // Use requestIdleCallback for low priority
          if ('requestIdleCallback' in window) {
            await new Promise(resolve => {
              (window as any).requestIdleCallback(resolve, { timeout: 1000 });
            });
          }
          component = await import(componentPath);
        }

        clearTimeout(timeoutId);
        resolve(component);

      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Track component preload failures
   */
  private trackFailure(componentPath: string, error: any): void {
    const existing = failureTracker.get(componentPath) || { count: 0, lastFailure: 0, reason: '' };

    failureTracker.set(componentPath, {
      count: existing.count + 1,
      lastFailure: Date.now(),
      reason: error?.message || 'Unknown error'
    });

    this.metrics.failures++;
  }

  /**
   * Handle graceful degradation when preloading fails
   */
  private async handleGracefulDegradation(componentPath: string): Promise<any> {
    if (!this.fallbackStrategy.enableGracefulDegradation) {
      throw new Error(`Component preload failed and graceful degradation is disabled: ${componentPath}`);
    }

    this.metrics.fallbacksUsed++;

    console.log(`🔄 Attempting graceful degradation for: ${componentPath}`);

    // Strategy 1: Try to load component synchronously at navigation time
    const fallbackComponent = {
      __fallback: true,
      componentPath,
      loadSync: async () => {
        try {
          console.log(`🚨 Loading component synchronously as fallback: ${componentPath}`);
          return await import(componentPath);
        } catch (error) {
          console.error(`❌ Synchronous fallback also failed: ${componentPath}`, error);
          return this.createErrorBoundaryComponent(componentPath, error);
        }
      }
    };

    // Cache the fallback for future use
    componentCache.set(componentPath, fallbackComponent);

    return fallbackComponent;
  }

  /**
   * Create an error boundary component as last resort
   */
  private createErrorBoundaryComponent(componentPath: string, error: any) {
    return {
      __errorBoundary: true,
      componentPath,
      error: error?.message || 'Component failed to load',
      fallbackComponent: () => {
        console.error(`🚨 Rendering error boundary for failed component: ${componentPath}`);
        return null; // Return null to render nothing instead of crashing
      }
    };
  }

  /**
   * Preload CSS stylesheet with fallback handling
   */
  async preloadStylesheet(href: string): Promise<void> {
    // Check if already loaded
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) {
      console.log(`💄 Stylesheet already loaded: ${href}`);
      return;
    }

    for (let attempt = 1; attempt <= this.fallbackStrategy.maxRetries; attempt++) {
      try {
        await this.executeStylesheetPreload(href);

        this.metrics.stylesPreloaded++;
        if (attempt > 1) {
          this.metrics.retryAttempts++;
          console.log(`✅ Stylesheet preload succeeded on retry ${attempt}: ${href}`);
        } else {
          console.log(`💄 Stylesheet preloaded: ${href}`);
        }
        return;

      } catch (error) {
        this.metrics.retryAttempts++;

        if (attempt < this.fallbackStrategy.maxRetries) {
          const delay = this.fallbackStrategy.retryDelay * attempt;
          console.warn(`⚠️ Stylesheet preload attempt ${attempt} failed, retrying in ${delay}ms: ${href}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.metrics.failures++;
          console.error(`❌ Failed to preload stylesheet after ${this.fallbackStrategy.maxRetries} attempts: ${href}`);
          // Don't throw - stylesheets are non-critical for functionality
        }
      }
    }
  }

  /**
   * Execute stylesheet preload
   */
  private executeStylesheetPreload(href: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;

      const timeout = setTimeout(() => {
        reject(new Error(`Stylesheet preload timeout: ${href}`));
      }, 5000);

      link.onload = () => {
        clearTimeout(timeout);
        resolve();
      };

      link.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to preload stylesheet: ${href}`));
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Preload static asset (image, icon, etc.) with fallback handling
   */
  async preloadAsset(src: string, type: 'image' | 'font' | 'script' = 'image'): Promise<void> {
    for (let attempt = 1; attempt <= this.fallbackStrategy.maxRetries; attempt++) {
      try {
        await this.executeAssetPreload(src, type);

        this.metrics.assetsPreloaded++;
        if (attempt > 1) {
          this.metrics.retryAttempts++;
          console.log(`✅ Asset preload succeeded on retry ${attempt}: ${src}`);
        } else {
          console.log(`🖼️ Asset preloaded: ${src}`);
        }
        return;

      } catch (error) {
        this.metrics.retryAttempts++;

        if (attempt < this.fallbackStrategy.maxRetries) {
          const delay = this.fallbackStrategy.retryDelay * attempt;
          console.warn(`⚠️ Asset preload attempt ${attempt} failed, retrying in ${delay}ms: ${src}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.metrics.failures++;
          console.error(`❌ Failed to preload asset after ${this.fallbackStrategy.maxRetries} attempts: ${src}`);
          // Don't throw - assets are non-critical for functionality
        }
      }
    }
  }

  /**
   * Execute asset preload
   */
  private executeAssetPreload(src: string, type: 'image' | 'font' | 'script'): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = type;
      link.href = src;

      if (type === 'font') {
        link.crossOrigin = 'anonymous';
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Asset preload timeout: ${src}`));
      }, 5000);

      link.onload = () => {
        clearTimeout(timeout);
        resolve();
      };

      link.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to preload asset: ${src}`));
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Preload multiple resources in parallel
   */
  async preloadBatch(resources: Array<{
    type: 'component' | 'style' | 'asset';
    path: string;
    options?: PreloadOptions;
  }>): Promise<void> {
    const promises = resources.map(resource => {
      switch (resource.type) {
        case 'component':
          return this.preloadComponent(resource.path, resource.options);
        case 'style':
          return this.preloadStylesheet(resource.path);
        case 'asset':
          return this.preloadAsset(resource.path);
        default:
          return Promise.resolve();
      }
    });

    try {
      await Promise.allSettled(promises);
      console.log(`📦 Batch preload completed: ${resources.length} resources`);
    } catch (error) {
      console.error('Batch preload failed:', error);
    }
  }

  /**
   * Get cached component
   */
  getCachedComponent(componentPath: string): any | null {
    return componentCache.get(componentPath) || null;
  }

  /**
   * Check if component is cached
   */
  isComponentCached(componentPath: string): boolean {
    return componentCache.has(componentPath);
  }

  /**
   * Clear component cache
   */
  clearCache(): void {
    componentCache.clear();
    preloadPromises.clear();
    console.log('🧹 Component cache cleared');
  }

  /**
   * Get preload metrics
   */
  getMetrics(): PreloadMetrics {
    return { ...this.metrics };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedComponents: componentCache.size,
      activePreloads: preloadPromises.size,
      cacheEntries: Array.from(componentCache.keys()),
      failureHistory: Array.from(failureTracker.entries()).map(([path, info]) => ({
        path,
        failureCount: info.count,
        lastFailure: new Date(info.lastFailure).toISOString(),
        reason: info.reason
      }))
    };
  }

  /**
   * Get failure statistics
   */
  getFailureStats() {
    const totalFailures = Array.from(failureTracker.values()).reduce((sum, info) => sum + info.count, 0);
    const componentsWithFailures = failureTracker.size;

    return {
      totalFailures,
      componentsWithFailures,
      timeoutFailures: this.metrics.timeoutFailures,
      networkFailures: this.metrics.networkFailures,
      retryAttempts: this.metrics.retryAttempts,
      fallbacksUsed: this.metrics.fallbacksUsed,
      failureRate: this.metrics.componentsPreloaded > 0
        ? (this.metrics.failures / (this.metrics.componentsPreloaded + this.metrics.failures)) * 100
        : 0
    };
  }

  /**
   * Clear failure history
   */
  clearFailureHistory(): void {
    failureTracker.clear();
    console.log('🧹 Failure history cleared');
  }

  /**
   * Configure fallback strategy
   */
  configureFallbackStrategy(strategy: Partial<FallbackStrategy>): void {
    this.fallbackStrategy = { ...this.fallbackStrategy, ...strategy };
    console.log('⚙️ Fallback strategy updated:', this.fallbackStrategy);
  }
}

// Global preloader instance
export const componentPreloader = new ComponentPreloader();

/**
 * Hook for component preloading
 */
export const useComponentPreloader = () => {
  const preloadComponent = async (componentPath: string, options?: PreloadOptions) => {
    return componentPreloader.preloadComponent(componentPath, options);
  };

  const preloadBatch = async (resources: Array<{
    type: 'component' | 'style' | 'asset';
    path: string;
    options?: PreloadOptions;
  }>) => {
    return componentPreloader.preloadBatch(resources);
  };

  const getCachedComponent = (componentPath: string) => {
    return componentPreloader.getCachedComponent(componentPath);
  };

  const isComponentCached = (componentPath: string) => {
    return componentPreloader.isComponentCached(componentPath);
  };

  return {
    preloadComponent,
    preloadBatch,
    getCachedComponent,
    isComponentCached,
    getMetrics: () => componentPreloader.getMetrics(),
    getCacheStats: () => componentPreloader.getCacheStats(),
    getFailureStats: () => componentPreloader.getFailureStats(),
    clearFailureHistory: () => componentPreloader.clearFailureHistory(),
    configureFallbackStrategy: (strategy: Partial<FallbackStrategy>) =>
      componentPreloader.configureFallbackStrategy(strategy)
  };
};

export { ComponentPreloader };
export type { PreloadOptions, PreloadMetrics };
