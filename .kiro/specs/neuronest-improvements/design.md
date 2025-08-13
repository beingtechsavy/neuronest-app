# Design Document

## Overview

This design addresses four critical improvements to NeuroNest: fixing the signup confirmation redirect URL, removing visible layout boxes from authentication pages, optimizing drag-and-drop functionality, and implementing hover-based stress marking for tasks in the weekly view.

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