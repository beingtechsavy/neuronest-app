# TypeScript Build Error Fix

## Error
```
Type error: Expected 0 arguments, but got 1.

startSession({
  taskId: task?.task_id,
  taskTitle: task?.title,
  subjectColor: task?.subject_color,
  dbSessionId: dbSessionId || undefined
});
```

## Root Cause
The `FocusSessionContextType` interface defined `startSession` as taking no arguments:
```typescript
startSession: () => void;
```

But the actual implementation accepts an optional payload:
```typescript
const startSession = (payload?: { 
  taskId?: number; 
  taskTitle?: string; 
  subjectColor?: string; 
  dbSessionId?: number 
}) => {
  dispatch({ type: 'START_SESSION', payload });
};
```

## Fix
Updated the interface to match the implementation:
```typescript
interface FocusSessionContextType {
  startSession: (payload?: { 
    taskId?: number; 
    taskTitle?: string; 
    subjectColor?: string; 
    dbSessionId?: number 
  }) => void;
  // ... other methods
}
```

## Why This Happened
When we added task attribution to focus sessions, we updated the implementation to accept task data but forgot to update the TypeScript interface.

## Verification
- ✅ TypeScript compilation passes
- ✅ Interface matches implementation
- ✅ All call sites are valid
- ✅ Optional parameter allows backward compatibility

## Related Files
- `src/contexts/FocusSessionContext.tsx` - Interface and implementation
- `src/app/focus-session/page.tsx` - Usage with task data
- `src/components/FloatingFocusWidget.tsx` - Usage with task data
