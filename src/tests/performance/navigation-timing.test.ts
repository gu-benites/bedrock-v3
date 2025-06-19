/**
 * Navigation Timing Performance Regression Tests
 * Automated tests to verify navigation timing stays within acceptable bounds
 */

import { test, expect, Page } from '@playwright/test';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  NAVIGATION_MAX: 2000,        // Maximum navigation time between steps
  NAVIGATION_TARGET: 1000,     // Target navigation time
  AI_STREAMING_MAX: 30000,     // Maximum AI streaming completion time
  RENDER_MAX: 500,             // Maximum component render time
  STATE_UPDATE_MAX: 100,       // Maximum state update time
  PREFETCH_MAX: 1000,          // Maximum prefetch time
  PERSISTENCE_SAVE_MAX: 50,    // Maximum persistence save time
  PERSISTENCE_RESTORE_MAX: 100 // Maximum persistence restore time
};

interface NavigationMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  fromStep: string;
  toStep: string;
  renderTime?: number;
  stateUpdateTime?: number;
  prefetchTime?: number;
}

interface AIStreamingMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  itemCount: number;
  averageItemTime: number;
  streamingType: string;
}

class PerformanceTestHelper {
  private page: Page;
  private metrics: NavigationMetrics[] = [];
  private streamingMetrics: AIStreamingMetrics[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  async setupPerformanceMonitoring(): Promise<void> {
    // Inject performance monitoring script
    await this.page.addInitScript(() => {
      (window as any).performanceMetrics = {
        navigationTimes: [],
        streamingTimes: [],
        renderTimes: [],
        stateUpdateTimes: []
      };

      // Monitor navigation timing
      (window as any).recordNavigation = (fromStep: string, toStep: string) => {
        const startTime = performance.now();
        return {
          complete: () => {
            const endTime = performance.now();
            (window as any).performanceMetrics.navigationTimes.push({
              fromStep,
              toStep,
              startTime,
              endTime,
              duration: endTime - startTime
            });
          }
        };
      };

      // Monitor AI streaming
      (window as any).recordStreaming = (type: string) => {
        const startTime = performance.now();
        let itemCount = 0;
        return {
          addItem: () => itemCount++,
          complete: () => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            (window as any).performanceMetrics.streamingTimes.push({
              streamingType: type,
              startTime,
              endTime,
              duration,
              itemCount,
              averageItemTime: itemCount > 0 ? duration / itemCount : 0
            });
          }
        };
      };

      // Monitor render timing
      (window as any).recordRender = (componentName: string) => {
        const startTime = performance.now();
        return () => {
          const endTime = performance.now();
          (window as any).performanceMetrics.renderTimes.push({
            componentName,
            duration: endTime - startTime
          });
        };
      };
    });
  }

  async measureNavigation(fromStep: string, toStep: string, action: () => Promise<void>): Promise<NavigationMetrics> {
    const startTime = performance.now();
    
    await action();
    
    // Wait for navigation to complete
    await this.page.waitForLoadState('networkidle');
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    const metrics: NavigationMetrics = {
      startTime,
      endTime,
      duration,
      fromStep,
      toStep
    };

    this.metrics.push(metrics);
    return metrics;
  }

  async measureAIStreaming(streamingType: string, triggerAction: () => Promise<void>): Promise<AIStreamingMetrics> {
    const startTime = performance.now();
    
    await triggerAction();
    
    // Wait for streaming to complete
    await this.page.waitForSelector('[data-testid="ai-streaming-complete"]', { timeout: 30000 });
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Get item count from page
    const itemCount = await this.page.locator('[data-testid="streaming-item"]').count();

    const metrics: AIStreamingMetrics = {
      startTime,
      endTime,
      duration,
      itemCount,
      averageItemTime: itemCount > 0 ? duration / itemCount : 0,
      streamingType
    };

    this.streamingMetrics.push(metrics);
    return metrics;
  }

  async getPerformanceMetrics(): Promise<any> {
    return await this.page.evaluate(() => (window as any).performanceMetrics);
  }

  getNavigationMetrics(): NavigationMetrics[] {
    return this.metrics;
  }

  getStreamingMetrics(): AIStreamingMetrics[] {
    return this.streamingMetrics;
  }
}

test.describe('Navigation Timing Performance', () => {
  let helper: PerformanceTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new PerformanceTestHelper(page);
    await helper.setupPerformanceMonitoring();
    await page.goto('/create-recipe');
  });

  test('should navigate between steps within performance thresholds', async ({ page }) => {
    // Test navigation from demographics to causes
    const demographicsMetrics = await helper.measureNavigation(
      'demographics',
      'causes',
      async () => {
        // Fill demographics form
        await page.fill('[data-testid="age-category"]', 'adult');
        await page.fill('[data-testid="gender"]', 'female');
        await page.fill('[data-testid="language"]', 'english');
        
        // Click continue
        await page.click('[data-testid="continue-button"]');
        
        // Wait for causes page
        await page.waitForSelector('[data-testid="causes-selection"]');
      }
    );

    expect(demographicsMetrics.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.NAVIGATION_MAX);
    expect(demographicsMetrics.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.NAVIGATION_TARGET);

    // Test navigation from causes to symptoms
    const causesMetrics = await helper.measureNavigation(
      'causes',
      'symptoms',
      async () => {
        // Select a cause
        await page.click('[data-testid="cause-card"]:first-child');
        
        // Click continue
        await page.click('[data-testid="continue-button"]');
        
        // Wait for symptoms page
        await page.waitForSelector('[data-testid="symptoms-selection"]');
      }
    );

    expect(causesMetrics.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.NAVIGATION_MAX);

    // Test navigation from symptoms to properties
    const symptomsMetrics = await helper.measureNavigation(
      'symptoms',
      'properties',
      async () => {
        // Select a symptom
        await page.click('[data-testid="symptom-card"]:first-child');
        
        // Click continue
        await page.click('[data-testid="continue-button"]');
        
        // Wait for properties page
        await page.waitForSelector('[data-testid="properties-display"]');
      }
    );

    expect(symptomsMetrics.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.NAVIGATION_MAX);

    // Verify overall navigation performance
    const allMetrics = helper.getNavigationMetrics();
    const averageNavigationTime = allMetrics.reduce((sum, m) => sum + m.duration, 0) / allMetrics.length;
    
    expect(averageNavigationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.NAVIGATION_TARGET);
  });

  test('should complete AI streaming within performance thresholds', async ({ page }) => {
    // Navigate to causes step
    await page.fill('[data-testid="age-category"]', 'adult');
    await page.fill('[data-testid="gender"]', 'female');
    await page.fill('[data-testid="language"]', 'english');
    await page.click('[data-testid="continue-button"]');
    await page.waitForSelector('[data-testid="causes-selection"]');

    // Test causes AI streaming
    const causesStreamingMetrics = await helper.measureAIStreaming(
      'causes',
      async () => {
        await page.click('[data-testid="analyze-causes-button"]');
      }
    );

    expect(causesStreamingMetrics.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.AI_STREAMING_MAX);
    expect(causesStreamingMetrics.averageItemTime).toBeLessThan(1000); // 1s per item max

    // Test symptoms AI streaming
    await page.click('[data-testid="cause-card"]:first-child');
    await page.click('[data-testid="continue-button"]');
    await page.waitForSelector('[data-testid="symptoms-selection"]');

    const symptomsStreamingMetrics = await helper.measureAIStreaming(
      'symptoms',
      async () => {
        await page.click('[data-testid="analyze-symptoms-button"]');
      }
    );

    expect(symptomsStreamingMetrics.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.AI_STREAMING_MAX);
    expect(symptomsStreamingMetrics.averageItemTime).toBeLessThan(1000);

    // Verify streaming performance consistency
    const allStreamingMetrics = helper.getStreamingMetrics();
    const averageStreamingTime = allStreamingMetrics.reduce((sum, m) => sum + m.duration, 0) / allStreamingMetrics.length;
    
    expect(averageStreamingTime).toBeLessThan(20000); // 20s average
  });

  test('should maintain performance under concurrent operations', async ({ page }) => {
    // Navigate to properties step
    await page.fill('[data-testid="age-category"]', 'adult');
    await page.fill('[data-testid="gender"]', 'female');
    await page.fill('[data-testid="language"]', 'english');
    await page.click('[data-testid="continue-button"]');
    
    await page.waitForSelector('[data-testid="causes-selection"]');
    await page.click('[data-testid="cause-card"]:first-child');
    await page.click('[data-testid="continue-button"]');
    
    await page.waitForSelector('[data-testid="symptoms-selection"]');
    await page.click('[data-testid="symptom-card"]:first-child');
    await page.click('[data-testid="continue-button"]');
    
    await page.waitForSelector('[data-testid="properties-display"]');

    // Test concurrent AI streaming for multiple properties
    const concurrentStartTime = performance.now();
    
    // Trigger multiple oil suggestions simultaneously
    const propertyCards = await page.locator('[data-testid="property-card"]').all();
    const promises = propertyCards.slice(0, 3).map(async (card, index) => {
      const startTime = performance.now();
      await card.locator('[data-testid="find-oils-button"]').click();
      await page.waitForSelector(`[data-testid="oils-complete-${index}"]`, { timeout: 30000 });
      return performance.now() - startTime;
    });

    const concurrentTimes = await Promise.all(promises);
    const concurrentEndTime = performance.now();
    const totalConcurrentTime = concurrentEndTime - concurrentStartTime;

    // Verify concurrent performance
    expect(totalConcurrentTime).toBeLessThan(45000); // 45s for 3 concurrent operations
    concurrentTimes.forEach(time => {
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.AI_STREAMING_MAX);
    });
  });

  test('should maintain performance with state persistence', async ({ page }) => {
    // Test persistence save performance
    const persistenceStartTime = performance.now();
    
    await page.fill('[data-testid="age-category"]', 'adult');
    await page.fill('[data-testid="gender"]', 'female');
    await page.fill('[data-testid="language"]', 'english');
    
    // Wait for persistence to complete
    await page.waitForTimeout(100);
    
    const persistenceSaveTime = performance.now() - persistenceStartTime;
    expect(persistenceSaveTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PERSISTENCE_SAVE_MAX);

    // Test persistence restore performance
    const restoreStartTime = performance.now();
    
    // Refresh page to trigger restore
    await page.reload();
    await page.waitForSelector('[data-testid="demographics-form"]');
    
    const persistenceRestoreTime = performance.now() - restoreStartTime;
    expect(persistenceRestoreTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PERSISTENCE_RESTORE_MAX);

    // Verify data was restored correctly
    const ageValue = await page.inputValue('[data-testid="age-category"]');
    expect(ageValue).toBe('adult');
  });

  test('should maintain performance with route prefetching', async ({ page }) => {
    // Test prefetch performance
    const prefetchStartTime = performance.now();
    
    // Fill demographics to trigger prefetching
    await page.fill('[data-testid="age-category"]', 'adult');
    await page.fill('[data-testid="gender"]', 'female');
    await page.fill('[data-testid="language"]', 'english');
    
    // Wait for prefetch to complete
    await page.waitForFunction(() => {
      return (window as any).prefetchComplete === true;
    }, { timeout: 5000 });
    
    const prefetchTime = performance.now() - prefetchStartTime;
    expect(prefetchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PREFETCH_MAX);

    // Test that prefetched navigation is faster
    const navigationStartTime = performance.now();
    await page.click('[data-testid="continue-button"]');
    await page.waitForSelector('[data-testid="causes-selection"]');
    const navigationTime = performance.now() - navigationStartTime;

    expect(navigationTime).toBeLessThan(500); // Should be very fast with prefetching
  });

  test('should detect performance regressions', async ({ page }) => {
    const performanceMetrics = await helper.getPerformanceMetrics();
    
    // Check for excessive re-renders
    const renderTimes = performanceMetrics.renderTimes || [];
    const slowRenders = renderTimes.filter((r: any) => r.duration > PERFORMANCE_THRESHOLDS.RENDER_MAX);
    
    expect(slowRenders.length).toBe(0);

    // Check for slow state updates
    const stateUpdateTimes = performanceMetrics.stateUpdateTimes || [];
    const slowStateUpdates = stateUpdateTimes.filter((s: any) => s.duration > PERFORMANCE_THRESHOLDS.STATE_UPDATE_MAX);
    
    expect(slowStateUpdates.length).toBe(0);

    // Generate performance report
    const report = {
      navigationMetrics: helper.getNavigationMetrics(),
      streamingMetrics: helper.getStreamingMetrics(),
      renderMetrics: renderTimes,
      stateUpdateMetrics: stateUpdateTimes,
      thresholds: PERFORMANCE_THRESHOLDS,
      timestamp: new Date().toISOString()
    };

    // Log performance report for CI/CD
    console.log('Performance Test Report:', JSON.stringify(report, null, 2));
  });
});

test.describe('Performance Regression Detection', () => {
  test('should compare against baseline performance', async ({ page }) => {
    // Load baseline performance data
    const baselineData = {
      averageNavigationTime: 800,
      averageStreamingTime: 15000,
      averageRenderTime: 50,
      averageStateUpdateTime: 10
    };

    const helper = new PerformanceTestHelper(page);
    await helper.setupPerformanceMonitoring();
    await page.goto('/create-recipe');

    // Run performance test
    await page.fill('[data-testid="age-category"]', 'adult');
    await page.fill('[data-testid="gender"]', 'female');
    await page.fill('[data-testid="language"]', 'english');
    await page.click('[data-testid="continue-button"]');
    await page.waitForSelector('[data-testid="causes-selection"]');

    const navigationMetrics = helper.getNavigationMetrics();
    const currentAverageNavigation = navigationMetrics.reduce((sum, m) => sum + m.duration, 0) / navigationMetrics.length;

    // Check for regression (more than 20% slower than baseline)
    const regressionThreshold = baselineData.averageNavigationTime * 1.2;
    expect(currentAverageNavigation).toBeLessThan(regressionThreshold);

    // Log regression analysis
    const regressionAnalysis = {
      baseline: baselineData.averageNavigationTime,
      current: currentAverageNavigation,
      regression: ((currentAverageNavigation - baselineData.averageNavigationTime) / baselineData.averageNavigationTime) * 100,
      threshold: regressionThreshold,
      passed: currentAverageNavigation < regressionThreshold
    };

    console.log('Regression Analysis:', JSON.stringify(regressionAnalysis, null, 2));
  });
});

// Export for use in other test files
export { PerformanceTestHelper, PERFORMANCE_THRESHOLDS };
