-- Simple Migration for Focus Sessions
-- Add only the essential columns to existing table

-- Add task attribution columns
ALTER TABLE focus_sessions 
ADD COLUMN IF NOT EXISTS task_id INTEGER,
ADD COLUMN IF NOT EXISTS subject_id INTEGER,
ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Add foreign key constraints (drop first if they exist)
DO $$ 
BEGIN
    -- Add task_id foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'focus_sessions_task_id_fkey'
    ) THEN
        ALTER TABLE focus_sessions 
        ADD CONSTRAINT focus_sessions_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE SET NULL;
    END IF;

    -- Add subject_id foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'focus_sessions_subject_id_fkey'
    ) THEN
        ALTER TABLE focus_sessions 
        ADD CONSTRAINT focus_sessions_subject_id_fkey 
        FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE SET NULL;
    END IF;
END $$;

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