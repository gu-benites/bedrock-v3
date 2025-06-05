# Authentication Optimization Testing Guide

This guide provides step-by-step instructions for testing the authentication optimization in development and deploying gradually to production.

## 🧪 Development Testing

### Prerequisites

1. **Environment Variables** (add to `.env.local`):
```bash
NEXT_PUBLIC_DEBUG_AUTH=true
NEXT_PUBLIC_DEBUG_LOADING=true
NEXT_PUBLIC_DEBUG=true
NODE_ENV=development
```

2. **Browser DevTools Setup**:
   - Open Chrome/Firefox DevTools
   - Go to Console tab to see debug logs
   - Go to Network tab to monitor requests
   - Go to Application tab to check localStorage/cookies

### Phase 1: Core Services Testing

#### Test 1.1: Auth State Service
```bash
# Start development server
npm run dev

# Test scenarios:
# 1. Visit homepage without authentication
# 2. Check console for: "[AuthStateService] User not authenticated"
# 3. Sign in with valid credentials
# 4. Check console for: "[AuthStateService] Auth state retrieved successfully"
# 5. Check that user ID is masked: "userId123..."
```

**Expected Console Output**:
```
[AuthStateService] User not authenticated { message: "Auth session missing!", operation: "getServerAuthState" }
[AuthStateService] Auth state retrieved successfully { userId: "abc123...", operation: "getServerAuthState" }
```

#### Test 1.2: Profile Service
```bash
# After signing in:
# 1. Navigate to any page that loads profile
# 2. Check console for: "[ProfileService] Profile fetched successfully"
# 3. Verify user ID masking in logs
# 4. Test with invalid user (manually trigger error)
```

**Expected Console Output**:
```
[ProfileService] Profile fetched successfully { userId: "abc123...", operation: "getCurrentUserProfile", hasData: true }
```

#### Test 1.3: Error Handler
```bash
# Test error handling:
# 1. Trigger a network error (disconnect internet briefly)
# 2. Check console for proper error classification
# 3. Check Sentry dashboard for error reports
# 4. Verify PII masking in error reports
```

### Phase 2: Authentication Actions Testing

#### Test 2.1: Sign-In Action
```bash
# Test sign-in scenarios:
# 1. Valid email/password - check success logs
# 2. Invalid credentials - check info level logs (not sent to Sentry)
# 3. Network error - check warn/error level logs (sent to Sentry)
# 4. Verify email masking in all logs
```

**Test Cases**:
- ✅ Valid credentials: `user@example.com` / `validpassword`
- ✅ Invalid credentials: `user@example.com` / `wrongpassword`
- ✅ Invalid email format: `notanemail` / `password`
- ✅ Network disconnection during sign-in

#### Test 2.2: Sign-Out Action
```bash
# Test sign-out scenarios:
# 1. Normal sign-out - check success logs
# 2. Sign-out with session error - check error handling
# 3. Verify user ID masking in logs
# 4. Confirm redirect to login page
```

### Phase 3: Client Components Testing

#### Test 3.1: AuthSessionProvider
```bash
# Test provider functionality:
# 1. Check initial session loading
# 2. Test auth state changes (sign-in/out)
# 3. Verify conditional console logging (development only)
# 4. Check Sentry user context setting
# 5. Verify PII masking in Sentry reports
```

**Browser Console Commands**:
```javascript
// Check current auth state
console.log('Auth State:', window.__NEXT_DATA__);

// Check Sentry user context
console.log('Sentry User:', Sentry.getCurrentHub().getScope().getUser());
```

#### Test 3.2: useAuth Hook
```bash
# Test hook functionality:
# 1. Check memoization behavior (no unnecessary re-renders)
# 2. Test error scenarios
# 3. Verify development logging
# 4. Check combined auth + profile data
```

#### Test 3.3: Loading Provider
```bash
# Test loading states:
# 1. Check minimum display time (500ms)
# 2. Test loading state transitions
# 3. Verify Sentry breadcrumbs
# 4. Test auth + dashboard loading coordination
```

### Phase 4: Integration Testing

#### Test 4.1: Complete Authentication Flow
```bash
# End-to-end testing:
# 1. Start from homepage (unauthenticated)
# 2. Navigate to login page
# 3. Sign in with valid credentials
# 4. Verify redirect to dashboard
# 5. Check profile data loading
# 6. Sign out and verify redirect
```

#### Test 4.2: Error Scenarios
```bash
# Test error boundaries:
# 1. Trigger auth errors
# 2. Trigger profile loading errors
# 3. Test network failures
# 4. Verify error boundary fallbacks
# 5. Check error recovery mechanisms
```

### Phase 5: Performance Testing

#### Test 5.1: Loading Performance
```bash
# Use Chrome DevTools Performance tab:
# 1. Record page load with authentication
# 2. Check for unnecessary re-renders
# 3. Verify caching behavior
# 4. Measure time to interactive
```

#### Test 5.2: Memory Usage
```bash
# Use Chrome DevTools Memory tab:
# 1. Check for memory leaks
# 2. Verify context cleanup
# 3. Test with multiple auth state changes
```

## 🚀 Gradual Deployment Strategy

### Option 1: Feature Flag Approach

Create a feature flag system to gradually enable optimized components:

```typescript
// utils/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_OPTIMIZED_AUTH: process.env.NEXT_PUBLIC_USE_OPTIMIZED_AUTH === 'true',
  USE_OPTIMIZED_LOADING: process.env.NEXT_PUBLIC_USE_OPTIMIZED_LOADING === 'true',
  USE_OPTIMIZED_PROFILE: process.env.NEXT_PUBLIC_USE_OPTIMIZED_PROFILE === 'true',
};

// Example usage in layout
import { FEATURE_FLAGS } from '@/utils/feature-flags';
import { AuthSessionProvider } from '@/providers/auth-session-provider';
import { AuthSessionProvider as OptimizedAuthSessionProvider } from '@/providers/auth-session-provider-optimized';

const AuthProvider = FEATURE_FLAGS.USE_OPTIMIZED_AUTH 
  ? OptimizedAuthSessionProvider 
  : AuthSessionProvider;
```

### Option 2: Progressive File Replacement

Replace files one by one in this order:

#### Week 1: Core Services
```bash
# Replace core services first (lowest risk)
mv src/features/auth/services/auth-state.service.ts src/features/auth/services/auth-state.service.backup.ts
mv src/features/auth/services/auth-state-optimized.service.ts src/features/auth/services/auth-state.service.ts

# Test thoroughly before proceeding
```

#### Week 2: Error Handling
```bash
# Add centralized error handling
# Update imports gradually across components
```

#### Week 3: Client Components
```bash
# Replace client-side components
# Monitor for any issues
```

#### Week 4: Full Integration
```bash
# Replace remaining files
# Full system testing
```

### Option 3: Branch-Based Deployment

```bash
# Create deployment branches
git checkout -b auth-optimization-staging
git checkout -b auth-optimization-production

# Deploy to staging first
# Test thoroughly
# Then deploy to production
```

## 📊 Monitoring & Validation

### Development Monitoring

1. **Console Logs**: Check for proper debug output
2. **Network Tab**: Monitor API calls and performance
3. **React DevTools**: Check component re-renders
4. **Sentry Dashboard**: Verify error reporting

### Production Monitoring

1. **Error Rates**: Monitor authentication error rates
2. **Performance Metrics**: Track page load times
3. **User Experience**: Monitor bounce rates
4. **Sentry Alerts**: Set up alerts for critical errors

## 🔧 Troubleshooting Common Issues

### Issue 1: Import Errors
```bash
# If you see import errors:
# 1. Check file paths are correct
# 2. Verify exports match imports
# 3. Clear Next.js cache: rm -rf .next
```

### Issue 2: TypeScript Errors
```bash
# If TypeScript complains:
# 1. Check type definitions
# 2. Run: npm run type-check
# 3. Update imports to use correct types
```

### Issue 3: Runtime Errors
```bash
# If you see runtime errors:
# 1. Check browser console
# 2. Check Sentry dashboard
# 3. Verify environment variables
# 4. Check component mounting order
```

## ✅ Testing Checklist

### Before Deployment
- [ ] All console logs show proper formatting
- [ ] PII masking works correctly
- [ ] Error boundaries catch and handle errors
- [ ] Loading states work smoothly
- [ ] Authentication flows work end-to-end
- [ ] Performance is same or better
- [ ] No TypeScript errors
- [ ] No console errors in production build

### After Deployment
- [ ] Monitor error rates for 24 hours
- [ ] Check user feedback
- [ ] Verify analytics data
- [ ] Monitor performance metrics
- [ ] Check Sentry for new issues
