# Create Recipe Performance Optimization Guide

## Overview

This document covers performance optimization for the Create Recipe workflow, specifically addressing navigation delays and development mode performance issues.

## 🚨 Critical Performance Issue: Navigation Delays

### **Problem Identified**
During development, navigation between recipe steps was taking 57+ seconds, causing poor user experience and development workflow issues.

### **Root Cause Analysis**
The issue was **NOT** related to re-renders or state management logic, but rather **development mode performance bottlenecks**:

1. **Sentry Webpack Plugin**: Heavy overhead in development mode
2. **Missing Turbopack Optimization**: Not using Next.js's faster build system
3. **Inefficient Webpack Configuration**: Default settings not optimized for development
4. **Router Performance**: Lack of prefetching and suboptimal navigation strategy

### **Timeline Evidence**
```
BEFORE Optimization:
🌐 [2025-06-15T02:58:16.144Z] Navigation: Pushing to URL
...
[2025-06-15T02:59:13.041Z] DashboardLayout (Server): Start
⏱️ 57 seconds delay

AFTER Optimization:
🌐 [2025-06-15T03:07:42.423Z] Navigation: Pushing to URL
...
[2025-06-15T03:07:43.279Z] DashboardLayout (Server): Start
⏱️ 0.856 seconds (66x faster!)
```

## ✅ Solutions Implemented

### **1. Next.js Configuration Optimization**

**File**: `next.config.ts`

```typescript
// Development performance optimizations
...(process.env.NODE_ENV === 'development' && {
  turbopack: {
    // Enable Turbopack for faster development builds
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Optimize webpack for development
  webpack: (config: any, { dev, isServer }: any) => {
    if (dev && !isServer) {
      // Reduce bundle analysis overhead in development
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
      
      // Faster source maps for development
      config.devtool = 'eval-cheap-module-source-map';
    }
    return config;
  },
}),
```

### **2. Sentry Development Optimization**

```typescript
// Only enable Sentry in production to improve development performance
export default process.env.NODE_ENV === 'production' 
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
```

### **3. Router Navigation Optimization**

**File**: `src/features/create-recipe/hooks/use-recipe-navigation.ts`

```typescript
// Prefetch the route for faster navigation
router.prefetch(url);

// Use replace instead of push for smoother navigation in development
if (process.env.NODE_ENV === 'development') {
  router.replace(url);
} else {
  router.push(url);
}
```

### **4. State Synchronization Fix**

**File**: `src/features/create-recipe/components/wizard-container.tsx`

```typescript
// Only sync if the URL step is different from store AND we're not already navigating
// This prevents the synchronization loop that causes multiple re-renders
if (currentStep && currentStep !== storeCurrentStep && !isLoading) {
  setCurrentStep(currentStep);
}
```

## 📊 Performance Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Navigation Time | 57 seconds | 0.856 seconds | **66x faster** |
| User Experience | Unusable | Smooth | ✅ Fixed |
| Development Workflow | Blocked | Efficient | ✅ Fixed |
| Re-render Impact | Noticeable | Negligible | ✅ Fixed |

## 🔧 Troubleshooting Performance Issues

### **Symptoms of Performance Problems**
- Navigation taking 30+ seconds
- Multiple "Fast Refresh rebuilding" messages
- High CPU usage during development
- Slow page transitions

### **Diagnostic Steps**

1. **Check Navigation Timing**:
   ```javascript
   // Look for these logs in browser console
   🌐 [timestamp] Navigation: Pushing to URL
   // vs
   [timestamp] DashboardLayout (Server): Start
   ```

2. **Monitor Development Server**:
   - Watch for excessive compilation times
   - Check for Sentry-related overhead
   - Monitor webpack build times

3. **Verify Optimizations**:
   ```bash
   # Check if Turbopack is enabled
   npm run dev
   # Should see: "using Turbopack" in startup logs
   ```

### **Common Fixes**

1. **Restart Development Server** after config changes
2. **Clear Next.js Cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```
3. **Check Environment Variables** for Sentry configuration
4. **Verify Node.js Version** (use latest LTS)

## 🚀 Best Practices

### **Development Mode**
- Always use Turbopack for faster builds
- Disable Sentry in development
- Use optimized webpack configuration
- Implement router prefetching

### **Production Mode**
- Enable all optimizations
- Use Sentry for error tracking
- Implement proper caching strategies
- Monitor performance metrics

### **Debugging Performance**
- Add timestamps to navigation logs
- Monitor state synchronization patterns
- Use React DevTools for component analysis
- Profile webpack build times

## 📝 Implementation Notes

### **Why This Approach Works**
1. **Turbopack**: Next.js's faster build system reduces compilation time
2. **Sentry Removal**: Eliminates webpack plugin overhead in development
3. **Webpack Optimization**: Reduces bundle analysis and optimization overhead
4. **Router Strategy**: Prefetching and replace() provide smoother navigation

### **Production Considerations**
- All optimizations are development-only
- Production builds maintain full Sentry integration
- Performance monitoring remains active in production
- Caching strategies are preserved

## 🔍 Related Documentation

- [Troubleshooting Guide](./troubleshooting.md) - General debugging
- [Implementation Lessons Learned](./implementation-lessons-learned.md) - Development patterns
- [AI Streaming Architecture](./ai-streaming-architecture.md) - System overview

## 📈 Future Optimizations

### **Potential Improvements**
- Implement service worker caching
- Add route-level code splitting
- Optimize bundle size analysis
- Implement progressive loading

### **Monitoring**
- Add performance metrics collection
- Implement navigation timing APIs
- Monitor Core Web Vitals
- Track user experience metrics

---

**Last Updated**: 2025-06-15  
**Performance Improvement**: 66x faster navigation  
**Status**: ✅ Resolved
