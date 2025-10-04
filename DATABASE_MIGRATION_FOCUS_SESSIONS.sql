-- Focus Sessions Table Migration
-- Add missing columns to existing focus_sessions table

-- Add missing columns to existing focus_sessions table
ALTER TABLE focus_sessions 
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS task_id INTEGER REFERENCES tasks(task_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES subjects(subject_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS completed_pomodoros INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS was_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update session_type column to be more specific if needed
ALTER TABLE focus_sessions 
ALTER COLUMN session_type TYPE VARCHAR(20),
ALTER COLUMN session_type SET DEFAULT 'work';

-- Update existing columns to use TIMESTAMPTZ for consistency
ALTER TABLE focus_sessions 
ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'UTC',
ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time AT TIME ZONE 'UTC';

-- Set default for start_time if not already set
ALTER TABLE focus_sessions 
ALTER COLUMN start_time SET DEFAULT NOW();

-- Update user_id to have proper constraint
ALTER TABLE focus_sessions 
ALTER COLUMN user_id SET NOT NULL;

-- Indexes for performance
CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_task_id ON focus_sessions(task_id);
CREATE INDEX idx_focus_sessions_subject_id ON focus_sessions(subject_id);
CREATE INDEX idx_focus_sessions_start_time ON focus_sessions(start_time);

-- Row Level Security
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own focus sessions"
  ON focus_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus sessions"
  ON focus_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus sessions"
  ON focus_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus sessions"
  ON focus_sessions FOR DELETE
  USING (auth.uid() = user_id);

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

CREATE TRIGGER set_focus_session_subject
  BEFORE INSERT OR UPDATE ON focus_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_focus_session_subject();

-- Function to update task effort_units when session completes
CREATE OR REPLACE FUNCTION update_task_effort_on_session_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.was_completed = true AND NEW.task_id IS NOT NULL AND NEW.duration IS NOT NULL THEN
    -- Add session duration to task's effort_units
    UPDATE tasks
    SET effort_units = COALESCE(effort_units, 0) + NEW.duration
    WHERE task_id = NEW.task_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_effort_on_complete
  AFTER UPDATE ON focus_sessions
  FOR EACH ROW
  WHEN (NEW.was_completed = true AND OLD.was_completed = false)
  EXECUTE FUNCTION update_task_effort_on_session_complete();