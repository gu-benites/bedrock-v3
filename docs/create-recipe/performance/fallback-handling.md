# Component Preloading Fallback Handling

## Overview

The component preloading system includes comprehensive fallback handling to ensure robust performance even when preloading fails. This document describes the fallback strategies, error handling, and recovery mechanisms.

## Fallback Strategies

### 1. Retry Logic

**Exponential Backoff Retry**
- **Max Retries**: 3 attempts by default
- **Retry Delay**: Exponential backoff (1s, 2s, 4s)
- **Timeout**: 5 seconds per attempt
- **Failure Tracking**: Persistent failure history per component

```typescript
// Configure retry behavior
componentPreloader.configureFallbackStrategy({
  maxRetries: 3,
  retryDelay: 1000,
  fallbackTimeout: 10000,
  enableGracefulDegradation: true
});
```

### 2. Graceful Degradation

When component preloading fails completely, the system provides graceful fallbacks:

#### Synchronous Loading Fallback
```typescript
const fallbackComponent = {
  __fallback: true,
  componentPath: '/path/to/component',
  loadSync: async () => {
    // Load component synchronously at navigation time
    return await import(componentPath);
  }
};
```

#### Error Boundary Fallback
```typescript
const errorBoundaryComponent = {
  __errorBoundary: true,
  componentPath: '/path/to/component',
  error: 'Component failed to load',
  fallbackComponent: () => null // Render nothing instead of crashing
};
```

### 3. Failure Classification

The system categorizes failures for better handling:

- **Timeout Failures**: Component took too long to load
- **Network Failures**: Network connectivity issues
- **Module Failures**: JavaScript module loading errors
- **Resource Failures**: Missing or corrupted files

## Implementation Details

### Failure Tracking

```typescript
interface FailureInfo {
  count: number;        // Number of consecutive failures
  lastFailure: number;  // Timestamp of last failure
  reason: string;       // Error message/reason
}

// Failure tracking per component
const failureTracker = new Map<string, FailureInfo>();
```

### Cooldown Period

Components with repeated failures are temporarily blocked:
- **Cooldown Duration**: 1 minute after max retries exceeded
- **Automatic Reset**: Failure count resets after cooldown
- **Manual Reset**: `clearFailureHistory()` method available

### Resource-Specific Handling

#### Component Preloading
- **Critical**: Uses retry logic and graceful degradation
- **Fallback**: Synchronous loading at navigation time
- **Last Resort**: Error boundary component

#### Asset Preloading (Images, Fonts)
- **Non-Critical**: Failures don't block navigation
- **Retry Logic**: Limited retries with exponential backoff
- **Graceful Failure**: Continue without preloaded assets

#### Stylesheet Preloading
- **Non-Critical**: Failures don't affect functionality
- **Retry Logic**: Limited retries
- **Graceful Failure**: Styles load normally during navigation

## Configuration Options

### FallbackStrategy Interface

```typescript
interface FallbackStrategy {
  maxRetries: number;                    // Maximum retry attempts (default: 3)
  retryDelay: number;                    // Base retry delay in ms (default: 1000)
  fallbackTimeout: number;               // Timeout for fallback operations (default: 10000)
  enableGracefulDegradation: boolean;    // Enable graceful degradation (default: true)
  enableOfflineMode: boolean;            // Enable offline handling (default: true)
}
```

### Usage Examples

```typescript
import { componentPreloader } from '@/lib/preload/component-preloader';

// Configure fallback strategy
componentPreloader.configureFallbackStrategy({
  maxRetries: 5,           // More aggressive retries
  retryDelay: 500,         // Faster retries
  enableGracefulDegradation: true
});

// Get failure statistics
const failureStats = componentPreloader.getFailureStats();
console.log('Failure rate:', failureStats.failureRate);

// Clear failure history
componentPreloader.clearFailureHistory();
```

## Monitoring and Debugging

### Failure Metrics

The system tracks comprehensive failure metrics:

```typescript
interface FailureStats {
  totalFailures: number;        // Total failure count
  componentsWithFailures: number; // Components that have failed
  timeoutFailures: number;      // Failures due to timeout
  networkFailures: number;      // Failures due to network issues
  retryAttempts: number;        // Total retry attempts made
  fallbacksUsed: number;        // Times fallback was used
  failureRate: number;          // Percentage failure rate
}
```

### Debug Logging

The system provides detailed logging for debugging:

```typescript
// Success logs
✅ Component preloaded: /path/to/component (45.2ms)
✅ Component preload succeeded on retry 2: /path/to/component

// Warning logs
⚠️ Component preload attempt 1 failed, retrying in 1000ms: /path/to/component
⚠️ Using fallback for component: /create-recipe/causes

// Error logs
❌ Failed to preload component after 3 attempts: /path/to/component
🚨 Component preload failed completely: /create-recipe/symptoms

// Fallback logs
🔄 Attempting graceful degradation for: /path/to/component
🚨 Loading component synchronously as fallback: /path/to/component
```

### Visual Monitoring

The Prefetch Monitor displays failure statistics:
- **Failure Rate**: Percentage of failed preload attempts
- **Fallbacks Used**: Number of times fallback strategies were employed
- **Retry Attempts**: Total retry attempts across all components
- **Clear History**: Button to reset failure tracking

**Keyboard Shortcut**: `Ctrl+Shift+I` to toggle monitor

## Best Practices

### 1. Error Handling

```typescript
// ✅ Good: Handle preload failures gracefully
try {
  const component = await componentPreloader.preloadComponent(path);
  if (component.__fallback) {
    console.warn('Using fallback component');
  }
} catch (error) {
  // Don't fail the entire operation due to preload failure
  console.warn('Preload failed, will load synchronously:', error);
}

// ❌ Bad: Let preload failures crash the application
const component = await componentPreloader.preloadComponent(path); // Throws on failure
```

### 2. Fallback Configuration

```typescript
// ✅ Good: Configure based on network conditions
if (navigator.connection?.effectiveType === 'slow-2g') {
  componentPreloader.configureFallbackStrategy({
    maxRetries: 1,        // Fewer retries on slow networks
    retryDelay: 2000,     // Longer delays
    enableGracefulDegradation: true
  });
}

// ❌ Bad: Same configuration for all network conditions
componentPreloader.configureFallbackStrategy({
  maxRetries: 5,          // Too aggressive for slow networks
  retryDelay: 100         // Too fast for unreliable connections
});
```

### 3. Monitoring Integration

```typescript
// ✅ Good: Monitor failure rates and adjust strategy
const stats = componentPreloader.getFailureStats();
if (stats.failureRate > 20) {
  // High failure rate, adjust strategy
  componentPreloader.configureFallbackStrategy({
    maxRetries: 1,
    enableGracefulDegradation: true
  });
}

// ✅ Good: Clear failure history periodically
setInterval(() => {
  componentPreloader.clearFailureHistory();
}, 30 * 60 * 1000); // Every 30 minutes
```

## Troubleshooting

### Common Issues

1. **High Failure Rate**
   - Check network connectivity
   - Verify component paths are correct
   - Review browser console for specific errors
   - Consider reducing retry attempts

2. **Excessive Retry Attempts**
   - Components may have persistent issues
   - Check if components exist and are accessible
   - Review failure reasons in debug logs

3. **Fallbacks Not Working**
   - Ensure `enableGracefulDegradation: true`
   - Check if error boundary components are properly configured
   - Verify synchronous loading fallback is working

### Debug Commands

```javascript
// Get detailed failure information
const stats = componentPreloader.getFailureStats();
console.table(stats);

// Get cache statistics including failure history
const cacheStats = componentPreloader.getCacheStats();
console.log('Failure History:', cacheStats.failureHistory);

// Clear all failure tracking
componentPreloader.clearFailureHistory();

// Configure more aggressive fallback strategy
componentPreloader.configureFallbackStrategy({
  maxRetries: 1,
  retryDelay: 500,
  enableGracefulDegradation: true
});
```

## Performance Impact

### Benefits
- **Resilient Navigation**: Users can navigate even when preloading fails
- **Graceful Degradation**: Smooth fallback to synchronous loading
- **Reduced Errors**: Prevents crashes due to preload failures
- **Better UX**: Consistent experience regardless of network conditions

### Overhead
- **Memory**: Minimal overhead for failure tracking
- **CPU**: Small impact from retry logic
- **Network**: Additional requests only during retries
- **Storage**: No persistent storage used for failure tracking

---

**Last Updated**: 2025-06-19  
**Status**: ✅ Implemented and Active  
**Next Review**: 2025-07-19
