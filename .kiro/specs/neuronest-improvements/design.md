# Design Document

## Overview

This design addresses seven critical improvements to NeuroNest: fixing the signup confirmation redirect URL, removing visible layout boxes from authentication pages, optimizing drag-and-drop functionality, implementing hover-based stress marking for tasks in the weekly view, integrating Vercel Analytics for usage tracking, cleaning up the top bar navigation, and displaying usernames instead of email addresses.

## Architecture

### 1. Authentication Flow Fix

**Problem Analysis:**
The current signup flow uses `location.origin` which resolves to `localhost:3000` in development, causing production confirmation emails to redirect to localhost instead of the deployed Vercel URL.

**Solution:**
- Implement environment-aware redirect URL configuration
- Use `NEXT_PUBLIC_SITE_URL` environment variable for production deployments
- Fallback to `location.origin` for development environments
- Update Supabase auth configuration to use the correct redirect URL

### 2. Layout Box Visibility Fix

**Problem Analysis:**
The `RootLayoutInner` component applies `px-4 py-6` padding to all pages, including login/signup, creating visible layout containers that break the immersive design.

**Solution:**
- Conditionally apply main container styling based on route
- Remove padding for authentication pages (`/login`, `/signup`)
- Maintain existing layout for authenticated pages
- Preserve the clean, full-screen design for auth pages

### 3. Drag-and-Drop Optimization

**Problem Analysis:**
Current implementation has time calculation inconsistencies in the `robustTimeToMinutes` function and grid positioning logic that can cause time slot mismatches.

**Solution:**
- Enhance time calculation precision with proper UTC handling
- Implement robust error handling for drag operations
- Add visual feedback for successful/failed drops
- Improve grid positioning calculations for accurate time slot mapping
- Add validation to prevent invalid time assignments

### 4. Hover-Based Stress Marking

**Problem Analysis:**
Currently, there's no quick way to mark tasks as stressful directly from the weekly view without opening modals.

**Solution:**
- Add hover state detection to task components
- Implement stress indicator icon overlay on hover
- Create click handler for toggling stress status
- Provide immediate visual feedback for stress state changes
- Persist changes to database with error handling

### 5. Vercel Analytics Integration

**Problem Analysis:**
Currently, there's no way to track user engagement, page views, or application performance metrics, making it difficult to understand user behavior and optimize the application.

**Solution:**
- Install and configure `@vercel/analytics` package
- Initialize analytics in the root layout component
- Track page views automatically with Next.js App Router
- Implement custom event tracking for key user actions
- Ensure privacy compliance and graceful degradation

### 6. Top Bar Navigation Cleanup

**Problem Analysis:**
The current top bar shows signup/login options even when users are authenticated, creating visual clutter and redundant navigation elements.

**Solution:**
- Conditionally render navigation elements based on authentication state
- Remove signup/login links for authenticated users
- Maintain clean spacing and alignment after element removal
- Preserve essential navigation for authenticated users
- Ensure proper responsive behavior

### 7. Username Display Enhancement

**Problem Analysis:**
The top bar currently displays the user's email address, which can be long, less personal, and potentially privacy-sensitive.

**Solution:**
- Fetch and display username from user profile data
- Implement fallback to email if username is unavailable
- Add proper text truncation for long usernames
- Handle loading states gracefully
- Ensure consistent formatting across the interface

## Components and Interfaces

### 1. Enhanced Signup Component
```typescript
interface SignupPageProps {
  // No props needed - uses environment variables
}

// Environment configuration
const getRedirectUrl = (): string => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
};
```

### 2. Conditional Layout Component
```typescript
interface RootLayoutInnerProps {
  children: ReactNode;
}

// Route-based styling logic
const getMainClassName = (pathname: string): string => {
  const authPages = ['/', '/login', '/signup'];
  return authPages.includes(pathname) ? '' : 'px-4 py-6';
};
```

### 3. Enhanced DraggableTask Component
```typescript
interface DraggableTaskProps {
  task: CalendarTask;
  style: React.CSSProperties;
  onClick: () => void;
  onStressToggle: (taskId: string, isStressful: boolean) => Promise<void>;
}

interface TaskHoverState {
  isHovered: boolean;
  showStressIcon: boolean;
}
```

### 4. Improved Time Calculation Utilities
```typescript
interface TimeCalculationResult {
  gridStart: number;
  gridEnd: number;
  isValid: boolean;
  error?: string;
}

const calculateGridPosition = (startTime: string, endTime: string): TimeCalculationResult;
const validateTimeSlot = (date: Date, startTime: Date, endTime: Date): boolean;
```

### 5. Analytics Integration Component
```typescript
interface AnalyticsConfig {
  enabled: boolean;
  debug?: boolean;
}

// Analytics event tracking
interface CustomEvent {
  name: string;
  properties?: Record<string, any>;
}

const trackEvent = (event: CustomEvent): void;
const trackPageView = (path: string): void;
```

### 6. Enhanced TopBar Component
```typescript
interface TopBarProps {
  user: User | null;
  isAuthenticated: boolean;
}

interface NavigationItem {
  label: string;
  href: string;
  showWhenAuthenticated: boolean;
  showWhenUnauthenticated: boolean;
}
```

### 7. User Profile Display Component
```typescript
interface UserDisplayProps {
  user: User;
  showEmail?: boolean;
  maxLength?: number;
}

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
```

## Data Models

### 1. Environment Configuration
```typescript
interface EnvironmentConfig {
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}
```

### 2. Enhanced Task Interface
```typescript
interface CalendarTask {
  task_id: string;
  title: string;
  start_time?: string;
  end_time?: string;
  is_stressful?: boolean;
  chapters?: {
    subjects?: {
      color: string;
    };
  };
}
```

### 3. Drag Operation State
```typescript
interface DragOperationState {
  isDragging: boolean;
  originalPosition: { gridStart: number; gridEnd: number };
  targetPosition?: { gridStart: number; gridEnd: number };
  isValidDrop: boolean;
}
```

### 4. Analytics Event Data
```typescript
interface AnalyticsEvent {
  event_name: string;
  timestamp: Date;
  user_id?: string;
  page_path: string;
  properties?: Record<string, any>;
}

interface PageViewEvent extends AnalyticsEvent {
  event_name: 'page_view';
  referrer?: string;
  user_agent?: string;
}
```

## Error Handling

### 1. Authentication Errors
- Handle network failures during signup
- Provide clear feedback for invalid email formats
- Manage Supabase authentication errors gracefully
- Implement retry mechanisms for failed operations

### 2. Drag-and-Drop Errors
- Validate time slot availability before drop
- Revert to original position on failed operations
- Show user-friendly error messages for conflicts
- Handle database update failures with rollback

### 3. Stress Marking Errors
- Handle database connection issues
- Provide visual feedback for failed updates
- Implement optimistic UI updates with rollback
- Log errors for debugging purposes

### 4. Analytics Errors
- Handle analytics initialization failures gracefully
- Ensure application continues functioning if analytics fails
- Implement fallback tracking mechanisms
- Respect user privacy preferences and opt-outs

### 5. Top Bar Navigation Errors
- Handle authentication state changes smoothly
- Manage loading states during user data fetch
- Provide fallbacks for missing user information
- Handle responsive layout edge cases

### 6. Username Display Errors
- Handle missing username data gracefully
- Provide appropriate fallbacks (email, placeholder)
- Manage text truncation edge cases
- Handle special characters in usernames

## Testing Strategy

### 1. Authentication Flow Testing
- Test signup with various email formats
- Verify redirect URL in different environments
- Test confirmation email flow end-to-end
- Validate error handling for network issues

### 2. Layout Rendering Testing
- Verify clean layout on auth pages
- Test responsive behavior across devices
- Validate proper padding on authenticated pages
- Check for visual regressions

### 3. Drag-and-Drop Testing
- Test drag operations across different time slots
- Verify time accuracy after drops
- Test edge cases (midnight, overlapping times)
- Validate error handling for invalid drops

### 4. Stress Marking Testing
- Test hover interactions on various devices
- Verify database persistence of stress status
- Test rapid clicking scenarios
- Validate visual feedback consistency

### 5. Analytics Integration Testing
- Test analytics initialization in different environments
- Verify event tracking accuracy
- Test privacy compliance features
- Validate graceful degradation when analytics fails

### 6. Top Bar Navigation Testing
- Test navigation visibility with different auth states
- Verify responsive behavior across screen sizes
- Test smooth transitions between auth states
- Validate proper spacing and alignment

### 7. Username Display Testing
- Test username fetching and display
- Verify fallback behavior for missing usernames
- Test text truncation with various username lengths
- Validate formatting consistency across components

## Implementation Considerations

### 1. Environment Variables
- Add `NEXT_PUBLIC_SITE_URL` to Vercel deployment
- Ensure proper fallback for development
- Document environment setup requirements

### 2. Performance Optimization
- Minimize re-renders during drag operations
- Debounce stress status updates
- Optimize hover state calculations
- Cache time calculation results where appropriate

### 3. Accessibility
- Ensure stress marking is keyboard accessible
- Provide screen reader support for drag operations
- Maintain proper focus management
- Add ARIA labels for interactive elements

### 4. Browser Compatibility
- Test drag-and-drop across different browsers
- Ensure hover states work on touch devices
- Validate time calculations in different timezones
- Handle browser-specific quirks gracefully

### 5. Analytics Implementation
- Configure analytics to respect user privacy
- Implement GDPR-compliant tracking
- Optimize analytics bundle size
- Use environment variables for analytics configuration

### 6. Navigation State Management
- Implement efficient auth state detection
- Minimize re-renders during auth changes
- Cache user profile data appropriately
- Handle concurrent auth state updates

### 7. User Experience Enhancements
- Implement smooth loading states for username
- Add subtle animations for navigation changes
- Ensure consistent typography and spacing
- Optimize for accessibility and screen readers