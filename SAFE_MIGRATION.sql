-- Safe Migration for Focus Sessions
-- This version checks if columns exist before adding them

DO $$ 
BEGIN
    -- Add task_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'focus_sessions' AND column_name = 'task_id'
    ) THEN
        ALTER TABLE focus_sessions ADD COLUMN task_id INTEGER;
    END IF;

    -- Add subject_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'focus_sessions' AND column_name = 'subject_id'
    ) THEN
        ALTER TABLE focus_sessions ADD COLUMN subject_id INTEGER;
    END IF;

    -- Add duration column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'focus_sessions' AND column_name = 'duration'
    ) THEN
        ALTER TABLE focus_sessions ADD COLUMN duration INTEGER;
    END IF;
END $$;

-- Add foreign key constraints (only if they don't exist)
DO $$ 
BEGIN
    -- Add task_id foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'focus_sessions_task_id_fkey' 
        AND table_name = 'focus_sessions'
    ) THEN
        ALTER TABLE focus_sessions 
        ADD CONSTRAINT focus_sessions_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE SET NULL;
    END IF;

    -- Add subject_id foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'focus_sessions_subject_id_fkey'
        AND table_name = 'focus_sessions'
    ) THEN
        ALTER TABLE focus_sessions 
        ADD CONSTRAINT focus_sessions_subject_id_fkey 
        FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add indexes (safe to run multiple times)
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

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS set_focus_session_subject ON focus_sessions;
CREATE TRIGGER set_focus_session_subject
  BEFORE INSERT OR UPDATE ON focus_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_focus_session_subject();

-- Function to update task effort_units when session completes
CREATE OR REPLACE FUNCTION update_task_effort_on_session_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) 
     AND NEW.task_id IS NOT NULL AND NEW.duration IS NOT NULL THEN
    -- Add session duration to task's effort_units
    UPDATE tasks
    SET effort_units = COALESCE(effort_units, 0) + NEW.duration
    WHERE task_id = NEW.task_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task effort update (drop first if exists)
DROP TRIGGER IF EXISTS update_task_effort_on_complete ON focus_sessions;
CREATE TRIGGER update_task_effort_on_complete
  AFTER UPDATE ON focus_sessions
  FOR EACH ROW
  WHEN (NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false))
  EXECUTE FUNCTION update_task_effort_on_session_complete();