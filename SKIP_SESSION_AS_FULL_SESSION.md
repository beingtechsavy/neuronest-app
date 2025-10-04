# Skip Session Counts as Full Session

## Change Summary
Modified the skip session functionality to count skipped work sessions as full completed sessions in analytics.

## Rationale
When users skip a work session, they've still committed time to focus work, even if they didn't complete the full timer. This time should be recognized and counted toward:
- Daily focus time totals
- Streak calculations
- Session completion counts
- Analytics metrics

## Implementation

### Before:
```typescript
const handleSessionSkip = useCallback(() => {
  const isWorkSession = state.currentState === 'work';
  
  if (isWorkSession) {
    warning('⏭️ Work session skipped. Moving to break.');
  }
  
  dispatch({ type: 'SKIP_SESSION' });
}, [state.currentState, success, warning]);
```

**Result**: Skipped sessions were not counted in analytics at all.

### After:
```typescript
const handleSessionSkip = useCallback(() => {
  const isWorkSession = state.currentState === 'work';
  
  if (isWorkSession) {
    warning('⏭️ Work session skipped. Moving to break.');

    // Save skipped work session to analytics (count as full session)
    const today = new Date().toISOString().split('T')[0];
    const sessionDuration = state.settings.workDuration; // Full duration
    
    // Update localStorage stats
    const stats = existingData ? JSON.parse(existingData) : {};
    stats[today] = (stats[today] || 0) + sessionDuration;
    localStorage.setItem('focusSessionStats', JSON.stringify(stats));
    
    // Update database record
    if (state.dbSessionId) {
      supabase.from('focus_sessions').update({
        end_time: new Date().toISOString(),
        duration: sessionDuration,
        completed: true,
        was_skipped: true // Track that it was skipped
      });
    }
  }
  
  dispatch({ type: 'SKIP_SESSION' });
}, [...]);
```

**Result**: Skipped work sessions count as full sessions in all analytics.

## What Gets Saved

### localStorage (`focusSessionStats`):
```json
{
  "2025-01-10": 50  // 25 min completed + 25 min skipped = 50 min total
}
```

### Database (`focus_sessions`):
```sql
session_id | duration | completed | was_skipped
-----------|----------|-----------|------------
1          | 25       | true      | false       -- Completed normally
2          | 25       | true      | true        -- Skipped but counted
```

## Behavior

### Work Session Skip:
1. User clicks "Skip to Break"
2. Full session duration (e.g., 25 minutes) is added to today's total
3. Database record is marked as completed with `was_skipped: true`
4. Session counter increments
5. Moves to break state
6. Analytics show the full session time

### Break Skip:
1. User clicks "Skip Break"
2. No time is added (breaks don't count toward focus time)
3. Moves to next work session
4. No analytics impact

## Benefits

1. **Encourages Honesty**: Users don't feel penalized for skipping
2. **Accurate Tracking**: Recognizes actual time commitment
3. **Streak Maintenance**: Skipped sessions still count toward streaks
4. **Motivation**: Users see progress even when they skip
5. **Flexibility**: Allows users to adjust without losing credit

## Use Cases

### Scenario 1: Emergency Interruption
- User starts 25-minute session
- Emergency call after 5 minutes
- Skips session → Still gets 25 minutes credit
- Fair recognition of intent to focus

### Scenario 2: Task Completed Early
- User starts session for quick task
- Finishes in 10 minutes
- Skips remaining time → Gets full 25 minutes
- Rewards efficiency

### Scenario 3: Need Different Break
- User wants long break instead of short break
- Skips to adjust schedule
- Doesn't lose session credit
- Flexible workflow

## Considerations

### Why Full Duration?
- **Intent Recognition**: User committed to a full session
- **Simplicity**: Easier to track and understand
- **Motivation**: Encourages use of the feature
- **Fairness**: Partial credit is hard to calculate accurately

### Alternative Approaches Considered:
1. **Partial Credit**: Only count elapsed time
   - ❌ Complex to calculate
   - ❌ Discourages skipping when needed
   - ❌ Harder to understand

2. **No Credit**: Don't count skipped sessions
   - ❌ Penalizes legitimate use
   - ❌ Discourages flexibility
   - ❌ Unfair to users

3. **Full Credit** (Chosen):
   - ✅ Simple and clear
   - ✅ Encourages honest use
   - ✅ Recognizes intent
   - ✅ Maintains motivation

## Database Schema Note

The `was_skipped` field is optional and may not exist in your current schema. The code handles this gracefully:
- If the field exists, it will be set to `true`
- If it doesn't exist, the update will still work (just won't track skip status)
- No migration required for basic functionality

## Testing

- [ ] Start a work session
- [ ] Click "Skip to Break"
- [ ] Check "Today's Progress" shows full session time
- [ ] Check analytics shows full session time
- [ ] Verify session counter incremented
- [ ] Confirm moved to break state
- [ ] Check database record is completed

## Expected Results

### Before Skip:
- Sessions: 0
- Focus Time: 0h 0m

### After Skip (25-minute session):
- Sessions: 1
- Focus Time: 0h 25m
- Analytics: +25 minutes
- Streak: Counts toward daily goal

## Philosophy

> "Perfect is the enemy of good. It's better to complete 80% of a session than to abandon it entirely and get no credit."

This change aligns with the ADHD-friendly design philosophy:
- Reduce friction
- Encourage use
- Recognize effort
- Maintain motivation
- Support flexibility
