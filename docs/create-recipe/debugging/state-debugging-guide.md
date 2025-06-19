# State Debugging Guide

## Overview

This guide covers the comprehensive state debugging tools implemented for the create-recipe workflow. These tools help developers track, monitor, and debug state changes in real-time during development.

## State Change Monitor

### Core Features

**Location**: `src/lib/debug/state-change-monitor.ts`

The State Change Monitor provides:
- **Real-time state change tracking**
- **Diff calculation** between previous and new states
- **Performance monitoring** for state changes
- **Stack trace capture** for debugging
- **Time travel debugging** with state snapshots
- **Export/import** functionality for debugging sessions

### Basic Usage

```typescript
import { stateChangeMonitor } from '@/lib/debug/state-change-monitor';

// Monitor is automatically enabled in development
// Manual recording (usually done by middleware)
stateChangeMonitor.recordStateChange(
  'recipe-store',           // Store name
  'updateDemographics',     // Action name
  previousState,            // Previous state
  newState,                 // New state
  'DemographicsForm'        // Component name (optional)
);

// Get all changes
const changes = stateChangeMonitor.getChanges();

// Get filtered changes
const filteredChanges = stateChangeMonitor.getChanges({
  storeName: 'recipe-store',
  action: 'updateSelectedCauses',
  timeRange: { start: Date.now() - 60000, end: Date.now() }
});

// Get performance metrics
const metrics = stateChangeMonitor.getPerformanceMetrics();
```

### Automatic Integration

The monitor is automatically integrated into Zustand stores using middleware:

```typescript
// Automatically applied to recipe store
export const useRecipeStore = create<RecipeStore>()(
  stateMonitoringMiddleware('recipe-store')(
    (set, get) => ({
      // Store implementation
    })
  )
);
```

## Visual State Debug Panel

### Access Methods

**Keyboard Shortcut**: `Ctrl+Shift+S`

**Manual Toggle**: Click the debug button (🔍) in the bottom-right corner

### Panel Features

#### 1. Real-time Change Tracking
- **Live updates** of state changes as they occur
- **Pause/Resume** monitoring to freeze the view
- **Auto-scroll** to latest changes
- **Change counter** with visual indicators

#### 2. Filtering and Search
```typescript
// Available filters
- Store Name: Filter by specific store (e.g., 'recipe-store')
- Action: Filter by action type (e.g., 'updateDemographics')
- Component: Filter by triggering component
- Time Range: Filter by time period
```

#### 3. Change Details View
- **Diff visualization** showing before/after values
- **Timestamp** information
- **Component context** if available
- **Stack trace** for debugging

#### 4. Export/Import Functionality
- **Export** debugging session to JSON
- **Import** previous debugging sessions
- **Share** debugging data with team members

## State Change Types

### Recipe Store Changes

#### Demographics Updates
```typescript
// Action: updateDemographics
// Typical diff:
{
  "demographics": {
    "from": null,
    "to": {
      "ageCategory": "adult",
      "gender": "female",
      "language": "english"
    }
  },
  "lastUpdated": {
    "from": "2025-06-19T10:30:00.000Z",
    "to": "2025-06-19T10:31:00.000Z"
  }
}
```

#### Causes Selection
```typescript
// Action: updateSelectedCauses
// Typical diff:
{
  "selectedCauses": {
    "from": [],
    "to": [
      {
        "cause_id": "stress-001",
        "cause_name": "Chronic Stress",
        "relevancy_score": 4.2
      }
    ]
  },
  "selectedSymptoms": {
    "from": [...],
    "to": [] // Cleared when causes change
  }
}
```

#### Streaming State Changes
```typescript
// Action: setStreamingCauses
// Typical diff:
{
  "isStreamingCauses": {
    "from": false,
    "to": true
  },
  "streamingError": {
    "from": "Previous error",
    "to": null
  }
}
```

### Component State Changes

#### Form State Updates
```typescript
// Component: DemographicsForm
// Action: setState
// Typical diff:
{
  "formData": {
    "from": { "ageCategory": "" },
    "to": { "ageCategory": "adult" }
  },
  "errors": {
    "from": { "ageCategory": "Required" },
    "to": {}
  }
}
```

## Performance Monitoring

### Metrics Tracked

```typescript
interface PerformanceMetrics {
  stateChangeCount: number;           // Total changes recorded
  averageChangeTime: number;          // Average processing time
  slowestChanges: StateChange[];      // Changes that took longest
  frequentActions: Map<string, number>; // Most frequent actions
  renderTriggers: Map<string, number>;  // Components triggering most changes
}
```

### Performance Alerts

The monitor automatically logs warnings for:
- **Slow state changes** (>5ms processing time)
- **Frequent state changes** (>10 changes per second)
- **Large state diffs** (>10 changed fields)

```typescript
// Example console output
🐌 Slow state change: recipe-store.updateTherapeuticProperties took 12.34ms
⚠️ Frequent changes detected: recipe-store.setStreamingCauses (15 changes in 1s)
📊 Large diff detected: recipe-store.updateSelectedCauses (12 fields changed)
```

## Debugging Workflows

### 1. Tracking State Flow

**Problem**: Understanding how state flows through the application

**Solution**:
1. Open State Debug Panel (`Ctrl+Shift+S`)
2. Filter by store name: `recipe-store`
3. Perform the action you want to track
4. Review the sequence of state changes
5. Click on individual changes to see detailed diffs

### 2. Finding Performance Issues

**Problem**: Identifying slow or frequent state updates

**Solution**:
1. Monitor performance metrics in the panel
2. Look for red-highlighted slow changes
3. Check the "Most Frequent Actions" section
4. Export data for detailed analysis

### 3. Debugging Component Re-renders

**Problem**: Components re-rendering unexpectedly

**Solution**:
1. Filter by component name
2. Track which state changes trigger re-renders
3. Look for unnecessary state updates
4. Cross-reference with React DevTools Profiler

### 4. Time Travel Debugging

**Problem**: Need to see state at a specific point in time

**Solution**:
```typescript
// Get state at specific timestamp
const pastState = stateChangeMonitor.getStateAtTime(
  'recipe-store', 
  timestamp
);

// Get all snapshots for a store
const snapshots = stateChangeMonitor.getSnapshots('recipe-store');
```

## Best Practices

### 1. Meaningful Action Names

```typescript
// ✅ Good: Descriptive action names
updateSelectedCauses
setStreamingError
markStepCompleted

// ❌ Bad: Generic action names
setState
update
change
```

### 2. Component Context

```typescript
// ✅ Good: Include component context
stateChangeMonitor.recordStateChange(
  'recipe-store',
  'updateDemographics',
  prevState,
  newState,
  'DemographicsForm' // Component context
);

// ❌ Bad: No component context
stateChangeMonitor.recordStateChange(
  'recipe-store',
  'updateDemographics',
  prevState,
  newState
  // Missing component context
);
```

### 3. Filtering for Focus

```typescript
// ✅ Good: Use filters to focus on specific issues
const causesChanges = stateChangeMonitor.getChanges({
  storeName: 'recipe-store',
  action: 'updateSelectedCauses'
});

// ✅ Good: Time-based filtering for recent issues
const recentChanges = stateChangeMonitor.getChanges({
  timeRange: { 
    start: Date.now() - 60000, // Last minute
    end: Date.now() 
  }
});
```

### 4. Export for Analysis

```typescript
// Export debugging session for analysis
const debugData = stateChangeMonitor.export();

// Analyze patterns
const actionFrequency = debugData.metrics.frequentActions;
const slowChanges = debugData.metrics.slowestChanges;

// Share with team
console.log('Debug session data:', debugData);
```

## Integration with Other Tools

### React DevTools

The state monitor complements React DevTools by:
- **Providing state context** for component re-renders
- **Tracking state flow** across component boundaries
- **Identifying performance bottlenecks** in state updates

### Performance Monitors

Works alongside other performance tools:
- **React Profiler**: Component render performance
- **Memo Monitor**: React.memo effectiveness
- **Calculation Monitor**: useMemo performance
- **State Monitor**: State change performance

### Console Debugging

Automatic console logging in development:
```typescript
// Automatic console output for state changes
🔄 State Change: recipe-store.updateDemographics
📊 Diff: { demographics: { from: null, to: {...} } }
⏰ Timestamp: 2025-06-19T10:31:00.000Z
🧩 Component: DemographicsForm
```

## Troubleshooting

### Common Issues

#### 1. Monitor Not Recording Changes
**Symptoms**: No changes appear in the debug panel
**Solutions**:
- Verify development environment (`NODE_ENV === 'development'`)
- Check if monitoring is enabled: `stateChangeMonitor.setEnabled(true)`
- Ensure middleware is properly applied to stores

#### 2. Performance Impact
**Symptoms**: Application feels slower with monitoring enabled
**Solutions**:
- Monitoring is automatically disabled in production
- Reduce history size: `stateChangeMonitor.maxHistorySize = 500`
- Use filtering to reduce data volume

#### 3. Missing Component Context
**Symptoms**: Changes show without component information
**Solutions**:
- Ensure components use the monitoring hooks
- Add component names to manual recordings
- Check middleware integration

### Debug Commands

```javascript
// Global access to monitor
window.stateChangeMonitor

// Check monitoring status
console.log('Monitoring enabled:', stateChangeMonitor.isEnabled);

// Get current metrics
console.log('Metrics:', stateChangeMonitor.getPerformanceMetrics());

// Clear all data
stateChangeMonitor.clear();

// Export current session
const data = stateChangeMonitor.export();
console.log('Session data:', data);
```

## Advanced Features

### Custom Middleware

Create custom monitoring middleware for other stores:

```typescript
import { stateMonitoringMiddleware } from '@/lib/debug/state-change-monitor';

export const useCustomStore = create()(
  stateMonitoringMiddleware('custom-store')(
    (set, get) => ({
      // Store implementation
    })
  )
);
```

### Selective Monitoring

Monitor only specific actions:

```typescript
const monitoredSet = (partial: any, replace?: boolean) => {
  const actionName = getCurrentActionName(); // Custom logic
  
  if (shouldMonitorAction(actionName)) {
    // Record state change
    stateChangeMonitor.recordStateChange(/* ... */);
  }
  
  return originalSet(partial, replace);
};
```

### Integration with Testing

Use monitoring data in tests:

```typescript
// Test helper
const getStateChanges = (actionName: string) => {
  return stateChangeMonitor.getChanges({ action: actionName });
};

// In tests
it('should update demographics correctly', () => {
  // Perform action
  updateDemographics(testData);
  
  // Verify state change
  const changes = getStateChanges('updateDemographics');
  expect(changes).toHaveLength(1);
  expect(changes[0].diff.demographics.to).toEqual(testData);
});
```

---

**Last Updated**: 2025-06-19  
**Status**: ✅ Implemented and Active  
**Next Review**: 2025-07-19
