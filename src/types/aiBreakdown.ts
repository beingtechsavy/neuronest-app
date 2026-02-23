// AI Breakdown type definitions matching database schema

export interface TaskBreakdownStep {
  step: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedMinutes: number;
  order: number;
  completionCriteria: string;
  encouragement?: string;
}

export interface AIBreakdown {
  id: number;
  user_id: string;
  original_task_title: string;
  original_task_description: string | null;
  subject: string | null;
  deadline: string | null;
  breakdown_steps: TaskBreakdownStep[];
  steps_count: number;
  created_at: string;
  subject_id: number | null;
  chapter_id: number | null;
  save_type: 'new_subject' | 'existing_subject' | 'new_chapter' | 'individual_tasks' | null;
  completion_rate: number;
  total_estimated_minutes: number | null;
}

export interface BreakdownListItem {
  id: number;
  original_task_title: string;
  created_at: string;
  completion_rate: number;
  steps_count: number;
  subject: string | null;
}
