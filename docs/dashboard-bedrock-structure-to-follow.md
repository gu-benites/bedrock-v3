
# Next.js Dashboard & Features: Guidelines Cheat Sheet

This guide focuses on structuring your dashboard's shared layout, nested routes like chat, and the organization of your `/src/features/dashboard` directory.

**NOTE:** Items marked with `[MOVED]` or `[EXTRACTED]` or `[CREATED]` indicate changes made during refactoring. Original paths might be obsolete or their content significantly altered. `[OBSOLETE]` indicates the file/path is no longer needed.

## Core Principles:

*   `/src/app/`**: Handles routing, route groups, and applies layouts.
*   **`/src/features/`**: Contains the actual UI components, logic, services, and types for distinct application features.
    
*   **Naming Conventions**:
    *   **Files & Folders**: `kebab-case` (e.g., `user-profile.tsx`, `page-header/`)
    *   **React Components**: `PascalCase` (e.g., `UserProfileCard`, `DashboardShell`)
    *   **Functions & Actions**: `PascalCase` (e.g., `GetUserData()`, `HandleFormSubmit()`, `UpdateProfileAction()`) _(as per your specified preference)_

## 1\. Dashboard Shared Layout
*   **Layout File Location**:
    *   `/src/app/(dashboard)/layout.tsx` (This uses `DashboardLayout` from `features`)
    *   Purpose: Defines the persistent UI shell (sidebar, header, etc.) for all routes within the `(dashboard)` route group. **Crucially, this Server Component handles server-side prefetching of the authenticated user's profile data.** The `(dashboard)` group itself does not add to the URL path.

*   **Conceptual** Layout Component **(`/src/app/(dashboard)/layout.tsx`)**:
    ```
    // /src/app/(dashboard)/layout.tsx
    import { DashboardLayout } from '@/features/dashboard/components'; // This still points to the main layout component
    
    export default function DashboardLayout({ children }: { children: React.ReactNode }) {
      return (
        <div className="dashboard-container"> {/* Or your specific layout classes */}
          {/* DashboardLayout from features/dashboard/components now orchestrates sidebar/header from features/dashboard/layout */}
          <DashboardLayout>{children}</DashboardLayout>
        </div>
      );
    }
    ```
*   **Actual `DashboardLayout` Orchestrator**: `src/features/dashboard/components/dashboard-layout.tsx` (This component is now leaner and uses the new layout parts) **[PHASE 1 COMPLETE]**

*   **Shared UI Components (Sidebar, Header, User Menu)**:
    
    *   **Location**: `/src/features/dashboard/components/` **[PHASE 1 COMPLETE - ADJUSTED LOCATION]**
    *   **Files**:
        *   `dashboard-sidebar.tsx` (exports `DashboardSidebar` component) **[CREATED IN PHASE 1]** - Contains navigation links.
        *   `dashboard-header.tsx` (exports `DashboardHeader` component) **[CREATED IN PHASE 1]** - Contains page title and header controls.
        *   `dashboard-user-menu.tsx` (exports `DashboardUserMenu` component, used within `DashboardSidebar`) **[CREATED IN PHASE 1]** - Uses the `useAuth` hook to access `user` and `profile` data for displaying the user's name, email, and avatar. Handles logout using `signOutUserAction`.
        *   `index.ts` (Barrel file: `export * from './dashboard-sidebar'; export * from './dashboard-header'; export * from './dashboard-user-menu';`) **[CREATED IN PHASE 1]** - Exports the shared components.
*   **Old Locations (Obsolete after Phase 1):**
    * `src/features/dashboard/components/sidebar.tsx` `[OBSOLETE after PHASE 1]`
    * Header logic was inside `src/features/dashboard/components/dashboard-layout.tsx` `[EXTRACTED to /layout/dashboard-header.tsx in PHASE 1]`

    **(Note: The `layout` directory was initially planned for shared UI but components were placed directly in `components` during refactoring. This doc reflects the actual final location.)**

## 2\. Dashboard Pages (Example: Main & Chat) - **[UPDATED PATHS IN PHASE 2 & 3]**
This assumes your dashboard URLs are like `/dashboard`, `/dashboard/chat`, etc.

#### A. Main Dashboard Page (e.g., Overview)
*   **URL**: `/dashboard`
*   **Route File**: `/src/app/(dashboard)/dashboard/page.tsx`
    
    ```
    // /src/app/(dashboard)/dashboard/page.tsx
    import { DashboardHomepageView } from '@/features/dashboard/dashboard-homepage'; // Path changed in PHASE 2
    
    export default function DashboardPage() {
      return <DashboardHomepageView />;
    }
    ```

*   **Feature Component Location**: `/src/features/dashboard/dashboard-homepage/` **[PHASE 2 COMPLETE]**
    *   Main view component file: `dashboard-homepage-view.tsx` (exports `DashboardHomepageView`) **[CREATED IN PHASE 2]**
    *   Barrel file: `index.ts` (exports `DashboardHomepageView`) **[CREATED IN PHASE 2]**
*   **Old Location (Obsolete after Phase 2)**:
    * `src/features/dashboard/components/dashboard-homepage/dashboard-homepage.tsx` `[OBSOLETE after PHASE 2]`
    * `src/features/dashboard/components/dashboard-homepage/index.ts` `[OBSOLETE after PHASE 2]`

#### B. Chat Page (Nested under Dashboard)
*   **URL**: `/dashboard/chat`
*   **Route File**: `/src/app/(dashboard)/dashboard/chat/page.tsx`

    ```
    // /src/app/(dashboard)/dashboard/chat/page.tsx
    import { ChatView } from '@/features/dashboard/chat'; // Path changed in PHASE 3
    
    export default function DashboardChatPage() {
      return <ChatView />;
    }
    ```

*   **Feature Component Location**: `/src/features/dashboard/chat/` **[PHASE 3 COMPLETE]**
    *   Main view component file: `chat-view.tsx` (exports `ChatView`, contains the main chat UI logic and renders `chat-input.tsx`) **[CREATED IN PHASE 3]**
    *   Sub-component: `components/chat-input.tsx` (exports `ChatInput`, used by `ChatView`) **[CREATED IN PHASE 3]**
    *   Barrel file: `index.ts` (exports `ChatView`) **[CREATED IN PHASE 3]**
*   **Old Chat Component Location**: `src/features/chat/components/chat-page.tsx` `[OBSOLETE after PHASE 3 - logic moved to chat-view.tsx]`
*   **Old Chat Input Component Location**: `src/features/chat/components/chat-input.tsx` `[OBSOLETE after PHASE 3 - logic moved to /dashboard/chat/components/chat-input.tsx]`
*   **Old Chat Messages Component Location**: `src/features/chat/components/chat-messages.tsx` `[OBSOLETE after PHASE 3 - logic handled within chat-view.tsx]`

## 3\. Feature Structure: `/src/features/dashboard/`
This directory groups all code related to the dashboard's functionality and views.

```
/src/features/dashboard/
├── layout/                     # Shared UI for the dashboard shell itself - IMPLEMENTED IN PHASE 1
│   ├── dashboard-header.tsx    # Exports DashboardHeader
│   ├── dashboard-sidebar.tsx   # Exports DashboardSidebar (contains navigation links)
│   ├── user-menu.tsx           # Exports UserMenu
│   └── index.ts                # Barrel file for exports
│
├── components/                 # Main orchestrating components or legacy components before full refactor
│   └── dashboard-layout.tsx    # Main layout component, now uses items from /layout/
│   └── index.ts                # Barrel file for components like DashboardLayout
│
├── dashboard-homepage/         # [CREATED/POPULATED IN PHASE 2] Feature for the main /dashboard page content
│   ├── components/             # UI sub-components specific to dashboard-homepage (Example)
│   ├── hooks/                  # Custom hooks for this feature (Example)
│   ├── dashboard-homepage-view.tsx # Main view component (exports DashboardHomepageView) [CREATED IN PHASE 2]
│   └── index.ts                # Barrel file for this feature [CREATED IN PHASE 2]
│
├── chat/                       # [CREATED/POPULATED IN PHASE 3] Feature for the /dashboard/chat page content
│   ├── components/             # UI sub-components specific to dashboard's chat view
│   │   └── chat-input.tsx      # Chat input component used by ChatView [CREATED IN PHASE 3]
│   ├── hooks/                  # Custom hooks for dashboard's chat view (if any) (Example)
│   ├── chat-view.tsx           # Main view component (exports ChatView, contains full chat UI) [CREATED IN PHASE 3]
│   └── index.ts                # Barrel file for this feature [CREATED IN PHASE 3]
│
│
├── settings/                   # Example: Feature for /dashboard/settings (Not yet implemented)
│   ├── components/
│   ├── settings-view.tsx
│   └── index.ts
│
└── types/                      # (Optional) Shared types specific to dashboard features
    └── index.ts                # or dashboard.types.ts
```

#### Key points for feature folders (e.g., `chat/`, `dashboard-homepage/`):
*   **`[feature-name]-view.tsx`**: Often the main entry component for the feature, imported by the route's `page.tsx`.
*   **`components/`**: Contains smaller, reusable React components used only within that specific feature.
*   **`hooks/`**: Custom React hooks specific to the feature's logic.
*   **`services/` or `actions/`**: (Optional) For API calls or business logic functions (e.g., `FetchChatMessages.ts`, `UpdateSettingsAction.ts`). Remember your `PascalCase` convention for functions/actions.
*   **`types/` or `[feature-name].types.ts`**: TypeScript type definitions specific to the feature.

## 4. Authentication Architecture

### Unified Authentication Hook
All dashboard components must use the optimized `useAuth()` hook as the single source of truth for authentication data.

**Location**: `@/features/auth/hooks/use-auth.ts`

**Standard Pattern**:
```typescript
// ✅ CORRECT: Single source of truth
const { user, profile, isAuthenticated, isLoading } = useAuth();
const showSkeletons = isLoading;

// ✅ For dashboard-specific optimistic UI only
const { isSigningOut, setIsSigningOut } = useDashboardLoading();
```

**❌ INCORRECT Pattern (Eliminated)**:
```typescript
// ❌ AVOID: Mixed data sources
const { user, profile } = useAuth();
const { isLoading: showSkeletons, isAuthenticated } = useDashboardLoading(); // Hardcoded values
```

### Component Authentication Patterns

#### Dashboard User Menu (`dashboard-user-menu.tsx`)
- **Auth Data**: Uses `useAuth()` for user data and profile information
- **Loading States**: Uses `isLoading` from `useAuth()` for skeleton display
- **Optimistic UI**: Uses `useDashboardLoading()` only for sign-out loading states
- **User Display**: Shows `profile?.firstName`, `profile?.lastName`, and `profile?.avatarUrl`

#### Hero Header (`@/features/homepage/components/hero-header/hero-header.tsx`)
- **Auth State**: Uses `useAuth()` for authentication state and user greeting
- **Loading**: Uses `isLoading` from `useAuth()` for consistent skeleton behavior
- **User Greeting**: Displays personalized greeting when authenticated

#### Profile View (`@/features/dashboard/profile/profile-view.tsx`)
- **Comprehensive Auth**: Uses full auth state from `useAuth()` including `isLoadingAuth`, `isSessionLoading`, `sessionError`, `profileError`
- **Smart Loading**: Skeleton shows only when appropriate using optimized conditions
- **Form Integration**: Seamlessly integrates auth data with profile editing forms

#### Dashboard Homepage View (`@/features/dashboard/dashboard-homepage/dashboard-homepage-view.tsx`)
- **Consistent Data**: Uses `useAuth()` for all authentication and user data
- **Loading States**: Uses `isLoading` from `useAuth()` instead of mixed sources
- **User Display**: Shows consistent user information across dashboard

### Loading Provider Usage

**Purpose**: UI-specific loading states and optimistic UI ONLY, NOT authentication state

**Location**: `@/features/ui/providers/loading-provider.tsx`

**Appropriate Usage**:
```typescript
// ✅ CORRECT: Only for UI timing and optimistic states
const { isSigningOut, setIsSigningOut } = useDashboardLoading();

// For optimistic sign-out UI
const handleSignOut = async () => {
  setIsSigningOut(true); // Immediate UI feedback
  await signOutUserAction();
};
```

**Important**: Never use loading provider for authentication state - always use `useAuth()` directly.

## 5. Loading States and Skeleton Implementation

### Skeleton Loading Patterns

All dashboard components must implement consistent skeleton loading using the optimized authentication flow.

#### Profile View Skeleton
**Location**: `@/features/dashboard/profile/profile-view.tsx`

**Loading Condition**:
```typescript
if (isSessionLoading || isLoadingAuth && !originalProfile && !profileError) {
  return <ProfileViewSkeleton />;
}
```

**Features**:
- **Comprehensive Layout**: Skeleton matches exact form layout including banner, avatar, form fields
- **Responsive Design**: Adapts to different screen sizes with proper breakpoints
- **Smart Conditions**: Shows only when appropriate, avoids unnecessary displays

#### Dashboard Component Skeletons
**Standard Pattern**:
```typescript
const { isLoading } = useAuth();

if (isLoading) {
  return <ComponentSkeleton />;
}
```

### Animation Standards

#### Pulse Animation
- **Class**: Use `animate-pulse` for smooth breathing effect
- **Duration**: Consistent timing across all skeleton components
- **Performance**: Hardware-accelerated animations for smooth experience

#### Responsive Design
- **Mobile First**: Skeleton adapts from mobile to desktop
- **Breakpoints**: Use consistent breakpoints (`sm:`, `md:`, `lg:`)
- **Layout Preservation**: Skeleton maintains exact layout structure

#### Layout Matching
- **Exact Structure**: Skeleton must match real component layout precisely
- **Spacing**: Maintain proper margins, padding, and gaps
- **Visual Hierarchy**: Preserve component visual structure in skeleton state

## 6. Performance Optimization Patterns

### React Cache Integration

**Server-side Caching**:
```typescript
// Enhanced profile service with React cache
export const getCurrentUserProfile = cache(async (userId: string) => {
  // Cached profile fetching logic
});
```

**Benefits**:
- **Reduced Database Calls**: Server-side caching eliminates redundant queries
- **Faster Response Times**: Cached data serves immediately
- **Enhanced Performance**: Optimized data flow throughout application

### Prefetching Strategies

**Dashboard Layout Prefetching**:
```typescript
// Race prefetch against timeout to prevent blocking
const profilePromise = queryClient.prefetchQuery({
  queryKey: ['userProfile', user.id],
  queryFn: () => getCurrentUserProfile(user.id),
  staleTime: 10 * 1000,
});

const timeoutPromise = new Promise(resolve => setTimeout(resolve, 500));
await Promise.race([profilePromise, timeoutPromise]);
```

**Key Features**:
- **Timeout Protection**: 500ms timeout prevents blocking rendering
- **Race Pattern**: Balances performance with responsiveness
- **Fallback Strategy**: Client-side fetching if prefetch fails

### Memoization Patterns

**Optimized Hook Implementation**:
```typescript
const authState = useMemo(() => ({
  user,
  profile,
  isAuthenticated,
  isLoading
}), [user, profile, isAuthenticated, isLoading]);
```

**Benefits**:
- **Reduced Re-renders**: Prevents unnecessary component updates
- **Performance Optimization**: Expensive computations cached
- **Memory Efficiency**: Optimal memory usage patterns

## 7. Security and Privacy Standards

### PII Protection

All authentication-related logging and error reporting must implement consistent PII masking.

**User ID Masking**:
```typescript
// User IDs appear as: "5d99e3..." in logs
const maskedUserId = userId.substring(0, 6) + '...';
logger.info(`Profile fetched for user: ${maskedUserId}`);
```

**Error Reporting**:
```typescript
// Sanitize sensitive data before Sentry transmission
Sentry.captureException(error, {
  tags: { feature: 'authentication' },
  extra: {
    userId: maskedUserId, // Never full user ID
    hasProfile: !!profile // Boolean flags only
  }
});
```

**Logging Standards**:
```typescript
// Structured logging with consistent masking
logger.info('Profile operation completed', {
  userId: maskedUserId,
  operation: 'getCurrentUserProfile',
  hasData: !!profileData,
  duration: Date.now() - startTime
});
```

### Error Boundary Implementation

**Global Error Boundary**:
- **Location**: Application root level
- **Purpose**: Application-wide error recovery and fallback UI
- **Integration**: Automatic Sentry reporting with PII protection

**Feature Error Boundaries**:
- **Location**: Feature-specific components
- **Purpose**: Granular error isolation and recovery
- **Fallback**: Feature-specific error UI with recovery options

**Auth Error Boundary**:
- **Location**: Authentication provider level
- **Purpose**: Authentication-specific error handling
- **Recovery**: Automatic retry mechanisms and user guidance

### Sentry Integration

**Automatic Error Reporting**:
```typescript
// Enhanced error reporting with context
Sentry.withScope((scope) => {
  scope.setTag('feature', 'dashboard');
  scope.setLevel('error');
  scope.setContext('auth', {
    isAuthenticated: !!user,
    hasProfile: !!profile,
    loadingState: isLoading
  });
  Sentry.captureException(error);
});
```

**Performance Monitoring**:
- **Transaction Tracking**: Monitor authentication flow performance
- **Custom Metrics**: Track loading times and error rates
- **User Experience**: Monitor skeleton display duration and transition smoothness

## 8. UI/UX Standards

### Animation Guidelines

**Skeleton Animations**:
- **Pulse Effect**: Consistent breathing animation across all components
- **Timing**: 2-second pulse cycle for optimal user perception
- **Easing**: Use CSS `ease-in-out` for smooth transitions

**State Transitions**:
- **Loading to Content**: Smooth fade-in transition (200ms)
- **Error States**: Gentle slide-in for error messages
- **Optimistic UI**: Immediate feedback with subtle loading indicators

### Responsive Design Patterns

**Breakpoint Strategy**:
```typescript
// Consistent breakpoint usage
<div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28">
  {/* Avatar sizing across breakpoints */}
</div>
```

**Mobile-First Approach**:
- **Base Styles**: Mobile-optimized by default
- **Progressive Enhancement**: Add desktop features with breakpoints
- **Touch Targets**: Minimum 44px touch targets for mobile interaction

## 9. Testing Guidelines

### Component Testing Patterns

**Authentication Mock Setup**:
```typescript
const mockUseAuth = {
  user: mockUser,
  profile: mockProfile,
  isAuthenticated: true,
  isLoading: false,
  sessionError: null,
  profileError: null
};

jest.mock('@/features/auth/hooks', () => ({
  useAuth: () => mockUseAuth
}));
```

**Loading State Testing**:
```typescript
describe('Component Loading States', () => {
  it('should show skeleton during loading', () => {
    mockUseAuth.isLoading = true;
    render(<Component />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('should show content when loaded', () => {
    mockUseAuth.isLoading = false;
    render(<Component />);
    expect(screen.getByText('User Content')).toBeInTheDocument();
  });
});
```

### Integration Testing

**Authentication Flow Testing**:
```typescript
describe('Dashboard Authentication Flow', () => {
  it('should handle complete auth cycle', async () => {
    // Test sign-in, profile loading, and dashboard display
    render(<DashboardLayout />);

    // Verify skeleton appears
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();

    // Wait for auth completion
    await waitFor(() => {
      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    });
  });
});
```

## 10. Debugging Standards

### Client-Side Debugging

**Console Logging Pattern**:
```typescript
// Structured console logs for development
console.log('[useAuth] State update:', {
  isAuthenticated: !!user,
  hasProfile: !!profile,
  loadingState: isLoading,
  timestamp: new Date().toISOString()
});
```

**Development Tools**:
- **React DevTools**: Component state inspection
- **Network Tab**: API call monitoring
- **Performance Tab**: Loading time analysis

### Server-Side Monitoring

**Winston Logging Structure**:
```typescript
logger.info('Authentication operation', {
  operation: 'profileFetch',
  userId: maskedUserId,
  duration: responseTime,
  success: true,
  timestamp: new Date().toISOString()
});
```

**Monitoring Metrics**:
- **Response Times**: Track API performance
- **Error Rates**: Monitor authentication failures
- **User Experience**: Measure skeleton display duration

## 11. Migration Patterns

### Component Update Checklist

When updating existing components to follow optimized patterns:

- [ ] **Replace mixed data sources** with `useAuth()` only
- [ ] **Remove hardcoded loading states** from loading providers
- [ ] **Update skeleton conditions** to use `isLoading` from `useAuth`
- [ ] **Implement consistent error handling** with proper error boundaries
- [ ] **Add PII masking** to any logging statements
- [ ] **Test loading states** and skeleton animations
- [ ] **Verify error scenarios** work correctly
- [ ] **Update component tests** to use new patterns

### Legacy Component Identification

**Red Flags** (patterns to eliminate):
```typescript
// ❌ Mixed data sources
const { user } = useAuth();
const { isLoading } = useSomeOtherProvider();

// ❌ Hardcoded authentication state
const isAuthenticated = true; // or from non-auth provider

// ❌ Inconsistent loading patterns
const showSkeleton = someCustomLogic();
```

**Green Flags** (optimized patterns):
```typescript
// ✅ Single source of truth
const { user, profile, isAuthenticated, isLoading } = useAuth();

// ✅ Consistent loading
const showSkeleton = isLoading;

// ✅ Proper error handling
if (sessionError) return <ErrorBoundary />;
```

## 12. Related Documentation

### Primary Architecture Reference

**Main Documentation**: `docs/optimized-authentication-architecture.md`
- **Comprehensive Guide**: Complete authentication system architecture
- **Implementation Examples**: Real code examples for all dashboard components
- **Data Flow Diagrams**: Visual representation of authentication and loading flows
- **Performance Optimizations**: Detailed coverage of React cache, memoization, and prefetching
- **Security Guidelines**: PII masking, error boundaries, and Sentry integration
- **Testing Strategies**: Component and integration testing patterns
- **Migration Guide**: Step-by-step optimization checklist

### Feature-Specific Documentation

**Authentication System**:
- **Location**: `src/features/auth/README.md`
- **Coverage**: Authentication actions, hooks, and providers
- **Integration**: Supabase Auth setup and configuration

**Dashboard Features**:
- **Location**: `src/features/dashboard/README.md`
- **Coverage**: Dashboard-specific components and layout patterns
- **Components**: Sidebar, header, user menu implementation details

**Profile Management**:
- **Location**: `src/features/user-auth-data/README.md`
- **Coverage**: Profile services, actions, and data management
- **Optimization**: Enhanced profile service with React cache integration

**UI Components**:
- **Location**: `src/features/ui/README.md`
- **Coverage**: Loading providers, skeleton components, and UI patterns
- **Guidelines**: Animation standards and responsive design patterns

### Error Logging Standards

**Comprehensive Guidelines**: `docs/error-logging-guidelines.md`
- **Server-side Logging**: Winston integration and structured logging
- **Client-side Reporting**: Sentry setup and error boundaries
- **PII Protection**: Consistent masking strategies across all logging
- **Practical Examples**: Real-world logging patterns and best practices

### Development Workflow

**Component Development**:
1. **Follow Authentication Patterns**: Always use `useAuth()` as single source of truth
2. **Implement Skeleton Loading**: Use consistent loading patterns with proper animations
3. **Add Error Handling**: Implement appropriate error boundaries and PII masking
4. **Write Tests**: Include both component and integration tests
5. **Update Documentation**: Keep feature-specific README files current

**Code Review Checklist**:
- [ ] Uses `useAuth()` for all authentication data
- [ ] Implements consistent skeleton loading patterns
- [ ] Includes proper error handling with PII protection
- [ ] Follows established naming conventions
- [ ] Includes appropriate tests
- [ ] Updates relevant documentation

## 13. Architecture Evolution

### Current State (Optimized)

The dashboard architecture has evolved significantly beyond the original bedrock structure:

**Enhanced Authentication**:
- **Unified Data Sources**: Single `useAuth()` hook for all authentication needs
- **Performance Optimized**: React cache integration and efficient prefetching
- **Security Enhanced**: Comprehensive PII masking and error reporting
- **User Experience**: Beautiful skeleton loading and smooth transitions

**Advanced Loading Management**:
- **Centralized Provider**: UI-specific loading states separated from authentication
- **Optimistic UI**: Immediate user feedback for better experience
- **Smart Conditions**: Intelligent skeleton display logic
- **Responsive Design**: Consistent behavior across all screen sizes

**Production-Ready Features**:
- **Error Boundaries**: Multi-level error isolation and recovery
- **Monitoring Integration**: Sentry and Winston logging with structured data
- **Performance Metrics**: Detailed tracking of authentication flow performance
- **Testing Coverage**: Comprehensive component and integration testing

### Future Enhancements

**Planned Optimizations**:
1. **Enhanced Caching**: More granular cache invalidation strategies
2. **Offline Support**: Offline authentication state management
3. **Performance Analytics**: Real-time authentication flow monitoring
4. **Advanced Error Recovery**: Automatic retry mechanisms
5. **Enhanced Security**: Additional PII protection measures

**Monitoring Improvements**:
1. **Real-time Dashboards**: Authentication flow performance monitoring
2. **Performance Alerts**: Automated slow authentication detection
3. **Error Analytics**: Detailed error pattern analysis and resolution
4. **User Experience Metrics**: Loading time optimization and user satisfaction tracking

This comprehensive architecture ensures scalable, maintainable, and performant authentication throughout the dashboard while providing excellent developer experience and production reliability.

