/**
 * Create Recipe Performance Regression Tests
 * Automated tests to detect performance regressions in CI/CD
 */

import { 
  performanceRegressionTester,
  PerformanceTestResult 
} from '@/lib/testing/performance-regression-tester';
import { 
  createRecipePerformanceTestSuite,
  runQuickPerformanceCheck 
} from '@/lib/testing/create-recipe-performance-tests';

// Mock performance APIs for testing environment
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024 // 100MB
  }
};

// Mock navigator for testing
const mockNavigator = {
  userAgent: 'Jest Test Environment',
  connection: {
    effectiveType: '4g'
  }
};

// Setup mocks
beforeAll(() => {
  Object.defineProperty(global, 'performance', {
    value: mockPerformance,
    writable: true
  });

  Object.defineProperty(global, 'navigator', {
    value: mockNavigator,
    writable: true
  });

  Object.defineProperty(global, 'window', {
    value: {
      innerWidth: 1920,
      innerHeight: 1080
    },
    writable: true
  });
});

describe('Create Recipe Performance Tests', () => {
  beforeEach(() => {
    // Clear previous test results
    performanceRegressionTester.clearResults();
    
    // Reset mock call counts
    jest.clearAllMocks();
  });

  describe('Performance Test Suite', () => {
    it('should run the complete performance test suite', async () => {
      const results = await performanceRegressionTester.runTestSuite(createRecipePerformanceTestSuite);
      
      expect(results).toHaveLength(createRecipePerformanceTestSuite.tests.length);
      expect(results.every(result => typeof result.passed === 'boolean')).toBe(true);
      expect(results.every(result => result.duration > 0)).toBe(true);
    });

    it('should detect performance regressions', async () => {
      // Set a baseline with good performance
      performanceRegressionTester.setBaseline('test-navigation', {
        navigationTime: 500,
        renderTime: 10
      });

      // Simulate degraded performance
      const degradedMetrics = {
        navigationTime: 3000, // Exceeds 2000ms threshold
        renderTime: 25        // Exceeds 16ms threshold
      };

      const comparison = performanceRegressionTester.compareWithBaseline('test-navigation', degradedMetrics);
      
      expect(comparison.regressions.length).toBeGreaterThan(0);
      expect(comparison.regressions.some(r => r.metric === 'navigationTime')).toBe(true);
    });

    it('should identify performance improvements', async () => {
      // Set a baseline with poor performance
      performanceRegressionTester.setBaseline('test-improvement', {
        navigationTime: 2500,
        renderTime: 30
      });

      // Simulate improved performance
      const improvedMetrics = {
        navigationTime: 800,  // Significant improvement
        renderTime: 8         // Significant improvement
      };

      const comparison = performanceRegressionTester.compareWithBaseline('test-improvement', improvedMetrics);
      
      expect(comparison.improvements.length).toBeGreaterThan(0);
      expect(comparison.improvements.some(i => i.metric === 'navigationTime')).toBe(true);
    });
  });

  describe('Individual Performance Tests', () => {
    it('should pass navigation performance test with good metrics', async () => {
      const navigationTest = createRecipePerformanceTestSuite.tests.find(
        test => test.testId === 'create-recipe-navigation'
      );

      expect(navigationTest).toBeDefined();
      
      if (navigationTest) {
        const metrics = await navigationTest.execute();
        
        expect(metrics.navigationTime).toBeDefined();
        expect(metrics.routePreloadTime).toBeDefined();
        expect(typeof metrics.navigationTime).toBe('number');
        expect(typeof metrics.routePreloadTime).toBe('number');
      }
    });

    it('should pass component render test', async () => {
      const renderTest = createRecipePerformanceTestSuite.tests.find(
        test => test.testId === 'create-recipe-component-render'
      );

      expect(renderTest).toBeDefined();
      
      if (renderTest) {
        const metrics = await renderTest.execute();
        
        expect(metrics.averageRenderTime).toBeDefined();
        expect(metrics.maxRenderTime).toBeDefined();
        expect(metrics.rerenderCount).toBeDefined();
      }
    });

    it('should pass AI streaming performance test', async () => {
      const streamingTest = createRecipePerformanceTestSuite.tests.find(
        test => test.testId === 'create-recipe-ai-streaming'
      );

      expect(streamingTest).toBeDefined();
      
      if (streamingTest) {
        const metrics = await streamingTest.execute();
        
        expect(metrics.streamingStartTime).toBeDefined();
        expect(metrics.itemsPerSecond).toBeDefined();
        expect(metrics.totalStreamingTime).toBeDefined();
        expect(metrics.itemsPerSecond).toBeGreaterThan(0);
      }
    });

    it('should pass memory usage test', async () => {
      const memoryTest = createRecipePerformanceTestSuite.tests.find(
        test => test.testId === 'create-recipe-memory'
      );

      expect(memoryTest).toBeDefined();
      
      if (memoryTest) {
        const metrics = await memoryTest.execute();
        
        expect(metrics.memoryUsage).toBeDefined();
        expect(metrics.memoryLeakRate).toBeDefined();
        expect(metrics.memoryUsage).toBeGreaterThan(0);
      }
    });

    it('should pass bundle size test', async () => {
      const bundleTest = createRecipePerformanceTestSuite.tests.find(
        test => test.testId === 'create-recipe-bundle-size'
      );

      expect(bundleTest).toBeDefined();
      
      if (bundleTest) {
        const metrics = await bundleTest.execute();
        
        expect(metrics.bundleSize).toBeDefined();
        expect(metrics.loadTime).toBeDefined();
        expect(metrics.bundleSize).toBeGreaterThan(0);
        expect(metrics.loadTime).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance Thresholds', () => {
    it('should fail tests that exceed performance thresholds', async () => {
      // Create a test with very strict thresholds
      const strictTest = {
        testId: 'strict-performance-test',
        testName: 'Strict Performance Test',
        description: 'Test with very strict thresholds',
        thresholds: [
          {
            metric: 'testMetric',
            threshold: 1, // Very low threshold
            unit: 'ms' as const,
            description: 'Should always fail'
          }
        ],
        execute: async () => ({
          testMetric: 100 // Will exceed threshold of 1
        })
      };

      const result = await performanceRegressionTester.runTestSuite({
        suiteId: 'strict-test',
        suiteName: 'Strict Test Suite',
        tests: [strictTest],
        globalThresholds: []
      });

      expect(result).toHaveLength(1);
      expect(result[0].passed).toBe(false);
      expect(result[0].violations.length).toBeGreaterThan(0);
      expect(result[0].violations[0].metric).toBe('testMetric');
    });

    it('should pass tests that meet performance thresholds', async () => {
      // Create a test with lenient thresholds
      const lenientTest = {
        testId: 'lenient-performance-test',
        testName: 'Lenient Performance Test',
        description: 'Test with lenient thresholds',
        thresholds: [
          {
            metric: 'testMetric',
            threshold: 1000, // High threshold
            unit: 'ms' as const,
            description: 'Should always pass'
          }
        ],
        execute: async () => ({
          testMetric: 50 // Well under threshold
        })
      };

      const result = await performanceRegressionTester.runTestSuite({
        suiteId: 'lenient-test',
        suiteName: 'Lenient Test Suite',
        tests: [lenientTest],
        globalThresholds: []
      });

      expect(result).toHaveLength(1);
      expect(result[0].passed).toBe(true);
      expect(result[0].violations.length).toBe(0);
    });
  });

  describe('Quick Performance Check', () => {
    it('should run quick performance check', async () => {
      const result = await runQuickPerformanceCheck();
      
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('issues');
      expect(typeof result.passed).toBe('boolean');
      expect(typeof result.summary).toBe('string');
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Performance Report Generation', () => {
    it('should generate performance report', async () => {
      // Run a test to have some data
      await performanceRegressionTester.runTestSuite(createRecipePerformanceTestSuite);
      
      const report = performanceRegressionTester.generateReport();
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('criticalIssues');
      
      expect(report.summary).toHaveProperty('totalTests');
      expect(report.summary).toHaveProperty('passedTests');
      expect(report.summary).toHaveProperty('failedTests');
      expect(report.summary).toHaveProperty('averageDuration');
      
      expect(Array.isArray(report.trends)).toBe(true);
      expect(Array.isArray(report.criticalIssues)).toBe(true);
    });

    it('should export test results', () => {
      const exportData = performanceRegressionTester.exportResults();
      
      expect(typeof exportData).toBe('string');
      
      const parsed = JSON.parse(exportData);
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('testResults');
      expect(parsed).toHaveProperty('baselines');
      expect(parsed).toHaveProperty('environment');
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect when performance degrades over time', async () => {
      const testId = 'regression-detection-test';
      
      // Set initial good baseline
      performanceRegressionTester.setBaseline(testId, {
        navigationTime: 800,
        renderTime: 12
      });

      // Simulate gradual performance degradation
      const degradedMetrics = {
        navigationTime: 2200, // 175% increase
        renderTime: 28        // 133% increase
      };

      const comparison = performanceRegressionTester.compareWithBaseline(testId, degradedMetrics);
      
      expect(comparison.regressions.length).toBeGreaterThan(0);
      
      // Check that significant regressions are detected
      const navRegression = comparison.regressions.find(r => r.metric === 'navigationTime');
      expect(navRegression).toBeDefined();
      expect(navRegression?.change).toBeGreaterThan(50); // More than 50% regression
    });
  });
});

// Performance test utilities for other test files
export const performanceTestUtils = {
  /**
   * Assert that a function executes within a time limit
   */
  async assertExecutionTime<T>(
    fn: () => Promise<T>,
    maxTime: number,
    description: string
  ): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > maxTime) {
      throw new Error(`${description} took ${duration.toFixed(2)}ms, expected < ${maxTime}ms`);
    }
    
    return result;
  },

  /**
   * Assert that memory usage stays within limits
   */
  assertMemoryUsage(maxMemoryMB: number, description: string): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      
      if (memoryMB > maxMemoryMB) {
        throw new Error(`${description} used ${memoryMB}MB memory, expected < ${maxMemoryMB}MB`);
      }
    }
  },

  /**
   * Create a performance test that can be used in other test suites
   */
  createPerformanceTest: (
    testId: string,
    testName: string,
    thresholds: Array<{ metric: string; threshold: number; unit: string; description: string }>,
    execute: () => Promise<Record<string, number>>
  ) => ({
    testId,
    testName,
    description: `Performance test for ${testName}`,
    thresholds,
    execute
  })
};
