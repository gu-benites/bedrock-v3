/**
 * Performance Regression Testing Suite
 * Automated testing to detect performance regressions in the create-recipe workflow
 */

interface PerformanceThreshold {
  metric: string;
  threshold: number;
  unit: 'ms' | 'count' | 'mb' | 'percent';
  description: string;
}

interface PerformanceTestResult {
  testId: string;
  testName: string;
  timestamp: number;
  passed: boolean;
  metrics: Record<string, number>;
  thresholds: PerformanceThreshold[];
  violations: Array<{
    metric: string;
    actual: number;
    threshold: number;
    severity: 'warning' | 'error';
  }>;
  duration: number;
  environment: {
    userAgent: string;
    viewport: { width: number; height: number };
    connection?: string;
    memory?: number;
  };
}

interface PerformanceTestSuite {
  suiteId: string;
  suiteName: string;
  tests: PerformanceTest[];
  globalThresholds: PerformanceThreshold[];
}

interface PerformanceTest {
  testId: string;
  testName: string;
  description: string;
  thresholds: PerformanceThreshold[];
  setup?: () => Promise<void>;
  execute: () => Promise<Record<string, number>>;
  cleanup?: () => Promise<void>;
}

class PerformanceRegressionTester {
  private testResults: Map<string, PerformanceTestResult[]> = new Map();
  private baselines: Map<string, Record<string, number>> = new Map();
  private isRunning = false;

  /**
   * Default performance thresholds for create-recipe workflow
   */
  private defaultThresholds: PerformanceThreshold[] = [
    {
      metric: 'navigationTime',
      threshold: 2000,
      unit: 'ms',
      description: 'Maximum navigation time between steps'
    },
    {
      metric: 'componentRenderTime',
      threshold: 16,
      unit: 'ms',
      description: 'Maximum component render time (60fps)'
    },
    {
      metric: 'aiStreamingStartTime',
      threshold: 3000,
      unit: 'ms',
      description: 'Maximum time to start AI streaming'
    },
    {
      metric: 'memoryUsage',
      threshold: 100,
      unit: 'mb',
      description: 'Maximum memory usage'
    },
    {
      metric: 'rerenderCount',
      threshold: 5,
      unit: 'count',
      description: 'Maximum re-renders per component'
    },
    {
      metric: 'bundleSize',
      threshold: 500,
      unit: 'mb',
      description: 'Maximum JavaScript bundle size'
    }
  ];

  /**
   * Run a performance test suite
   */
  async runTestSuite(suite: PerformanceTestSuite): Promise<PerformanceTestResult[]> {
    if (this.isRunning) {
      throw new Error('Performance test suite is already running');
    }

    this.isRunning = true;
    const results: PerformanceTestResult[] = [];

    console.log(`🧪 Starting performance test suite: ${suite.suiteName}`);

    try {
      for (const test of suite.tests) {
        const result = await this.runSingleTest(test, suite.globalThresholds);
        results.push(result);
        
        // Store result
        const testResults = this.testResults.get(test.testId) || [];
        testResults.push(result);
        this.testResults.set(test.testId, testResults);

        // Log result
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${test.testName} (${result.duration.toFixed(2)}ms)`);
        
        if (!result.passed) {
          result.violations.forEach(violation => {
            console.warn(
              `  ⚠️ ${violation.metric}: ${violation.actual}${this.getUnit(violation.metric)} > ${violation.threshold}${this.getUnit(violation.metric)}`
            );
          });
        }
      }

      // Generate summary
      const passed = results.filter(r => r.passed).length;
      const total = results.length;
      
      console.log(`\n📊 Test Suite Summary: ${passed}/${total} tests passed`);
      
      if (passed < total) {
        console.warn(`⚠️ ${total - passed} performance regression(s) detected!`);
      }

    } finally {
      this.isRunning = false;
    }

    return results;
  }

  /**
   * Run a single performance test
   */
  private async runSingleTest(
    test: PerformanceTest, 
    globalThresholds: PerformanceThreshold[]
  ): Promise<PerformanceTestResult> {
    const startTime = performance.now();
    
    try {
      // Setup
      if (test.setup) {
        await test.setup();
      }

      // Execute test and collect metrics
      const metrics = await test.execute();

      // Cleanup
      if (test.cleanup) {
        await test.cleanup();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Combine thresholds
      const allThresholds = [...globalThresholds, ...test.thresholds, ...this.defaultThresholds];
      const uniqueThresholds = this.deduplicateThresholds(allThresholds);

      // Check thresholds
      const violations = this.checkThresholds(metrics, uniqueThresholds);
      const passed = violations.length === 0;

      return {
        testId: test.testId,
        testName: test.testName,
        timestamp: Date.now(),
        passed,
        metrics,
        thresholds: uniqueThresholds,
        violations,
        duration,
        environment: this.getEnvironmentInfo()
      };

    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      return {
        testId: test.testId,
        testName: test.testName,
        timestamp: Date.now(),
        passed: false,
        metrics: {},
        thresholds: [],
        violations: [{
          metric: 'testExecution',
          actual: 0,
          threshold: 0,
          severity: 'error'
        }],
        duration,
        environment: this.getEnvironmentInfo()
      };
    }
  }

  /**
   * Check metrics against thresholds
   */
  private checkThresholds(
    metrics: Record<string, number>, 
    thresholds: PerformanceThreshold[]
  ): Array<{ metric: string; actual: number; threshold: number; severity: 'warning' | 'error' }> {
    const violations: Array<{ metric: string; actual: number; threshold: number; severity: 'warning' | 'error' }> = [];

    thresholds.forEach(threshold => {
      const actualValue = metrics[threshold.metric];
      
      if (actualValue !== undefined && actualValue > threshold.threshold) {
        const severity = actualValue > threshold.threshold * 1.5 ? 'error' : 'warning';
        
        violations.push({
          metric: threshold.metric,
          actual: actualValue,
          threshold: threshold.threshold,
          severity
        });
      }
    });

    return violations;
  }

  /**
   * Deduplicate thresholds (later ones override earlier ones)
   */
  private deduplicateThresholds(thresholds: PerformanceThreshold[]): PerformanceThreshold[] {
    const thresholdMap = new Map<string, PerformanceThreshold>();
    
    thresholds.forEach(threshold => {
      thresholdMap.set(threshold.metric, threshold);
    });

    return Array.from(thresholdMap.values());
  }

  /**
   * Get unit for a metric
   */
  private getUnit(metric: string): string {
    const threshold = this.defaultThresholds.find(t => t.metric === metric);
    return threshold?.unit || '';
  }

  /**
   * Get environment information
   */
  private getEnvironmentInfo() {
    return {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: (navigator as any).connection?.effectiveType,
      memory: (performance as any).memory?.usedJSHeapSize ? 
        Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : undefined
    };
  }

  /**
   * Set baseline metrics for comparison
   */
  setBaseline(testId: string, metrics: Record<string, number>): void {
    this.baselines.set(testId, metrics);
    console.log(`📏 Baseline set for test: ${testId}`, metrics);
  }

  /**
   * Compare current metrics with baseline
   */
  compareWithBaseline(testId: string, currentMetrics: Record<string, number>): {
    regressions: Array<{ metric: string; baseline: number; current: number; change: number }>;
    improvements: Array<{ metric: string; baseline: number; current: number; change: number }>;
  } {
    const baseline = this.baselines.get(testId);
    if (!baseline) {
      return { regressions: [], improvements: [] };
    }

    const regressions: Array<{ metric: string; baseline: number; current: number; change: number }> = [];
    const improvements: Array<{ metric: string; baseline: number; current: number; change: number }> = [];

    Object.entries(currentMetrics).forEach(([metric, current]) => {
      const baselineValue = baseline[metric];
      if (baselineValue !== undefined) {
        const change = ((current - baselineValue) / baselineValue) * 100;
        
        if (change > 10) { // 10% regression threshold
          regressions.push({ metric, baseline: baselineValue, current, change });
        } else if (change < -10) { // 10% improvement threshold
          improvements.push({ metric, baseline: baselineValue, current, change });
        }
      }
    });

    return { regressions, improvements };
  }

  /**
   * Get test results for a specific test
   */
  getTestResults(testId: string): PerformanceTestResult[] {
    return this.testResults.get(testId) || [];
  }

  /**
   * Get all test results
   */
  getAllTestResults(): Map<string, PerformanceTestResult[]> {
    return new Map(this.testResults);
  }

  /**
   * Generate performance report
   */
  generateReport(suiteId?: string): {
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      totalViolations: number;
      averageDuration: number;
    };
    trends: Array<{
      testId: string;
      testName: string;
      trend: 'improving' | 'degrading' | 'stable';
      changePercent: number;
    }>;
    criticalIssues: Array<{
      testId: string;
      metric: string;
      severity: 'warning' | 'error';
      description: string;
    }>;
  } {
    const allResults = Array.from(this.testResults.values()).flat();
    const recentResults = suiteId 
      ? allResults.filter(r => r.testId.startsWith(suiteId))
      : allResults;

    const totalTests = recentResults.length;
    const passedTests = recentResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalViolations = recentResults.reduce((sum, r) => sum + r.violations.length, 0);
    const averageDuration = recentResults.reduce((sum, r) => sum + r.duration, 0) / totalTests;

    // Analyze trends (simplified)
    const trends = Array.from(this.testResults.entries()).map(([testId, results]) => {
      if (results.length < 2) {
        return { testId, testName: results[0]?.testName || testId, trend: 'stable' as const, changePercent: 0 };
      }

      const recent = results.slice(-2);
      const [previous, current] = recent;
      
      const avgPrevious = Object.values(previous.metrics).reduce((a, b) => a + b, 0) / Object.keys(previous.metrics).length;
      const avgCurrent = Object.values(current.metrics).reduce((a, b) => a + b, 0) / Object.keys(current.metrics).length;
      
      const changePercent = ((avgCurrent - avgPrevious) / avgPrevious) * 100;
      
      let trend: 'improving' | 'degrading' | 'stable' = 'stable';
      if (changePercent > 15) trend = 'degrading';
      else if (changePercent < -15) trend = 'improving';

      return {
        testId,
        testName: current.testName,
        trend,
        changePercent
      };
    });

    // Critical issues
    const criticalIssues = recentResults
      .filter(r => !r.passed)
      .flatMap(r => r.violations.map(v => ({
        testId: r.testId,
        metric: v.metric,
        severity: v.severity,
        description: `${v.metric} exceeded threshold: ${v.actual} > ${v.threshold}`
      })));

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        totalViolations,
        averageDuration
      },
      trends,
      criticalIssues
    };
  }

  /**
   * Clear all test results
   */
  clearResults(): void {
    this.testResults.clear();
    this.baselines.clear();
    console.log('🧹 All performance test results cleared');
  }

  /**
   * Export test results
   */
  exportResults(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      testResults: Object.fromEntries(this.testResults),
      baselines: Object.fromEntries(this.baselines),
      environment: this.getEnvironmentInfo()
    }, null, 2);
  }
}

/**
 * Utility function to measure performance of async operations
 */
export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ result: T; duration: number; memoryDelta?: number }> => {
  const startMemory = (performance as any).memory?.usedJSHeapSize;
  const startTime = performance.now();

  const result = await operation();

  const endTime = performance.now();
  const endMemory = (performance as any).memory?.usedJSHeapSize;

  const duration = endTime - startTime;
  const memoryDelta = startMemory && endMemory ? endMemory - startMemory : undefined;

  console.log(`⏱️ ${operationName}: ${duration.toFixed(2)}ms${memoryDelta ? ` (${Math.round(memoryDelta / 1024)}KB memory)` : ''}`);

  return { result, duration, memoryDelta };
};

/**
 * Utility function to measure component render performance
 */
export const measureComponentRender = (componentName: string) => {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (duration > 16) { // 60fps threshold
      console.warn(`🐌 Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  };
};

// Global performance regression tester instance
export const performanceRegressionTester = new PerformanceRegressionTester();

// Make available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).performanceRegressionTester = performanceRegressionTester;
  (window as any).measurePerformance = measurePerformance;
  (window as any).measureComponentRender = measureComponentRender;
}

export { PerformanceRegressionTester };
export type {
  PerformanceTest,
  PerformanceTestSuite,
  PerformanceTestResult,
  PerformanceThreshold
};
