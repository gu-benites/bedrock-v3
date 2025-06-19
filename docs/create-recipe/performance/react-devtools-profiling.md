# React DevTools Profiling Integration

## Overview

The React DevTools profiling integration provides comprehensive performance monitoring for React components in the create-recipe workflow. It automatically tracks render performance, identifies slow components, and provides detailed analysis reports.

## Core Features

### 1. Automatic Profiling

**Location**: `src/lib/performance/react-devtools-profiler.ts`

The system automatically tracks React component render performance:

```typescript
import { ReactProfilerWrapper } from '@/components/performance/react-profiler-wrapper';

// Wrap components for automatic profiling
<ReactProfilerWrapper id="ComponentName" logSlowRenders={true}>
  <YourComponent />
</ReactProfilerWrapper>
```

### 2. Profiling Sessions

**Session Management**
- **Auto-start**: Configurable automatic session start
- **Duration**: 30-second sessions by default
- **Storage**: Up to 10 sessions kept in memory
- **Analysis**: Automatic performance analysis on session end

```typescript
import { reactProfiler } from '@/lib/performance/react-devtools-profiler';

// Manual session control
const sessionId = reactProfiler.startProfiling();
// ... perform actions ...
const session = reactProfiler.stopProfiling();
```

### 3. Performance Metrics

**Tracked Metrics**
- **Render Duration**: Actual time spent rendering
- **Base Duration**: Estimated time without optimizations
- **Render Phase**: Mount vs update renders
- **Component Interactions**: User interactions during renders

**Thresholds**
- **Slow Render**: 16ms (60fps threshold)
- **Performance Score**: 0-100 based on multiple factors
- **Warning Triggers**: Automatic warnings for performance issues

## Implementation Guide

### 1. Component Wrapping

```typescript
import { ReactProfilerWrapper, withReactProfiler } from '@/components/performance/react-profiler-wrapper';

// Method 1: Direct wrapping
const MyComponent = () => (
  <ReactProfilerWrapper id="MyComponent">
    <div>Component content</div>
  </ReactProfilerWrapper>
);

// Method 2: Higher-Order Component
const MyComponent = withReactProfiler(
  () => <div>Component content</div>,
  'MyComponent'
);
```

### 2. Manual Profiling Control

```typescript
import { useReactProfiler } from '@/components/performance/react-profiler-wrapper';

const MyComponent = () => {
  const { startProfiling, stopProfiling, generateReport } = useReactProfiler();

  const handleStartProfiling = () => {
    const sessionId = startProfiling('my-session');
    console.log('Started profiling:', sessionId);
  };

  const handleStopAndReport = () => {
    const session = stopProfiling();
    const report = generateReport();
    console.log('Profiling report:', report);
  };

  return (
    <div>
      <button onClick={handleStartProfiling}>Start Profiling</button>
      <button onClick={handleStopAndReport}>Stop & Report</button>
    </div>
  );
};
```

### 3. Profiler Control Panel

**Visual Interface**
- **Keyboard Shortcut**: `Ctrl+Shift+R` to toggle
- **Real-time Status**: Shows recording state and metrics
- **Session Management**: Start/stop sessions, view reports
- **Export Functionality**: Copy session data to clipboard

**Features**
- Session selection dropdown
- Real-time profile count
- Generate performance reports
- Export session data as JSON
- Clear all sessions

## Performance Analysis

### 1. Performance Scoring

The system calculates a performance score (0-100) based on:

```typescript
// Scoring factors
let performanceScore = 100;

// Deduct for slow average render time
if (averageRenderTime > 16ms) {
  performanceScore -= (averageRenderTime - 16) * 2;
}

// Deduct for slow components
performanceScore -= slowComponents.length * 2;

// Deduct for excessive re-renders
if (maxRenders > 10) {
  performanceScore -= (maxRenders - 10) * 3;
}
```

### 2. Automatic Recommendations

The system provides actionable recommendations:

- **High Render Times**: "Consider optimizing render performance"
- **Multiple Slow Components**: "Multiple slow components detected"
- **Excessive Re-renders**: "Excessive re-renders detected"
- **Large Component Count**: "Large number of components rendered"

### 3. Slow Component Detection

Components are flagged as slow when:
- **Render time > 16ms**: Exceeds 60fps threshold
- **Frequent slow renders**: Multiple slow renders in session
- **Mount vs Update**: Different thresholds for mount/update phases

## Integration Points

### 1. Create-Recipe Workflow

**Integrated Components**
- **WizardContainer**: Main workflow container
- **DemographicsForm**: Form component profiling
- **AI Streaming Components**: Performance during streaming
- **Navigation Components**: Route transition profiling

**Profiling Strategy**
```typescript
// Wizard container with comprehensive profiling
<ReactProfilerWrapper id="WizardContainer" logSlowRenders={true}>
  <WizardContainer />
</ReactProfilerWrapper>

// Form components with detailed tracking
<ReactProfilerWrapper id="DemographicsForm" logSlowRenders={true}>
  <DemographicsForm />
</ReactProfilerWrapper>
```

### 2. Development Workflow

**Automatic Integration**
- Profiling enabled only in development mode
- Automatic slow render warnings in console
- Integration with existing performance monitoring
- Keyboard shortcuts for quick access

**Performance Debugging**
```typescript
// Global access in development
window.reactProfiler.startProfiling();
window.reactProfiler.generateReport();
window.reactProfiler.exportSession('session-id');
```

## Configuration Options

### 1. Profiler Configuration

```typescript
interface DevToolsProfilerConfig {
  enabled: boolean;                    // Enable/disable profiling
  autoStart: boolean;                  // Auto-start on load
  sessionDuration: number;             // Session duration (ms)
  slowComponentThreshold: number;      // Slow component threshold (ms)
  maxSessions: number;                 // Max sessions in memory
}

// Configure profiler
reactProfiler.configure({
  enabled: true,
  autoStart: false,
  sessionDuration: 60000,              // 1 minute sessions
  slowComponentThreshold: 20,          // 20ms threshold
  maxSessions: 5                       // Keep 5 sessions
});
```

### 2. Component-Level Options

```typescript
<ReactProfilerWrapper
  id="ComponentName"
  enabled={true}                       // Enable for this component
  logSlowRenders={true}               // Log slow renders to console
  slowRenderThreshold={16}            // Custom threshold for this component
  onRender={(id, phase, duration) => {
    // Custom render callback
    console.log(`${id} rendered in ${duration}ms`);
  }}
>
  <Component />
</ReactProfilerWrapper>
```

## Monitoring and Debugging

### 1. Console Logging

**Automatic Warnings**
```
🐌 Slow render detected: DemographicsForm (update) took 23.45ms
⚠️ High average render time detected: 18.32ms
⚠️ Multiple slow components detected: 7 components
```

**Session Reports**
```
🔍 React profiling started: session-1640995200000
🔍 React profiling stopped: session-1640995200000 {
  duration: 15234,
  totalProfiles: 45,
  totalRenderTime: 234.56,
  slowComponents: 3
}
```

### 2. Performance Reports

**Report Structure**
```typescript
{
  session: {
    sessionId: "session-1640995200000",
    startTime: 1640995200000,
    endTime: 1640995215234,
    profiles: [...],
    componentCounts: Map,
    totalRenderTime: 234.56,
    slowestComponents: [...]
  },
  analysis: {
    totalComponents: 12,
    averageRenderTime: 5.21,
    slowestComponent: { id: "DemographicsForm", duration: 23.45 },
    mostRenderedComponent: { id: "WizardContainer", count: 8 },
    performanceScore: 85,
    recommendations: [...]
  }
}
```

### 3. Export and Analysis

**JSON Export**
```typescript
// Export session data
const sessionData = reactProfiler.exportSession('session-id');

// Copy to clipboard
navigator.clipboard.writeText(sessionData);

// Save to file
const blob = new Blob([sessionData], { type: 'application/json' });
const url = URL.createObjectURL(blob);
```

## Best Practices

### 1. Profiling Strategy

```typescript
// ✅ Good: Profile key components
<ReactProfilerWrapper id="CriticalComponent">
  <CriticalComponent />
</ReactProfilerWrapper>

// ✅ Good: Use descriptive IDs
<ReactProfilerWrapper id="UserForm-Demographics">
  <DemographicsForm />
</ReactProfilerWrapper>

// ❌ Bad: Profile every small component
<ReactProfilerWrapper id="Button">
  <button>Click me</button>
</ReactProfilerWrapper>
```

### 2. Performance Optimization

```typescript
// ✅ Good: Use profiling to identify issues
const report = reactProfiler.generateReport();
if (report.analysis.performanceScore < 70) {
  // Investigate slow components
  console.log('Slow components:', report.analysis.slowestComponent);
}

// ✅ Good: Profile during critical operations
reactProfiler.startProfiling('ai-streaming-session');
// ... perform AI streaming ...
const session = reactProfiler.stopProfiling();
```

### 3. Development Workflow

```typescript
// ✅ Good: Use keyboard shortcuts for quick profiling
// Ctrl+Shift+R to toggle profiler panel

// ✅ Good: Regular performance audits
setInterval(() => {
  const report = reactProfiler.generateReport();
  if (report?.analysis.performanceScore < 80) {
    console.warn('Performance degradation detected');
  }
}, 30000);
```

## Troubleshooting

### Common Issues

1. **Profiler Not Recording**
   - Check if `enabled: true` in configuration
   - Verify development mode is active
   - Ensure components are wrapped with ReactProfilerWrapper

2. **Missing Performance Data**
   - Start profiling session before testing
   - Check session duration hasn't expired
   - Verify component IDs are unique

3. **High Memory Usage**
   - Reduce `maxSessions` in configuration
   - Clear sessions regularly with `clearSessions()`
   - Limit session duration for long-running tests

### Debug Commands

```javascript
// Check profiler status
console.log(reactProfiler.getStatus());

// Get all sessions
console.log(reactProfiler.getAllSessions());

// Generate report for latest session
console.log(reactProfiler.generateReport());

// Clear all data
reactProfiler.clearSessions();
```

---

**Last Updated**: 2025-06-19  
**Status**: ✅ Implemented and Active  
**Next Review**: 2025-07-19
