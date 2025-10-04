-- Fixed Migration for Focus Sessions
-- Step-by-step migration that works with PostgreSQL

-- Step 1: Add columns
ALTER TABLE focus_sessions ADD COLUMN task_id INTEGER;
ALTER TABLE focus_sessions ADD COLUMN subject_id INTEGER;  
ALTER TABLE focus_sessions ADD COLUMN duration INTEGER;

-- Step 2: Add foreign key constraints
ALTER TABLE focus_sessions 
ADD CONSTRAINT focus_sessions_task_id_fkey 
FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE SET NULL;

ALTER TABLE focus_sessions 
ADD CONSTRAINT focus_sessions_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE SET NULL;

-- Step 3: Add indexes for performance
CREATE INDEX idx_focus_sessions_task_id ON focus_sessions(task_id);
CREATE INDEX idx_focus_sessions_subject_id ON focus_sessions(subject_id);
CREATE INDEX idx_focus_sessions_user_start ON focus_sessions(user_id, start_time);

-- Step 4: Function to automatically update subject_id from task
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

-- Step 5: Create trigger
DROP TRIGGER IF EXISTS set_focus_session_subject ON focus_sessions;
CREATE TRIGGER set_focus_session_subject
  BEFORE INSERT OR UPDATE ON focus_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_focus_session_subject();

-- Step 6: Function to update task effort_units when session completes
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

-- Step 7: Create trigger for task effort update
DROP TRIGGER IF EXISTS update_task_effort_on_complete ON focus_sessions;
CREATE TRIGGER update_task_effort_on_complete
  AFTER UPDATE ON focus_sessions
  FOR EACH ROW
  WHEN (NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false))
  EXECUTE FUNCTION update_task_effort_on_session_complete();