# Product Requirements Document: Essential Oil Recipe Creator

## 1. Introduction/Overview

The Essential Oil Recipe Creator is a multi-step wizard feature that guides authenticated users through creating personalized essential oil recipes based on their health concerns. The feature integrates with an external AI-powered API to provide intelligent recommendations for causes, symptoms, therapeutic properties, and essential oil suggestions, ultimately generating customized aromatherapy recipes.

**Problem Statement:** Users seeking natural aromatherapy solutions need personalized essential oil recipes tailored to their specific health concerns, demographics, and symptoms, but lack the expertise to create effective combinations.

**Goal:** Provide an intuitive, mobile-first wizard interface that collects user health information and generates scientifically-backed essential oil recipes through AI-powered recommendations.

## 2. Goals

1. **Primary Goal:** Create a seamless 6-step wizard that generates personalized essential oil recipes
2. **User Experience Goal:** Provide mobile-optimized, intuitive navigation with progress persistence
3. **Technical Goal:** Implement robust state management with local storage persistence and error handling
4. **Performance Goal:** Ensure fast loading times with optimistic UI updates and retry mechanisms
5. **Integration Goal:** Successfully integrate with external AromaRx API for intelligent recommendations

## 3. User Stories

### Core User Journey
- **As an authenticated user**, I want to describe my health concern so that I can receive personalized essential oil recommendations
- **As a user**, I want to provide my demographics (gender, age) so that recommendations are tailored to my profile
- **As a user**, I want to select from AI-suggested potential causes so that the system understands my specific situation
- **As a user**, I want to choose relevant symptoms so that the recipe addresses my exact needs
- **As a user**, I want to view therapeutic properties so that I understand the science behind recommendations
- **As a user**, I want to see suggested essential oils for each property so that I can make informed choices

### Technical User Stories
- **As a user**, I want my progress to be saved automatically so that I don't lose data if I navigate away
- **As a mobile user**, I want a responsive interface optimized for touch interactions
- **As a user**, I want clear error messages and retry options when the system encounters problems

## 4. Functional Requirements

### 4.1 Authentication & Access Control
1. The feature must be accessible only to authenticated users
2. The system must redirect unauthenticated users to the login page
3. User session must be validated before allowing access to any step

### 4.2 Multi-Step Wizard Flow
4. **Step 1 - Health Concern Input:**
   - User must enter a health concern description (minimum 3 characters) (a sample of this chat input is at /src/features/dashboard/chat)
   - Form validation using Zod schema
   - Auto-save to local storage on input change

5. **Step 2 - Demographics:**
   - User must select gender (Male/Female options only)
   - User must select age category from 5 basic options
   - User must enter specific age
   - Form validation before proceeding

6. **Step 3 - Potential Causes Selection:**
   - Display AI-generated potential causes from external API
   - User must select at least one cause from the provided list
   - Support multiple cause selection with checkboxes

7. **Step 4 - Symptoms Selection:**
   - Display AI-generated symptoms based on selected causes
   - User must select at least one symptom from the provided list
   - Support multiple symptom selection

8. **Step 5 - Therapeutic Properties Display:**
   - Display therapeutic properties returned from API
   - Show property descriptions and relevancy scores
   - Automatically proceed to oil suggestions

9. **Step 6 - Essential Oil Suggestions:**
   - Display suggested oils for each therapeutic property
   - Show oil descriptions and relevancy scores
   - Present oils grouped by therapeutic property

### 4.3 State Management & Persistence
10. All form data must persist in local storage throughout the wizard
11. Users must be able to navigate back to previous steps without losing data
12. State must be cleared when starting a new recipe
13. Session storage must backup critical data for recovery

### 4.4 API Integration
14. System must integrate with AromaRx API (https://webhook.daianefreitas.com/webhook/10p_build_recipe_protocols)
15. API calls must include proper authentication headers with server-side API key
16. System must handle API rate limiting and implement retry logic
17. All API calls must go through internal proxy endpoints for security

### 4.5 Error Handling & Recovery
18. System must implement retry mechanism for failed API calls (3 attempts)
19. After retry exhaustion, display user-friendly error message asking to return later
20. Network errors must not crash the application
21. Invalid API responses must be handled gracefully

### 4.6 Mobile-First Design
22. Interface must be optimized for mobile devices (90% of users)
23. Touch-friendly buttons and form controls
24. Responsive design that works on all screen sizes
25. Optimized loading states for mobile networks

## 5. Non-Goals (Out of Scope)

1. **Recipe Saving to Database:** Users cannot save recipes to their account (future MVP)
2. **Recipe History:** No access to previously created recipes (future MVP)
3. **PDF Export:** No PDF generation functionality (future MVP)
4. **Social Sharing:** No WhatsApp or social media sharing (future MVP)
5. **User Analytics:** No tracking of user behavior or completion metrics (future MVP)
6. **Recipe Customization:** No ability to modify suggested recipes (future MVP)
7. **Offline Functionality:** No offline mode support
8. **Multi-language Support:** English/Portuguese only for this MVP

## 6. Design Considerations

### 6.1 UI/UX Requirements
- Follow existing ShadCN UI component library patterns
- Implement progress indicator showing current step (1/6, 2/6, etc.)
- Use card-based layout for each step
- Implement loading skeletons during API calls
- Mobile-first responsive design with touch-optimized controls

### 6.2 Navigation Patterns
- Linear navigation with "Next" and "Back" buttons
- Breadcrumb navigation showing completed steps
- Prevent access to future steps without completing prerequisites
- Allow navigation back to previous steps

### 6.3 Loading States
- Show loading spinners during API calls
- Implement skeleton screens for content loading
- Display progress indicators for multi-step operations
- Optimistic UI updates where appropriate

## 7. Technical Considerations

### 7.1 Architecture Requirements
- Use Next.js App Router with dynamic routes: `/dashboard/create-recipe/[step]`
- Implement Zustand store for state management with persist middleware
- Use React Hook Form for form handling and validation
- Create proxy API route at `/api/create-recipe` for external API integration

### 7.2 State Management
- Zustand store with TypeScript interfaces for type safety
- Local storage persistence for form data
- Session storage backup for critical data
- State hydration on page load

### 7.3 Performance Optimizations
- Code splitting with React Suspense
- Lazy loading of step components
- Optimistic UI updates
- Request deduplication for API calls

### 7.4 Security Requirements
- API key stored server-side only
- All external API calls proxied through internal endpoints
- Input validation and sanitization
- CSRF protection for form submissions

## 8. Success Metrics

### 8.1 Technical Metrics
- Page load time < 2 seconds on mobile
- API response time < 3 seconds
- Error rate < 5% for API calls
- Form completion rate > 80%

### 8.2 User Experience Metrics
- Step completion rate for each wizard step
- Time spent on each step
- Back navigation frequency
- Error recovery success rate

## 9. Open Questions

1. **API Rate Limiting:** What are the exact rate limits for the external API?
2. **Error Logging:** Should we implement detailed error logging for debugging? YES
3. **Caching Strategy:** Should we cache API responses for common health concerns? NOT YET
4. **User Feedback:** Should we collect user satisfaction feedback after recipe generation? NOT YET
5. **Accessibility:** What specific accessibility requirements need to be met? KEYBOARD NAVIGATION, ARIA
6. **Browser Support:** What is the minimum browser version support requirement?
7. **Data Retention:** How long should local storage data be retained? 7 days
8. **Internationalization:** Will Portuguese language support be required for the API responses? Not yet. The API response comes in the language that the API is called with on the `user_language` parameter.

---

**Document Version:** 1.0  
**Created:** [Current Date]  
**Target Audience:** Junior Developer  
**Estimated Development Time:** 2-3 weeks  
**Priority:** High (Main platform feature)
