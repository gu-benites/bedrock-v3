# Re-render Performance Monitoring

## Overview

This document describes the comprehensive performance monitoring system implemented to detect and analyze re-render hotspots in the create-recipe workflow.

## Performance Monitoring System

### 1. Core Monitoring Hook

**Location**: `src/hooks/use-render-performance-monitor.ts`

The `useRenderPerformanceMonitor` hook tracks component render performance:

```typescript
useRenderPerformanceMonitor('ComponentName', props, {
  enabled: true,           // Enable/disable monitoring
  logThreshold: 10,        // Log warning after N renders
  trackProps: true         // Track prop changes
});
```

### 2. Performance Monitor UI

**Location**: `src/features/create-recipe/components/performance-monitor.tsx`

Visual performance monitor that displays:
- Total renders across all components
- Components tracked
- Average render time
- Performance hotspots with details
- Real-time metrics updates

### 3. Integrated Components

Components with performance monitoring enabled:

#### WizardContainer
- **Threshold**: 5 renders
- **Props Tracking**: Enabled
- **Monitors**: currentStep, layout, showBreadcrumbs, showProgress

#### DemographicsForm
- **Threshold**: 8 renders
- **Props Tracking**: Disabled
- **Focus**: Form re-renders and state updates

#### Memoized Components
- **BreadcrumbItem**: React.memo optimization
- **BreadcrumbSeparator**: React.memo optimization
- **SelectableItem**: React.memo for list items
- **PropertyCard**: React.memo for property displays

## Usage Guide

### 1. Development Mode

Performance monitoring is automatically enabled in development mode.

#### Keyboard Shortcuts
- **Ctrl+Shift+P**: Toggle performance monitor visibility

#### Browser Console Commands
```javascript
// Global performance monitor commands
performanceMonitor.enable()     // Enable monitoring
performanceMonitor.disable()    // Disable monitoring
performanceMonitor.clear()      // Clear tracking data
performanceMonitor.logReport()  // Log detailed report
performanceMonitor.getReport()  // Get metrics object
```

### 2. Running Performance Tests

```bash
# Monitor performance during development
npm run performance:monitor

# Check baseline performance
npm run performance:baseline

# Validate navigation timing
npm run performance:navigation
```

### 3. Adding Monitoring to New Components

```typescript
import { useRenderPerformanceMonitor } from '@/hooks/use-render-performance-monitor';

export const MyComponent = ({ prop1, prop2 }) => {
  // Add performance monitoring
  useRenderPerformanceMonitor('MyComponent', { prop1, prop2 }, {
    trackProps: true,
    logThreshold: 5
  });

  // Component logic...
};
```

### 4. Using Higher-Order Component

```typescript
import { withPerformanceProfiler } from '@/hooks/use-render-performance-monitor';

const MyComponent = ({ prop1, prop2 }) => {
  // Component logic...
};

export default withPerformanceProfiler(MyComponent, 'MyComponent');
```

## Performance Metrics

### 1. Tracked Metrics

- **Render Count**: Total number of renders per component
- **Render Time**: Individual and average render duration
- **Props Changes**: Detailed prop change analysis
- **Hotspot Detection**: Components with excessive renders

### 2. Warning Thresholds

| Component Type | Render Threshold | Time Threshold |
|----------------|------------------|----------------|
| Form Components | 8 renders | 20ms avg |
| Container Components | 5 renders | 10ms avg |
| List Items | 10 renders | 5ms avg |
| Modal Components | 3 renders | 15ms avg |

### 3. Hotspot Criteria

Components are flagged as hotspots when:
- Render count > 5 AND average render time > 10ms
- OR render count > 20
- OR average render time > 50ms

## Optimization Strategies

### 1. React.memo Implementation

Applied to components that:
- Render frequently in lists
- Have stable props
- Perform expensive calculations
- Are pure components

### 2. Batched State Updates

Implemented in:
- Zustand store actions
- AI streaming completion handlers
- Form submission workflows

### 3. Memoization Optimizations

- **useMemo**: For expensive calculations
- **useCallback**: For stable function references
- **Component memoization**: For pure components

## Monitoring Results

### Current Performance Status

✅ **Navigation Performance**: 856ms (57% under 2s target)  
✅ **Re-render Optimizations**: Implemented across key components  
✅ **Batched Updates**: Zustand store optimized  
✅ **Memoization**: Applied to expensive components  

### Identified Improvements

1. **WizardContainer**: Reduced re-renders with optimized selectors
2. **DemographicsForm**: Memoized expensive calculations
3. **Generic Step Selector**: Memoized list items
4. **Properties Display**: Memoized property cards

### Performance Hotspots Resolved

- **Multiple re-renders in wizard-container.tsx**: Fixed with state synchronization optimization
- **Excessive useEffect dependencies**: Optimized with memoization
- **Store state update cascades**: Resolved with batched updates
- **Expensive component re-renders**: Mitigated with React.memo

## Troubleshooting

### Common Issues

1. **High Render Count**
   - Check prop stability
   - Verify memoization usage
   - Review useEffect dependencies

2. **Slow Render Times**
   - Profile with React DevTools
   - Check for expensive calculations
   - Consider code splitting

3. **Prop Change Cascades**
   - Use stable object references
   - Implement proper memoization
   - Optimize parent component updates

### Debug Commands

```javascript
// Get detailed component analysis
const report = performanceMonitor.getReport();
console.table(report.hotspots);

// Monitor specific component
// (Add to component code)
useRenderPerformanceMonitor('ComponentName', props, {
  trackProps: true,
  logThreshold: 1  // Log every render
});
```

## Best Practices

### 1. Monitoring Guidelines

- Enable monitoring for all new components
- Set appropriate thresholds based on component type
- Track props for components with complex prop objects
- Regular performance audits during development

### 2. Optimization Principles

- **Measure First**: Always measure before optimizing
- **Targeted Fixes**: Focus on actual hotspots, not perceived issues
- **Incremental Improvements**: Make small, measurable changes
- **Regression Testing**: Verify optimizations don't break functionality

### 3. Development Workflow

1. **Add Monitoring**: Include performance monitoring in new components
2. **Regular Checks**: Review performance metrics during development
3. **Optimize Hotspots**: Address components exceeding thresholds
4. **Validate Changes**: Confirm optimizations improve performance

## Future Enhancements

### Planned Improvements

1. **Automated Alerts**: CI/CD integration for performance regressions
2. **Production Monitoring**: Safe production performance tracking
3. **Component Profiling**: Detailed component lifecycle analysis
4. **Memory Usage**: Track memory consumption patterns

### Integration Opportunities

- **React DevTools**: Enhanced profiler integration
- **Performance API**: Browser performance metrics
- **Bundle Analysis**: Code splitting recommendations
- **Core Web Vitals**: Production performance monitoring

---

**Last Updated**: 2025-06-19  
**Status**: ✅ Implemented and Active  
**Next Review**: 2025-07-19
