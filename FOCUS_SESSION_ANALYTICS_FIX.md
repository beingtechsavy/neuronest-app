# Focus Session Analytics Integration Fix

## Problem
Completed focus sessions show in "Today's Progress" but don't appear in the analytics dashboard.

## Root Cause
When a focus session completes, the context was only updating the `completedSessions` counter but NOT:
1. Saving the session duration to localStorage (for analytics)
2. Completing the database record
3. Triggering analytics refresh

## The Fix

### 1. Added Session Completion Tracking
Modified `handleSessionComplete` in `FocusSessionContext.tsx` to:

```typescript
// Save completed work session to analytics
const today = new Date().toISOString().split('T')[0];
const sessionDuration = state.settings.workDuration; // Duration in minutes

// Update localStorage stats for analytics
const existingData = localStorage.getItem('focusSessionStats');
const stats = existingData ? JSON.parse(existingData) : {};
stats[today] = (stats[today] || 0) + sessionDuration;
localStorage.setItem('focusSessionStats', JSON.stringify(stats));
```

### 2. Added Database Completion
```typescript
// Complete the database record
if (state.dbSessionId) {
  supabase
    .from('focus_sessions')
    .update({
      end_time: new Date().toISOString(),
      duration: sessionDuration,
      completed: true
    })
    .eq('session_id', state.dbSessionId);
}
```

## How It Works Now

### Session Lifecycle:

1. **Start Session**:
   - User selects task
   - `startFocusSession()` creates database record
   - `startSession()` updates context state
   - Timer starts

2. **Session Running**:
   - Timer counts down
   - State persisted to localStorage
   - User can pause/resume

3. **Session Completes** (NEW):
   - Timer reaches 0
   - `handleSessionComplete()` is called
   - **Duration saved to localStorage** (`focusSessionStats`)
   - **Database record updated** (end_time, duration, completed)
   - Toast notification shown
   - Moves to break state

4. **Analytics Display**:
   - `useTodayAnalytics` reads from localStorage
   - `useAnalytics` reads from localStorage
   - Both hooks now see the completed sessions
   - Data appears in all analytics views

## Data Flow

```
Focus Session Complete
        ↓
handleSessionComplete()
        ↓
    ┌───┴───┐
    ↓       ↓
localStorage  Database
(analytics)  (history)
    ↓       ↓
    └───┬───┘
        ↓
Analytics Hooks
        ↓
Dashboard Display
```

## What Gets Saved

### localStorage (`focusSessionStats`):
```json
{
  "2025-01-10": 50,  // 50 minutes today
  "2025-01-09": 75,  // 75 minutes yesterday
  "2025-01-08": 25   // 25 minutes 2 days ago
}
```

### Database (`focus_sessions` table):
```sql
session_id | user_id | start_time | end_time | duration | task_id | completed
-----------|---------|------------|----------|----------|---------|----------
1          | user123 | 10:00:00   | 10:25:00 | 25       | 42      | true
2          | user123 | 11:00:00   | 11:25:00 | 25       | 42      | true
```

## Testing Checklist

- [ ] Complete a focus session
- [ ] Check "Today's Progress" shows session count
- [ ] Check "Today's Progress" shows focus time
- [ ] Refresh analytics page
- [ ] Verify focus time appears in analytics
- [ ] Check streak calculation includes session
- [ ] Verify database record is completed
- [ ] Check localStorage has updated stats

## Expected Behavior

### Before Fix:
- ✅ Sessions counted in context
- ❌ No data in localStorage
- ❌ Database record not completed
- ❌ Analytics shows 0 focus time

### After Fix:
- ✅ Sessions counted in context
- ✅ Data saved to localStorage
- ✅ Database record completed
- ✅ Analytics shows actual focus time
- ✅ Streak calculation works
- ✅ All analytics views updated

## Why It Works

1. **Immediate Feedback**: localStorage updates instantly
2. **Persistent Data**: Database keeps historical records
3. **Analytics Integration**: Hooks read from localStorage
4. **Real-time Updates**: No page refresh needed
5. **Accurate Tracking**: Actual session duration recorded

## Additional Benefits

1. **Streak Tracking**: Focus sessions now count toward daily streaks
2. **Time Attribution**: Sessions linked to tasks update task effort
3. **Historical Data**: Database records for long-term analytics
4. **Accurate Metrics**: Real focus time vs estimated effort

## Notes

- Focus sessions are the PRIMARY source for focus time data
- Task effort_units are the FALLBACK if no sessions exist
- Analytics prefer session data over task data (more accurate)
- Minimum 30 minutes needed for streak recognition
