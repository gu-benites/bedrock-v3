/**
 * Selector Performance Analyzer
 * Analyzes and reports on Zustand selector performance and optimization impact
 */

interface SelectorMetrics {
  selectorName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
  subscriptionCount: number;
  optimizationLevel: 'none' | 'basic' | 'optimized' | 'advanced';
  preventedRenders: number;
  memoryUsage: number;
}

interface PerformanceReport {
  timestamp: number;
  totalSelectors: number;
  optimizedSelectors: number;
  totalRenders: number;
  preventedRenders: number;
  averageRenderTime: number;
  memoryUsage: number;
  recommendations: string[];
  selectors: SelectorMetrics[];
}

class SelectorPerformanceAnalyzer {
  private metrics = new Map<string, SelectorMetrics>();
  private renderHistory: Array<{ selector: string; timestamp: number; duration: number }> = [];
  private subscriptionCounts = new Map<string, number>();
  private isMonitoring = false;

  /**
   * Start monitoring selector performance
   */
  startMonitoring(): void {
    this.isMonitoring = true;
    console.log('📊 Selector performance monitoring started');
  }

  /**
   * Stop monitoring selector performance
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('📊 Selector performance monitoring stopped');
  }

  /**
   * Record a selector render
   */
  recordRender(
    selectorName: string, 
    renderDuration: number, 
    optimizationLevel: SelectorMetrics['optimizationLevel'] = 'none'
  ): void {
    if (!this.isMonitoring) return;

    const now = performance.now();
    
    // Update metrics
    const existing = this.metrics.get(selectorName);
    if (existing) {
      existing.renderCount++;
      existing.totalRenderTime += renderDuration;
      existing.averageRenderTime = existing.totalRenderTime / existing.renderCount;
      existing.lastRenderTime = now;
      existing.optimizationLevel = optimizationLevel;
    } else {
      this.metrics.set(selectorName, {
        selectorName,
        renderCount: 1,
        totalRenderTime: renderDuration,
        averageRenderTime: renderDuration,
        lastRenderTime: now,
        subscriptionCount: 1,
        optimizationLevel,
        preventedRenders: 0,
        memoryUsage: this.getMemoryUsage()
      });
    }

    // Add to render history
    this.renderHistory.push({
      selector: selectorName,
      timestamp: now,
      duration: renderDuration
    });

    // Limit history size
    if (this.renderHistory.length > 1000) {
      this.renderHistory = this.renderHistory.slice(-500);
    }

    // Log slow renders
    if (renderDuration > 16) { // 60fps threshold
      console.warn(`🐌 Slow selector render: ${selectorName} took ${renderDuration.toFixed(2)}ms`);
    }
  }

  /**
   * Record a prevented render (optimization success)
   */
  recordPreventedRender(selectorName: string): void {
    if (!this.isMonitoring) return;

    const existing = this.metrics.get(selectorName);
    if (existing) {
      existing.preventedRenders++;
    }
  }

  /**
   * Record subscription count for a selector
   */
  recordSubscription(selectorName: string, count: number): void {
    this.subscriptionCounts.set(selectorName, count);
    
    const existing = this.metrics.get(selectorName);
    if (existing) {
      existing.subscriptionCount = count;
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    return 0;
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const selectors = Array.from(this.metrics.values());
    const totalRenders = selectors.reduce((sum, s) => sum + s.renderCount, 0);
    const totalPreventedRenders = selectors.reduce((sum, s) => sum + s.preventedRenders, 0);
    const optimizedSelectors = selectors.filter(s => s.optimizationLevel !== 'none').length;
    const averageRenderTime = selectors.length > 0 
      ? selectors.reduce((sum, s) => sum + s.averageRenderTime, 0) / selectors.length 
      : 0;

    const recommendations = this.generateRecommendations(selectors);

    return {
      timestamp: Date.now(),
      totalSelectors: selectors.length,
      optimizedSelectors,
      totalRenders,
      preventedRenders: totalPreventedRenders,
      averageRenderTime,
      memoryUsage: this.getMemoryUsage(),
      recommendations,
      selectors: selectors.sort((a, b) => b.renderCount - a.renderCount)
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(selectors: SelectorMetrics[]): string[] {
    const recommendations: string[] = [];

    // Check for unoptimized selectors with high render counts
    const unoptimizedHighRender = selectors.filter(
      s => s.optimizationLevel === 'none' && s.renderCount > 10
    );
    if (unoptimizedHighRender.length > 0) {
      recommendations.push(
        `Optimize ${unoptimizedHighRender.length} selectors with high render counts: ${unoptimizedHighRender.map(s => s.selectorName).join(', ')}`
      );
    }

    // Check for slow average render times
    const slowSelectors = selectors.filter(s => s.averageRenderTime > 5);
    if (slowSelectors.length > 0) {
      recommendations.push(
        `Investigate slow selectors (>5ms): ${slowSelectors.map(s => s.selectorName).join(', ')}`
      );
    }

    // Check for high subscription counts
    const highSubscriptionSelectors = selectors.filter(s => s.subscriptionCount > 5);
    if (highSubscriptionSelectors.length > 0) {
      recommendations.push(
        `Consider splitting selectors with high subscription counts: ${highSubscriptionSelectors.map(s => s.selectorName).join(', ')}`
      );
    }

    // Check optimization success rate
    const optimizationRate = selectors.length > 0 
      ? (selectors.filter(s => s.optimizationLevel !== 'none').length / selectors.length) * 100 
      : 0;
    if (optimizationRate < 50) {
      recommendations.push(
        `Low optimization rate (${optimizationRate.toFixed(1)}%). Consider optimizing more selectors.`
      );
    }

    // Check prevented renders efficiency
    const preventionRate = totalRenders > 0 
      ? (selectors.reduce((sum, s) => sum + s.preventedRenders, 0) / totalRenders) * 100 
      : 0;
    if (preventionRate < 20) {
      recommendations.push(
        `Low render prevention rate (${preventionRate.toFixed(1)}%). Review selector optimization strategies.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Selector performance looks good! 🎉');
    }

    return recommendations;
  }

  /**
   * Get selector metrics for a specific selector
   */
  getSelectorMetrics(selectorName: string): SelectorMetrics | undefined {
    return this.metrics.get(selectorName);
  }

  /**
   * Get render history for analysis
   */
  getRenderHistory(selectorName?: string): Array<{ selector: string; timestamp: number; duration: number }> {
    if (selectorName) {
      return this.renderHistory.filter(entry => entry.selector === selectorName);
    }
    return [...this.renderHistory];
  }

  /**
   * Compare selector performance before and after optimization
   */
  comparePerformance(
    beforeMetrics: SelectorMetrics, 
    afterMetrics: SelectorMetrics
  ): {
    renderCountImprovement: number;
    renderTimeImprovement: number;
    preventedRendersGain: number;
    optimizationSuccess: boolean;
  } {
    const renderCountImprovement = beforeMetrics.renderCount > 0 
      ? ((beforeMetrics.renderCount - afterMetrics.renderCount) / beforeMetrics.renderCount) * 100 
      : 0;

    const renderTimeImprovement = beforeMetrics.averageRenderTime > 0 
      ? ((beforeMetrics.averageRenderTime - afterMetrics.averageRenderTime) / beforeMetrics.averageRenderTime) * 100 
      : 0;

    const preventedRendersGain = afterMetrics.preventedRenders - beforeMetrics.preventedRenders;

    const optimizationSuccess = renderCountImprovement > 0 || renderTimeImprovement > 0 || preventedRendersGain > 0;

    return {
      renderCountImprovement,
      renderTimeImprovement,
      preventedRendersGain,
      optimizationSuccess
    };
  }

  /**
   * Export performance data
   */
  exportData(): string {
    const report = this.generateReport();
    return JSON.stringify({
      report,
      renderHistory: this.renderHistory,
      subscriptionCounts: Object.fromEntries(this.subscriptionCounts),
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Clear all metrics and history
   */
  clearData(): void {
    this.metrics.clear();
    this.renderHistory = [];
    this.subscriptionCounts.clear();
    console.log('📊 Selector performance data cleared');
  }

  /**
   * Get real-time performance summary
   */
  getPerformanceSummary(): {
    totalSelectors: number;
    optimizedSelectors: number;
    averageRenderTime: number;
    recentRenders: number;
    preventedRenders: number;
  } {
    const selectors = Array.from(this.metrics.values());
    const recentRenders = this.renderHistory.filter(
      entry => performance.now() - entry.timestamp < 60000 // Last minute
    ).length;

    return {
      totalSelectors: selectors.length,
      optimizedSelectors: selectors.filter(s => s.optimizationLevel !== 'none').length,
      averageRenderTime: selectors.length > 0 
        ? selectors.reduce((sum, s) => sum + s.averageRenderTime, 0) / selectors.length 
        : 0,
      recentRenders,
      preventedRenders: selectors.reduce((sum, s) => sum + s.preventedRenders, 0)
    };
  }
}

// Global selector performance analyzer instance
export const selectorPerformanceAnalyzer = new SelectorPerformanceAnalyzer();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  selectorPerformanceAnalyzer.startMonitoring();
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).selectorPerformanceAnalyzer = selectorPerformanceAnalyzer;
}

export { SelectorPerformanceAnalyzer };
export type { SelectorMetrics, PerformanceReport };
