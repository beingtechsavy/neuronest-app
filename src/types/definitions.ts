// This file will be the single source of truth for your data types.

export interface Subject {
      subject_id: number;
      title: string;
      color: string;
      is_stressful: boolean;
    }
    
    export interface Chapter {
      chapter_id: number;
      title: string;
      order_idx: number;
      completed: boolean;
      is_stressful: boolean;
    }
    
    export interface Task {
      task_id: number;
      title: string;
      status: 'pending' | 'completed';
      is_stressful: boolean;
    }
    