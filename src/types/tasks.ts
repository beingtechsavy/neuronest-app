export interface Task {
  task_id: number;
  title: string;
  task_status: 'breakdown' | 'inbox' | 'scheduled' | 'completed';
  deadline: string | null;
  created_at: string;
  effort_units: number;
  scheduled_date?: string | null;
  is_stressful?: boolean;
  ai_generated?: boolean;
  start_time?: string | null; // New: HH:MM:SS format
  end_time?: string | null;   // New: HH:MM:SS format
  is_critical?: boolean;       // New: Critical task flag for ADHD users
  chapters: {
    title: string;
    subjects: {
      title: string;
      color: string;
    }[] | null;
  }[] | null;
}
