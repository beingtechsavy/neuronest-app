---
inclusion: always
---

# Development Standards & Best Practices

## TypeScript Requirements
- **Strict typing**: Never use `any` - define proper interfaces in `src/types/`
- **Type imports**: Use `import type` for type-only imports
- **Null safety**: Always check for null/undefined before accessing properties
- **Interface naming**: Use descriptive names (e.g., `TaskWithRelations`, `UserProfile`)

## Error Handling Patterns
- **User feedback**: Use `useToast()` hook instead of console.log or alerts
- **Async operations**: Wrap in try-catch blocks with user-friendly error messages
- **Form validation**: Validate inputs client-side before API calls
- **Supabase errors**: Handle auth and database errors gracefully with specific messages

## React Component Standards
- **Client directive**: Only use `'use client'` when component needs interactivity
- **Hook placement**: Business logic in custom hooks, UI logic in components
- **Props typing**: Define interfaces for all component props
- **Cleanup**: Return cleanup functions in useEffect for subscriptions/listeners

## Memory Management
- **Supabase subscriptions**: Always unsubscribe in useEffect cleanup
- **Timeouts/intervals**: Use `useTimeout` hook or manual cleanup
- **Event listeners**: Remove in useEffect return function
- **Dependencies**: Verify useEffect dependency arrays to prevent memory leaks

## User Experience Requirements
- **Loading states**: Show spinners/skeletons during async operations
- **Empty states**: Display helpful messages when no data exists
- **Confirmations**: Use `useConfirm()` hook instead of window.confirm
- **Feedback**: Toast notifications for all success/error states

## Performance Optimization
- **Input debouncing**: Use `usePerformance` hook for search/form inputs
- **Memoization**: Apply React.memo, useMemo, useCallback for expensive operations
- **Re-render prevention**: Optimize dependency arrays and prop drilling
- **Event throttling**: Throttle scroll, resize, and frequent mouse events

## Available Custom Hooks
- `useToast()` - Toast notifications (success, error, warning, info)
- `useConfirm()` - Modal confirmations replacing window.confirm
- `useTimeout()` - Managed timeout cleanup
- `usePerformance()` - Debouncing and throttling utilities

## Code Quality Enforcement
- **No console logs**: Use toast notifications for user feedback
- **Accessibility**: Include ARIA labels, keyboard navigation, semantic HTML
- **Input sanitization**: Validate and sanitize all user inputs for security
- **Error boundaries**: Wrap error-prone components with ErrorBoundary

## Supabase Integration Patterns
- **Auth helpers**: Use Next.js Supabase auth helpers for session management
- **Real-time**: Subscribe to database changes for live updates
- **RLS policies**: Ensure Row Level Security is properly configured
- **Type generation**: Use generated types from Supabase CLI