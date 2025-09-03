export interface StudyStreak {
  current: number;
  longest: number;
  lastActiveDate: string | null;
}

export interface ProductivityData {
  date: string;
  tasksCompleted: number;
  timeSpent: number; // in minutes
  subjectsStudied: number;
}

export interface SubjectProgress {
  subject_id: number;
  title: string;
  color: string;
  totalChapters: number;
  completedChapters: number;
  totalTasks: number;
  completedTasks: number;
  timeSpent: number; // in minutes
  completionRate: number; // percentage
  averageEffort: number;
  stressLevel: 'low' | 'medium' | 'high';
}

export interface TimeAnalytics {
  totalStudyTime: number; // in minutes
  averageSessionLength: number;
  mostProductiveHour: number;
  studyDaysThisWeek: number;
  studyDaysThisMonth: number;
}

export interface CompletionTrends {
  daily: { date: string; completed: number; total: number }[];
  weekly: { week: string; completed: number; total: number }[];
  monthly: { month: string; completed: number; total: number }[];
}

export interface StudyInsights {
  streak: StudyStreak;
  productivity: ProductivityData[];
  subjectProgress: SubjectProgress[];
  timeAnalytics: TimeAnalytics;
  completionTrends: CompletionTrends;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  progress: number; // 0-100
  target: number;
  category: 'streak' | 'completion' | 'time' | 'subject';
}