# Authentication Optimization Testing Checklist

Use this checklist to systematically test the authentication optimization in development.

## 🔧 Setup

### Environment Variables
Add to your `.env.local`:
```bash
NEXT_PUBLIC_DEBUG_AUTH=true
NEXT_PUBLIC_DEBUG_LOADING=true
NEXT_PUBLIC_DEBUG=true
NODE_ENV=development
```

### Browser Setup
- [ ] Open Chrome/Firefox DevTools
- [ ] Go to Console tab
- [ ] Go to Network tab
- [ ] Go to Application tab (for cookies/localStorage)

## 📋 Testing Phases

### Phase 1: Core Services ✅

#### Auth State Service
- [ ] Visit homepage without authentication
- [ ] Check console for: `[AuthStateService] User not authenticated`
- [ ] Sign in with valid credentials
- [ ] Check console for: `[AuthStateService] Auth state retrieved successfully`
- [ ] Verify user ID is masked: `userId123...`
- [ ] No PII visible in logs

#### Profile Service
- [ ] After signing in, navigate to profile page
- [ ] Check console for: `[ProfileService] Profile fetched successfully`
- [ ] Verify user ID masking in logs
- [ ] Test profile loading with network issues
- [ ] Verify error handling and logging

#### Error Handler
- [ ] Trigger network error (disconnect internet)
- [ ] Check console for proper error classification
- [ ] Check Sentry dashboard for error reports
- [ ] Verify PII masking in error reports

### Phase 2: Authentication Actions ✅

#### Sign-In Testing
- [ ] **Valid credentials**: Check success logs
- [ ] **Invalid credentials**: Check info level logs (not sent to Sentry)
- [ ] **Network error**: Check warn/error level logs (sent to Sentry)
- [ ] **Email masking**: Verify emails show as `abc***`
- [ ] **User ID masking**: Verify IDs show as `abc123...`

#### Sign-Out Testing
- [ ] Normal sign-out: Check success logs
- [ ] Sign-out with session error: Check error handling
- [ ] Verify user ID masking in logs
- [ ] Confirm redirect to login page

### Phase 3: Client Components ✅

#### AuthSessionProvider
- [ ] Check initial session loading
- [ ] Test auth state changes (sign-in/out)
- [ ] Verify conditional console logging (development only)
- [ ] Check Sentry user context setting
- [ ] Verify PII masking in Sentry reports

#### useAuth Hook
- [ ] Check memoization (no unnecessary re-renders)
- [ ] Test error scenarios
- [ ] Verify development logging
- [ ] Check combined auth + profile data

#### Loading Provider
- [ ] Check minimum display time (500ms)
- [ ] Test loading state transitions
- [ ] Verify Sentry breadcrumbs
- [ ] Test auth + dashboard loading coordination

### Phase 4: UI Components ✅

#### Homepage Layout
- [ ] Test with authenticated user
- [ ] Test with unauthenticated user
- [ ] Test error scenarios
- [ ] Verify Sentry user context
- [ ] Confirm loading state management

### Phase 5: Root Components ✅

#### Middleware
- [ ] Test with valid session
- [ ] Test with expired session
- [ ] Test with missing session
- [ ] Test protected route access
- [ ] Verify error logging behavior

#### Root Layout & Page
- [ ] Test layout with valid auth state
- [ ] Test layout with auth errors
- [ ] Test fallback rendering
- [ ] Verify error logging
- [ ] Test profile prefetching

### Phase 6: Error Boundaries ✅

#### Global Error Boundary
- [ ] Test with various errors
- [ ] Test error recovery mechanisms
- [ ] Verify Sentry reporting
- [ ] Test development vs production behavior

#### Auth Error Boundary
- [ ] Test with auth errors
- [ ] Test error recovery
- [ ] Verify Sentry reporting
- [ ] Test fallback UI

## 🔍 Integration Testing

### Complete Authentication Flow
- [ ] Start from homepage (unauthenticated)
- [ ] Navigate to login page
- [ ] Sign in with valid credentials
- [ ] Verify redirect to dashboard
- [ ] Check profile data loading
- [ ] Sign out and verify redirect

### Error Scenarios
- [ ] Trigger auth errors
- [ ] Trigger profile loading errors
- [ ] Test network failures
- [ ] Verify error boundary fallbacks
- [ ] Check error recovery mechanisms

### Performance Testing
- [ ] Record page load with authentication (Chrome DevTools)
- [ ] Check for unnecessary re-renders
- [ ] Verify caching behavior
- [ ] Measure time to interactive
- [ ] Check memory usage

## 🚀 Pre-Deployment Checklist

### Code Quality
- [ ] No TypeScript errors: `npm run type-check`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in production build
- [ ] All imports are correct
- [ ] No unused imports or variables

### Functionality
- [ ] All existing authentication flows work
- [ ] Google One Tap integration functional
- [ ] Email/password authentication works
- [ ] Session management operates properly
- [ ] Profile data access working

### Error Logging
- [ ] Winston logs use proper module names
- [ ] Sentry receives only warn/error logs
- [ ] PII consistently masked
- [ ] Development logging conditional
- [ ] Error context and tags proper

### Performance
- [ ] Authentication flows same or faster
- [ ] Loading states provide better UX
- [ ] Caching reduces redundant operations
- [ ] Error handling doesn't impact performance
- [ ] Memory usage optimized

### Security
- [ ] No PII in logs or error reports
- [ ] Authentication security maintained
- [ ] Error messages don't leak sensitive info
- [ ] Session security preserved
- [ ] Google One Tap security requirements met

## 🎯 Quick Test Commands

### Development Testing
```bash
# Start development server with debug flags
npm run dev

# Run type checking
npm run type-check

# Build for production
npm run build

# Test specific components
npm run test -- --watch
```

### Browser Console Tests
```javascript
// Check auth state
console.log('Auth State:', window.__NEXT_DATA__);

// Check Sentry user context
console.log('Sentry User:', Sentry.getCurrentHub().getScope().getUser());

// Check loading states
console.log('Loading Context:', document.querySelector('[data-loading]'));
```

### Network Testing
- [ ] Disconnect internet during auth
- [ ] Slow 3G simulation
- [ ] Block specific API endpoints
- [ ] Test with VPN/proxy

## ✅ Sign-off

### Development Testing Complete
- [ ] All phases tested individually
- [ ] Integration testing complete
- [ ] Performance testing satisfactory
- [ ] Error handling verified
- [ ] Security checks passed

### Ready for Deployment
- [ ] All tests passing
- [ ] No critical issues found
- [ ] Performance metrics acceptable
- [ ] Error logging working correctly
- [ ] Team approval obtained

**Tested by**: ________________  
**Date**: ________________  
**Notes**: ________________
