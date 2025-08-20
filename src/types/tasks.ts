export interface Task {
  task_id: number;
  title: string;
  status: string;
  deadline: string | null;
  created_at: string;
  effort_units: number;
  chapters: {
    title: string;
    subjects: {
      title: string;
      color: string;
    }[] | null;
  }[] | null;
}
