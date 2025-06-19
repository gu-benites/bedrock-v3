# Performance Regression Testing Suite

## Overview

The performance regression testing suite provides automated detection of performance degradations in the create-recipe workflow. It includes comprehensive test suites, baseline comparisons, and CI/CD integration for continuous performance monitoring.

## Core Components

### 1. Performance Regression Tester

**Location**: `src/lib/testing/performance-regression-tester.ts`

The main testing engine that manages test execution, threshold validation, and result analysis:

```typescript
import { performanceRegressionTester } from '@/lib/testing/performance-regression-tester';

// Run a complete test suite
const results = await performanceRegressionTester.runTestSuite(testSuite);

// Set performance baselines
performanceRegressionTester.setBaseline('test-id', { navigationTime: 800 });

// Compare with baseline
const comparison = performanceRegressionTester.compareWithBaseline('test-id', currentMetrics);
```

### 2. Create Recipe Test Suite

**Location**: `src/lib/testing/create-recipe-performance-tests.ts`

Specific performance tests for the create-recipe workflow:

- **Navigation Performance**: Route transition timing
- **Component Render**: React component render performance
- **AI Streaming**: AI streaming startup and throughput
- **Memory Usage**: Memory consumption and leak detection
- **Bundle Size**: JavaScript bundle size and loading

### 3. Visual Test Runner

**Location**: `src/components/testing/performance-test-runner.tsx`

Interactive UI for running and monitoring performance tests:

- **Keyboard Shortcut**: `Ctrl+Shift+U` to toggle
- **Quick Check**: Fast performance validation
- **Full Suite**: Complete test execution
- **Results Display**: Visual test results and metrics

## Performance Thresholds

### Default Thresholds

```typescript
const defaultThresholds = [
  {
    metric: 'navigationTime',
    threshold: 2000,        // 2 seconds max navigation
    unit: 'ms',
    description: 'Maximum navigation time between steps'
  },
  {
    metric: 'componentRenderTime',
    threshold: 16,          // 60fps threshold
    unit: 'ms',
    description: 'Maximum component render time'
  },
  {
    metric: 'aiStreamingStartTime',
    threshold: 3000,        // 3 seconds max startup
    unit: 'ms',
    description: 'Maximum time to start AI streaming'
  },
  {
    metric: 'memoryUsage',
    threshold: 100,         // 100MB max memory
    unit: 'mb',
    description: 'Maximum memory usage'
  },
  {
    metric: 'rerenderCount',
    threshold: 5,           // Max 5 re-renders
    unit: 'count',
    description: 'Maximum re-renders per component'
  }
];
```

### Custom Thresholds

```typescript
const customTest: PerformanceTest = {
  testId: 'custom-test',
  testName: 'Custom Performance Test',
  thresholds: [
    {
      metric: 'customMetric',
      threshold: 500,
      unit: 'ms',
      description: 'Custom performance requirement'
    }
  ],
  execute: async () => {
    // Test implementation
    return { customMetric: 450 };
  }
};
```

## Test Implementation

### 1. Creating Performance Tests

```typescript
import { PerformanceTest, measurePerformance } from '@/lib/testing/performance-regression-tester';

const myPerformanceTest: PerformanceTest = {
  testId: 'my-test',
  testName: 'My Performance Test',
  description: 'Tests specific functionality performance',
  thresholds: [
    {
      metric: 'executionTime',
      threshold: 1000,
      unit: 'ms',
      description: 'Should execute within 1 second'
    }
  ],
  setup: async () => {
    // Optional setup code
    console.log('Setting up test...');
  },
  execute: async () => {
    const { duration } = await measurePerformance(async () => {
      // Your test code here
      await someAsyncOperation();
    }, 'Test Operation');

    return {
      executionTime: duration,
      // Add more metrics as needed
    };
  },
  cleanup: async () => {
    // Optional cleanup code
    console.log('Cleaning up test...');
  }
};
```

### 2. Running Test Suites

```typescript
import { createRecipePerformanceTestSuite } from '@/lib/testing/create-recipe-performance-tests';

// Run the complete suite
const results = await performanceRegressionTester.runTestSuite(createRecipePerformanceTestSuite);

// Check results
const passedTests = results.filter(r => r.passed).length;
const totalTests = results.length;

console.log(`${passedTests}/${totalTests} tests passed`);

// Get detailed report
const report = performanceRegressionTester.generateReport();
console.log('Performance Report:', report);
```

### 3. Baseline Management

```typescript
// Set baseline after optimizations
performanceRegressionTester.setBaseline('navigation-test', {
  navigationTime: 800,
  componentRenderTime: 12,
  memoryUsage: 45
});

// Compare current performance with baseline
const currentMetrics = {
  navigationTime: 1200,
  componentRenderTime: 18,
  memoryUsage: 52
};

const comparison = performanceRegressionTester.compareWithBaseline('navigation-test', currentMetrics);

// Check for regressions
if (comparison.regressions.length > 0) {
  console.warn('Performance regressions detected:', comparison.regressions);
}

// Check for improvements
if (comparison.improvements.length > 0) {
  console.log('Performance improvements detected:', comparison.improvements);
}
```

## CI/CD Integration

### 1. Jest Test Integration

**Location**: `__tests__/performance/create-recipe-performance.test.ts`

Automated tests that run in CI/CD pipelines:

```bash
# Run performance tests
npm test -- __tests__/performance/

# Run with coverage
npm test -- __tests__/performance/ --coverage

# Run in CI mode
npm test -- __tests__/performance/ --ci --watchAll=false
```

### 2. GitHub Actions Integration

```yaml
# .github/workflows/performance-tests.yml
name: Performance Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  performance-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run performance tests
        run: npm test -- __tests__/performance/ --ci --watchAll=false
      
      - name: Upload performance report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: performance-report.json
```

### 3. Performance Budgets

```typescript
// performance-budget.config.ts
export const performanceBudgets = {
  navigation: {
    maxTime: 2000,        // 2 seconds
    warningTime: 1500     // Warning at 1.5 seconds
  },
  rendering: {
    maxTime: 16,          // 60fps
    warningTime: 12       // Warning at 12ms
  },
  memory: {
    maxUsage: 100,        // 100MB
    warningUsage: 80      // Warning at 80MB
  },
  bundle: {
    maxSize: 500,         // 500KB
    warningSize: 400      // Warning at 400KB
  }
};
```

## Monitoring and Alerting

### 1. Performance Reports

```typescript
// Generate comprehensive report
const report = performanceRegressionTester.generateReport();

console.log('Performance Summary:', {
  totalTests: report.summary.totalTests,
  passedTests: report.summary.passedTests,
  failedTests: report.summary.failedTests,
  averageDuration: report.summary.averageDuration
});

// Check trends
report.trends.forEach(trend => {
  if (trend.trend === 'degrading') {
    console.warn(`⚠️ Performance degrading: ${trend.testName} (${trend.changePercent.toFixed(1)}%)`);
  }
});

// Review critical issues
report.criticalIssues.forEach(issue => {
  console.error(`❌ Critical issue: ${issue.description}`);
});
```

### 2. Automated Alerts

```typescript
// performance-monitor.ts
export const checkPerformanceAlerts = async () => {
  const quickCheck = await runQuickPerformanceCheck();
  
  if (!quickCheck.passed) {
    // Send alert (email, Slack, etc.)
    await sendPerformanceAlert({
      summary: quickCheck.summary,
      issues: quickCheck.issues,
      timestamp: new Date().toISOString()
    });
  }
};

// Run every hour
setInterval(checkPerformanceAlerts, 60 * 60 * 1000);
```

### 3. Dashboard Integration

```typescript
// Export data for external dashboards
const exportData = performanceRegressionTester.exportResults();

// Send to monitoring service
await fetch('/api/performance-metrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: exportData
});
```

## Best Practices

### 1. Test Design

```typescript
// ✅ Good: Specific, measurable tests
const goodTest: PerformanceTest = {
  testId: 'demographics-form-render',
  testName: 'Demographics Form Render Performance',
  thresholds: [
    { metric: 'renderTime', threshold: 16, unit: 'ms', description: '60fps render' }
  ],
  execute: async () => {
    // Specific test implementation
    return { renderTime: 12 };
  }
};

// ❌ Bad: Vague, unmeasurable tests
const badTest: PerformanceTest = {
  testId: 'general-performance',
  testName: 'General Performance',
  thresholds: [],
  execute: async () => ({ performance: 'good' })
};
```

### 2. Threshold Setting

```typescript
// ✅ Good: Realistic, evidence-based thresholds
const realisticThresholds = [
  { metric: 'navigationTime', threshold: 2000, unit: 'ms', description: 'Based on user research' },
  { metric: 'renderTime', threshold: 16, unit: 'ms', description: '60fps standard' }
];

// ❌ Bad: Arbitrary or too strict thresholds
const arbitraryThresholds = [
  { metric: 'navigationTime', threshold: 100, unit: 'ms', description: 'Unrealistic' },
  { metric: 'renderTime', threshold: 1, unit: 'ms', description: 'Too strict' }
];
```

### 3. Baseline Management

```typescript
// ✅ Good: Regular baseline updates after optimizations
const updateBaselines = async () => {
  const results = await performanceRegressionTester.runTestSuite(testSuite);
  
  results.forEach(result => {
    if (result.passed) {
      performanceRegressionTester.setBaseline(result.testId, result.metrics);
    }
  });
};

// Run after performance optimizations
await updateBaselines();
```

## Troubleshooting

### Common Issues

1. **Tests Failing in CI but Passing Locally**
   - Check environment differences (CPU, memory, network)
   - Adjust thresholds for CI environment
   - Use relative performance comparisons

2. **Flaky Performance Tests**
   - Run tests multiple times and average results
   - Increase threshold tolerances
   - Isolate tests from external dependencies

3. **Memory Leaks in Tests**
   - Implement proper cleanup in test teardown
   - Monitor memory usage trends
   - Use memory profiling tools

### Debug Commands

```javascript
// Check current performance status
const status = await runQuickPerformanceCheck();
console.log('Performance Status:', status);

// Get detailed test results
const results = performanceRegressionTester.getAllTestResults();
console.log('All Test Results:', results);

// Generate and export report
const report = performanceRegressionTester.generateReport();
console.log('Performance Report:', report);

// Clear all data and start fresh
performanceRegressionTester.clearResults();
```

---

**Last Updated**: 2025-06-19  
**Status**: ✅ Implemented and Active  
**Next Review**: 2025-07-19
