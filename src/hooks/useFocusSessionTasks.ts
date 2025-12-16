import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';

export interface TaskOption {
  task_id: number;
  title: string;
  subject_title: string;
  subject_color: string;
  chapter_title: string;
  deadline?: string;
  is_today: boolean;
}

export interface FocusSession {
  session_id?: number;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  task_id?: number;
  subject_id?: number;
  session_type: 'work' | 'break' | 'general';
  completed_pomodoros: number;
  was_completed: boolean;
}

export function useFocusSessionTasks() {
  const user = useUser();
  const [availableTasks, setAvailableTasks] = useState<TaskOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastTask, setLastTask] = useState<TaskOption | null>(null);

  // Fetch available tasks for focus session
  const fetchAvailableTasks = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get tasks that are not completed, prioritizing today's tasks
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          task_id,
          title,
          deadline,
          scheduled_date,
          chapters (
            title,
            subjects (
              subject_id,
              title,
              color
            )
          )
        `)
        .eq('user_id', user.id)
        .neq('task_status', 'completed')
        .order('scheduled_date', { ascending: true, nullsFirst: false })
        .limit(10);

      if (error) throw error;

      const taskOptions: TaskOption[] = (tasks || []).map(task => {
        // Handle the nested relation structure
        const chapter = task.chapters as any;
        const subject = chapter?.subjects as any;
        
        return {
          task_id: task.task_id,
          title: task.title,
          subject_title: subject?.title || 'No Subject',
          subject_color: subject?.color || '#6366f1',
          chapter_title: chapter?.title || 'No Chapter',
          deadline: task.deadline,
          is_today: task.scheduled_date === today
        };
      });

      setAvailableTasks(taskOptions);

      // Get last used task from localStorage
      const lastTaskId = localStorage.getItem('lastFocusTask');
      if (lastTaskId) {
        const lastTaskOption = taskOptions.find(t => t.task_id === parseInt(lastTaskId));
        if (lastTaskOption) {
          setLastTask(lastTaskOption);
        }
      }

    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Start a new focus session
  const startFocusSession = useCallback(async (taskId?: number): Promise<number | null> => {
    if (!user) return null;

    try {
      // Prepare the insert data with existing schema
      const insertData: any = {
        user_id: user.id,
        start_time: new Date().toISOString(),
        session_type: taskId ? 'work' : 'general',
        completed: false
      };

      // Add task_id if provided (after migration)
      if (taskId) {
        insertData.task_id = taskId;
      }

      const { data, error } = await supabase
        .from('focus_sessions')
        .insert(insertData)
        .select('session_id')
        .single();

      if (error) {
        console.error('Database error:', error);
        // Fallback: try with minimal data
        const fallbackData = {
          user_id: user.id,
          start_time: new Date().toISOString(),
          session_type: taskId ? 'work' : 'general'
        };
        
        const { data: fallbackResult, error: fallbackError } = await supabase
          .from('focus_sessions')
          .insert(fallbackData)
          .select('session_id')
          .single();
          
        if (fallbackError) throw fallbackError;
        
        // Save task info to localStorage as backup
        if (taskId) {
          localStorage.setItem('currentFocusTask', JSON.stringify({
            taskId,
            sessionId: fallbackResult.session_id,
            startTime: new Date().toISOString()
          }));
        }
        
        return fallbackResult.session_id;
      }

      // Save last task to localStorage for quick continue
      if (taskId) {
        localStorage.setItem('lastFocusTask', taskId.toString());
      }

      return data.session_id;
    } catch (error) {
      console.error('Error starting focus session:', error);
      return null;
    }
  }, [user]);

  // Complete a focus session
  const completeFocusSession = useCallback(async (
    sessionId: number,
    duration: number,
    completedPomodoros: number
  ): Promise<boolean> => {
    try {
      // Prepare update data with existing schema
      const updateData: any = {
        end_time: new Date().toISOString(),
        completed: true,
        duration: duration
      };

      const { error } = await supabase
        .from('focus_sessions')
        .update(updateData)
        .eq('session_id', sessionId);

      if (error) throw error;

      // Handle task time attribution from localStorage backup if needed
      const currentTaskData = localStorage.getItem('currentFocusTask');
      if (currentTaskData) {
        try {
          const taskInfo = JSON.parse(currentTaskData);
          if (taskInfo.sessionId === sessionId && taskInfo.taskId) {
            // Update task effort_units manually
            await supabase
              .from('tasks')
              .update({
                effort_units: supabase.rpc('increment_effort', { 
                  task_id: taskInfo.taskId, 
                  minutes: duration 
                })
              })
              .eq('task_id', taskInfo.taskId);
          }
          localStorage.removeItem('currentFocusTask');
        } catch (e) {
          console.log('Could not process task attribution from localStorage');
        }
      }

      // Update focus session stats in localStorage
      const today = new Date().toISOString().split('T')[0];
      const existingData = localStorage.getItem('focusSessionStats');
      const stats = existingData ? JSON.parse(existingData) : {};
      stats[today] = (stats[today] || 0) + duration;
      localStorage.setItem('focusSessionStats', JSON.stringify(stats));

      return true;
    } catch (error) {
      console.error('Error completing focus session:', error);
      return false;
    }
  }, []);

  // Get smart task suggestions based on time of day and patterns
  const getSmartSuggestions = useCallback((): TaskOption[] => {
    if (availableTasks.length === 0) return [];

    const currentHour = new Date().getHours();
    const suggestions: TaskOption[] = [];

    // Priority 1: Today's tasks
    const todayTasks = availableTasks.filter(t => t.is_today);
    if (todayTasks.length > 0) {
      suggestions.push(...todayTasks.slice(0, 2));
    }

    // Priority 2: Tasks with upcoming deadlines
    const urgentTasks = availableTasks
      .filter(t => t.deadline && !t.is_today)
      .sort((a, b) => {
        const dateA = new Date(a.deadline!).getTime();
        const dateB = new Date(b.deadline!).getTime();
        return dateA - dateB;
      })
      .slice(0, 1);

    if (urgentTasks.length > 0 && suggestions.length < 3) {
      suggestions.push(...urgentTasks);
    }

    // Priority 3: Any remaining tasks
    if (suggestions.length < 3) {
      const remaining = availableTasks
        .filter(t => !suggestions.find(s => s.task_id === t.task_id))
        .slice(0, 3 - suggestions.length);
      suggestions.push(...remaining);
    }

    return suggestions.slice(0, 3);
  }, [availableTasks]);

  useEffect(() => {
    fetchAvailableTasks();
  }, [fetchAvailableTasks]);

  return {
    availableTasks,
    loading,
    lastTask,
    smartSuggestions: getSmartSuggestions(),
    startFocusSession,
    completeFocusSession,
    refreshTasks: fetchAvailableTasks
  };
}