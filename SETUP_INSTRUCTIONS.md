# Setup Instructions for Focus Session + Task Integration 🚀

## Step 1: Run Database Migration

**In your Supabase SQL Editor, run this:**

```sql
-- Simple Migration for Focus Sessions
-- Add only the essential columns to existing table

-- Add task attribution columns
ALTER TABLE focus_sessions 
ADD COLUMN IF NOT EXISTS task_id INTEGER,
ADD COLUMN IF NOT EXISTS subject_id INTEGER,
ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Add foreign key constraints
ALTER TABLE focus_sessions 
ADD CONSTRAINT IF NOT EXISTS focus_sessions_task_id_fkey 
FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE SET NULL;

ALTER TABLE focus_sessions 
ADD CONSTRAINT IF NOT EXISTS focus_sessions_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_focus_sessions_task_id ON focus_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_subject_id ON focus_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_start ON focus_sessions(user_id, start_time);

-- Function to automatically update subject_id from task
CREATE OR REPLACE FUNCTION update_focus_session_subject()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.task_id IS NOT NULL THEN
    -- Get subject_id from the task's chapter
    SELECT s.subject_id INTO NEW.subject_id
    FROM tasks t
    JOIN chapters c ON t.chapter_id = c.chapter_id
    JOIN subjects s ON c.subject_id = s.subject_id
    WHERE t.task_id = NEW.task_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_focus_session_subject ON focus_sessions;
CREATE TRIGGER set_focus_session_subject
  BEFORE INSERT OR UPDATE ON focus_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_focus_session_subject();

-- Function to update task effort_units when session completes
CREATE OR REPLACE FUNCTION update_task_effort_on_session_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND OLD.completed = false AND NEW.task_id IS NOT NULL AND NEW.duration IS NOT NULL THEN
    -- Add session duration to task's effort_units
    UPDATE tasks
    SET effort_units = COALESCE(effort_units, 0) + NEW.duration
    WHERE task_id = NEW.task_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task effort update
DROP TRIGGER IF EXISTS update_task_effort_on_complete ON focus_sessions;
CREATE TRIGGER update_task_effort_on_complete
  AFTER UPDATE ON focus_sessions
  FOR EACH ROW
  WHEN (NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false))
  EXECUTE FUNCTION update_task_effort_on_session_complete();
```

## Step 2: Test the Integration

### **Test Flow:**
1. **Start Focus Session**
   - Click the floating focus widget
   - Modal should appear: "What are you working on?"
   - Select a task or "General Study"

2. **During Session**
   - Task name should appear in widget
   - Subject color indicator visible

3. **Complete Session**
   - Let session finish or stop it
   - Time should be attributed to task/subject

4. **Check Analytics**
   - Visit `/analytics`
   - Subject time should reflect real focus session data

## Step 3: Verify Database

**Check if migration worked:**

```sql
-- Check table structure
\d focus_sessions

-- Should show columns: task_id, subject_id, duration

-- Test a focus session
SELECT * FROM focus_sessions 
WHERE user_id = auth.uid() 
ORDER BY start_time DESC 
LIMIT 5;
```

## Step 4: Verify Subject Time Tracking

**After completing a focus session on a task:**

```sql
-- Check subject time aggregation
SELECT 
  s.title as subject_name,
  SUM(fs.duration) as total_focus_minutes,
  COUNT(fs.session_id) as session_count
FROM focus_sessions fs
JOIN subjects s ON fs.subject_id = s.subject_id
WHERE fs.user_id = auth.uid()
  AND fs.completed = true
  AND fs.duration IS NOT NULL
GROUP BY s.subject_id, s.title
ORDER BY total_focus_minutes DESC;
```

## Troubleshooting

### **If you get "column does not exist" errors:**

1. **Check if migration ran successfully:**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'focus_sessions';
   ```

2. **If columns are missing, run migration again**

3. **Check for any error messages in Supabase logs**

### **If task selection modal doesn't appear:**

1. **Check browser console for errors**
2. **Verify you have tasks in your database:**
   ```sql
   SELECT COUNT(*) FROM tasks WHERE user_id = auth.uid();
   ```

### **If time isn't being attributed:**

1. **Check focus_sessions table:**
   ```sql
   SELECT * FROM focus_sessions 
   WHERE user_id = auth.uid() 
   AND task_id IS NOT NULL;
   ```

2. **Check if triggers are working:**
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE event_object_table = 'focus_sessions';
   ```

## Expected Results

### **After Setup:**
- ✅ Focus sessions show task selection modal
- ✅ Task name appears in floating widget
- ✅ Time is automatically attributed to subjects
- ✅ Analytics show real subject time data
- ✅ Quick continue works for last task

### **Database Changes:**
- ✅ `focus_sessions` table has new columns
- ✅ Automatic triggers populate `subject_id`
- ✅ Task `effort_units` updated on session completion
- ✅ Foreign key constraints maintain data integrity

## Success Indicators

**You'll know it's working when:**

1. **Task Selection Modal** appears when starting focus session
2. **Task Name** shows in floating widget during session
3. **Subject Time** in analytics reflects real focus session data
4. **Quick Continue** shows your last task at the top
5. **Database** has focus session records with task attribution

## Next Steps

Once this is working:
- ✅ **Phase 1 Complete** - Basic task attribution
- ✅ **Phase 2 Complete** - Smart suggestions and quick continue
- 🚀 **Ready for Phase 3** - Advanced features (task switching, etc.)

---

**Need help?** Check the browser console for any error messages and verify the database migration completed successfully.