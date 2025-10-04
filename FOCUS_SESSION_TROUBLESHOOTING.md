# Focus Session Troubleshooting Guide

## Issue: Old Interface Still Showing

If you're still seeing the old focus session interface (with "Focus Time" button and 25:00 timer), this is because there's a persisted session state in your browser's localStorage.

## Quick Fix Options

### Option 1: Use the Reset Button (Recommended)
1. Look for the **"🔄 Reset All Sessions"** button in the Quick Actions sidebar
2. Click it to clear all session data and refresh the page
3. You should now see the new task selection interface

### Option 2: Manual Browser Reset
1. Open your browser's Developer Tools (F12)
2. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **Local Storage** → **localhost:3000**
4. Delete the key `focusSessionState`
5. Refresh the page

### Option 3: Clear All Browser Data
1. In your browser settings, clear all site data for localhost:3000
2. Refresh the page

## What You Should See After Reset

### New Task Selection Interface:
- **"Ready to focus?"** heading
- **"Choose Task & Start"** button (blue/purple gradient)
- **"Start General Session"** button (gray)
- Clean, modern interface without the old red "Focus Time" button

### During Active Session:
- Current task display with subject color
- **"Change Task"** option
- **"Pause Session"** / **"Resume Session"** buttons
- Floating widget (if enabled)

## New Features Available

1. **Task Linking**: All sessions can be linked to specific tasks for better tracking
2. **Task Continuation**: Resume where you left off with your last task
3. **Floating Widget Control**: Hide/show the floating widget without ending sessions
4. **Better Session Management**: Clear separation between hiding widget and ending sessions

## If Issues Persist

1. Try the **"Start Fresh Session"** button when a session is active
2. Use the **"Reset All Sessions"** button in Quick Actions
3. Check that you don't have multiple tabs open with the focus session page
4. Ensure you're on the latest version of the code

## Expected Behavior

- **No Active Session**: Shows task selection UI
- **Active Session (Paused)**: Shows session controls + option to change task or start fresh
- **Active Session (Running)**: Shows timer with pause/resume controls
- **Floating Widget**: Can be hidden/shown independently of session state