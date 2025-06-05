
# Homepage Feature (`src/features/homepage/`)

## 1. Overview

This feature module is responsible for rendering the main landing page of the PassForge application, accessible at the root URL (`/`). It provides an **optimized, professional homepage experience** with advanced loading state management, smooth transitions, and server-side authentication state persistence. The homepage aims to provide an engaging introduction to the application, highlight key features, and guide users towards sign-up or login with immediate authentication state availability.

## 2. Key Responsibilities & Optimizations

### 🚀 **Core Responsibilities**
*   Display the primary marketing and informational content for new visitors.
*   Provide clear navigation to authentication pages (Login, Register) and authenticated user areas.
*   Offer a visually appealing and interactive experience to capture user interest.
*   For authenticated users, display user-specific information immediately without loading states.

### ⚡ **Performance Optimizations**
*   **Server-side authentication state persistence** eliminates initial loading spinners
*   **Shared loading context** provides consistent loading behavior across all components
*   **Minimum display time (500ms)** prevents jarring loading flashes
*   **Smooth transitions** with AnimatePresence for professional state changes

### 🎯 **Enhanced User Experience**
*   **Immediate authentication state** availability on page load
*   **Professional animations** and state transitions
*   **Optimized loading states** with shared context management
*   **Consistent behavior** across all homepage components

## 3. Core Modules & Components (Optimized)

### 🏗️ **Enhanced Layout Component**
*   **`src/features/homepage/layout/homepage-layout.tsx`**: **Enhanced main orchestrating component** with integrated `LoadingProvider` for consistent state management. Renders the `HeroHeader`, `HeroCanvasBackground`, and `HeroContent` with shared loading context. This component was formerly `hero-section.tsx` and is rendered by `src/app/page.tsx`.

### 🎯 **Optimized Header Components**
*   **`src/features/homepage/components/hero-header/hero-header.tsx`**: **Optimized main navigation header** with shared loading context.
    *   **Uses `useLoading()` hook** for consistent loading states instead of local state management
    *   **Smooth transitions** with AnimatePresence for professional state changes
    *   **Eliminated loading state flashing** through server-side authentication state persistence
    *   Integrates with the project's central `useAuth` hook for dynamic content based on authentication state
    *   Benefits from server-side prefetching of user profile data for immediate display

*   **`src/features/homepage/components/hero-header/mobile-menu.tsx`**: **Enhanced mobile menu** with consistent loading behavior received from parent HeroHeader component.

### 🎨 **Visual & Content Components**
*   **`src/features/homepage/components/hero-content/hero-content.tsx`**: Contains the main marketing message, calls-to-action, and visuals of the hero section. Uses `framer-motion` for animations.
*   **`src/features/homepage/components/hero-canvas-background/hero-canvas-background.tsx`**: Renders an interactive dot-matrix background animation using HTML5 Canvas with performance optimizations.
*   **`src/features/homepage/components/rotating-text/rotating-text.tsx`**: Component for animated rotating text effects.
*   **`src/features/homepage/components/shiny-text/shiny-text.tsx`**: Component for text with an animated shine effect.

### 📁 **Supporting Files**
*   **`src/features/homepage/constants/`**: Stores constants like navigation items and canvas animation parameters.
*   **`src/features/homepage/types/`**: TypeScript type definitions specific to the homepage feature.

## 4. Architecture & Loading State Optimization

### 🔄 **Global Loading Context Integration**
The homepage now uses a **shared loading context** that provides consistent loading states across all components:

```tsx
// src/features/homepage/layout/homepage-layout.tsx
import { LoadingProvider } from '@/features/auth/context/loading-context';

export const HomepageLayout: React.FC = () => {
  return (
    <LoadingProvider>
      <section className="relative bg-background text-muted-foreground min-h-screen flex flex-col overflow-x-hidden pt-[70px]">
        {/* Homepage components automatically get loading context */}
      </section>
    </LoadingProvider>
  );
};
```

### ⚡ **Enhanced Hero Header with Smooth Transitions**
```tsx
// src/features/homepage/components/hero-header/hero-header.tsx
const { user, profile } = useAuth();
const { isLoading: showSkeletons, isAuthenticated } = useLoading();

// Smooth transitions with AnimatePresence
<AnimatePresence mode="wait">
  {showSkeletons ? (
    <motion.div key="skeleton">
      <Skeleton />
    </motion.div>
  ) : isAuthenticated ? (
    <motion.div key="authenticated">
      {/* Authenticated UI */}
    </motion.div>
  ) : (
    <motion.div key="unauthenticated">
      {/* Unauthenticated UI */}
    </motion.div>
  )}
</AnimatePresence>
```

## 5. Related Application Parts & Optimizations

*   **`src/app/layout.tsx`**: **Enhanced root layout** with server-side user data fetching and `preloadedUser` prop passed to `AuthSessionProvider` for immediate authentication state.
*   **`src/app/page.tsx`**: The Next.js App Router entry point for the root URL (`/`).
    *   It's an **`async` Server Component**.
    *   If a user is authenticated, it attempts to **prefetch the `userProfile`** data on the server using `getCurrentUserProfile` from `@/features/user-auth-data/queries`.
    *   It wraps its content (`HomepageLayout`) in `<HydrationBoundary>` to make this prefetched data available for client-side TanStack Query hydration.
    *   Renders the **enhanced `HomepageLayout`** from `@/features/homepage/layout`.
*   **`src/features/auth/context/loading-context.tsx`**: **New global loading context** that provides consistent loading states with minimum display time (500ms) to prevent flashing.
*   **`src/features/auth/hooks/use-auth.ts`**: The `useAuth` hook is used by `HeroHeader` and `MobileMenu` to display appropriate authentication-related buttons and user information. Benefits from server-side authentication state persistence.
*   **`src/features/user-auth-data/queries/profile.queries.ts`**: The `getCurrentUserProfile` Server Action is used by `src/app/page.tsx` for prefetching the user profile.
*   **`src/hooks/use-window-size.tsx`**: Used by `HeroCanvasBackground` to adapt to screen resizes.

## 6. Optimized Data Flow for Authenticated User on Homepage

### 🚀 **Enhanced Flow with Server-Side State Persistence**

1.  User visits the root URL (`/`).
2.  **`src/app/layout.tsx` (Root Layout - Server Component)** executes first:
    *   Calls `supabase.auth.getUser()` to fetch user data server-side
    *   Passes user data to `AuthSessionProvider` via `preloadedUser` prop
    *   **Eliminates initial loading states** by providing immediate authentication state
3.  `src/app/page.tsx` (Server Component) executes.
4.  `supabase.auth.getUser()` (via `createClient` from `@/lib/supabase/server`) checks for an active session.
5.  If the user is authenticated, `src/app/page.tsx` calls `queryClient.prefetchQuery({ queryKey: ['userProfile', userId], queryFn: getCurrentUserProfile })`.
6.  The `userProfile` data (if successfully fetched) is dehydrated.
7.  `src/app/page.tsx` renders **enhanced `HomepageLayout`** with integrated `LoadingProvider`, wrapping it in `<HydrationBoundary state={dehydrate(queryClient)}>`.
8.  The client loads. **Enhanced `AuthSessionProvider`** establishes the client-side session state **immediately** using preloaded user data.
9.  **`LoadingProvider`** provides consistent loading context with minimum display time (500ms).
10. `HeroHeader` (a Client Component within `HomepageLayout`) mounts and calls **both `useAuth()` and `useLoading()`**.
11. `useAuth()` internally calls `useUserProfileQuery()`.
12. `useUserProfileQuery()` (TanStack Query) finds the `userProfile` data (prefetched in step 5) in the hydrated state from `HydrationBoundary` and uses it as its initial data.
13. **`HeroHeader` renders immediately** with **no loading states**, displaying the user's name/avatar instantly with **smooth transitions** via AnimatePresence.

### ✨ **Key Optimizations Achieved**
*   **No initial loading spinners** - authentication state available immediately
*   **Smooth transitions** between authentication states with AnimatePresence
*   **Consistent loading behavior** across all components via shared context
*   **Professional, polished experience** with minimum display times preventing flashing

## 7. Usage Examples

### 🏠 **Basic Homepage Implementation (Optimized)**
```tsx
// src/app/page.tsx
import { HomepageLayout } from '@/features/homepage/layout/homepage-layout';

export default function HomePage() {
  return <HomepageLayout />; // Automatically includes LoadingProvider and optimizations
}
```

### 🔧 **Using Loading Context in Custom Components**
```tsx
// Custom homepage component
import { useLoading } from '@/features/auth/context/loading-context';

function CustomHomepageComponent() {
  const { isLoading, isAuthenticated } = useLoading();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      {isAuthenticated ? <AuthenticatedView /> : <UnauthenticatedView />}
    </div>
  );
}
```

### 🎨 **Individual Component Usage with Loading Context**
```tsx
// Custom implementation with loading context
import { LoadingProvider } from '@/features/auth/context/loading-context';
import { HeroHeader, HeroContent } from '@/features/homepage/components';

function CustomHomepage() {
  return (
    <LoadingProvider>
      <div className="min-h-screen">
        <HeroHeader />
        <main>
          <HeroContent />
        </main>
      </div>
    </LoadingProvider>
  );
}
```

## 8. Files and Folder Structure (ASCII)

```
/src/features/homepage/
├── README.md     # This enhanced README file
├── components/
│   ├── hero-canvas-background/
│   │   └── hero-canvas-background.tsx
│   ├── hero-content/
│   │   ├── hero-content.tsx
│   │   └── works-with-icons.tsx
│   ├── hero-header/
│   │   ├── dropdown-item.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── hero-header.tsx        # ✨ Optimized with shared loading context
│   │   ├── icons.tsx
│   │   ├── mobile-menu.tsx        # ✨ Enhanced with consistent loading behavior
│   │   └── nav-link.tsx
│   ├── rotating-text/
│   │   └── rotating-text.tsx
│   ├── shiny-text/
│   │   └── shiny-text.tsx
│   └── index.ts                    # Barrel file for components
├── constants/
│   ├── hero-canvas-background-constants.ts
│   ├── hero-header-constants.ts
│   └── index.ts
├── layout/
│   ├── homepage-layout.tsx         # ✨ Enhanced with LoadingProvider integration
│   └── index.ts                    # Barrel file for layout exports HomepageLayout
├── types/
│   ├── hero-canvas-background-types.ts
│   ├── hero-header-types.ts
│   └── index.ts
└── index.ts                        # Main barrel file for homepage feature (exports HomepageLayout)
```

## 9. Performance Optimizations & Best Practices

### 🚀 **Loading State Optimizations**
*   **Shared loading context** eliminates multiple local loading implementations
*   **Minimum display time (500ms)** prevents jarring loading flashes
*   **Server-side authentication state persistence** eliminates initial loading states
*   **Consistent loading behavior** across all homepage components

### 🎯 **Animation & Transition Optimizations**
*   **AnimatePresence** for smooth state transitions
*   **Hardware-accelerated animations** for better performance
*   **Optimized re-renders** with proper dependency arrays
*   **Canvas optimization** with efficient WebGL rendering

### 📱 **Best Practices**
1. **Use Global Loading Context:** Always use `useLoading()` instead of local loading state
2. **Leverage Server-Side State:** Utilize server-side authentication state persistence
3. **Implement Smooth Transitions:** Use AnimatePresence for professional state changes
4. **Respect Minimum Display Times:** Prevent jarring loading flashes
5. **Component Composition:** Use the enhanced layout as the main entry point

## 10. Testing & Validation

The homepage system has been comprehensively tested:

### ✅ **Loading State Testing**
*   Consistent loading states across all components
*   Minimum display time prevents flashing
*   Smooth transitions between states
*   Server-side authentication state persistence

### ✅ **Performance Testing**
*   Fast initial page load with server-side state
*   Smooth animations on various devices
*   Canvas performance optimization
*   No blocking during state transitions

### ✅ **User Experience Testing**
*   Professional, polished interactions
*   Responsive design on all devices
*   Accessibility compliance maintained
*   Consistent behavior across components

## 11. Troubleshooting

### 🔧 **Common Issues & Solutions**

**Loading states still flashing:**
- Ensure LoadingProvider is properly wrapped around components
- Check that minimum display time is implemented (500ms)

**Authentication state not immediate:**
- Verify server-side user data fetching in root layout
- Check that preloadedUser prop is passed to AuthSessionProvider

**Animations not smooth:**
- Ensure AnimatePresence is properly implemented
- Check for conflicting CSS transitions

**Canvas not rendering:**
- Check WebGL support in the browser
- Verify canvas dimensions are properly set
- Ensure proper cleanup on component unmount

For additional support, refer to the implementation files and comprehensive logging throughout the homepage components.
