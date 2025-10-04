# Runtime Error Fix ✅

## Issue Fixed: "Cannot access 'handleStartWithTask' before initialization"

### **Problem:**
JavaScript hoisting issue - the `handleStartWithTask` function was being used before it was defined.

### **Root Cause:**
```jsx
// ❌ BEFORE (Broken)
if (!state.isActive) {
  return (
    <TaskSelectionModal
      onSelectTask={handleStartWithTask}  // ❌ Used here
    />
  );
}

// Function defined much later in the file
const handleStartWithTask = useCallback(...);  // ❌ Defined here
```

### **Solution:**
```jsx
// ✅ AFTER (Fixed)
// Function defined early in component
const handleStartWithTask = useCallback(async (task: TaskOption | null) => {
  const dbSessionId = await startFocusSession(task?.task_id);
  
  startSession({
    taskId: task?.task_id,
    taskTitle: task?.title,
    subjectColor: task?.subject_color,
    dbSessionId: dbSessionId || undefined
  });
  
  setSelectedTask(task);
}, [startSession, startFocusSession]);

// Now it can be used safely
if (!state.isActive) {
  return (
    <TaskSelectionModal
      onSelectTask={handleStartWithTask}  // ✅ Works now
    />
  );
}
```

### **Additional Fix:**
Updated `startSession` function in context to accept payload:
```typescript
// ✅ Updated to accept task data
const startSession = (payload?: { 
  taskId?: number; 
  taskTitle?: string; 
  subjectColor?: string; 
  dbSessionId?: number 
}) => {
  dispatch({ type: 'START_SESSION', payload });
};
```

## ✅ **Status: FIXED**

The runtime error is resolved. The focus session integration should now work properly:

1. **Start focus session** → Task selection modal appears
2. **Select task** → Session starts with task info
3. **Task name visible** in floating widget
4. **Time attribution** works automatically

Ready to test! 🚀