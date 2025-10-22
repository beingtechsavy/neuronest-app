import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';

export interface TodayStats {
  todayTasks: number;
  completedToday: number;
  progress: number;
  focusTimeToday: number; // in minutes
  hasStreakToday: boolean;
}

export function useTodayAnalytics() {
  const user = useUser();
  const [todayStats, setTodayStats] = useState<TodayStats>({
    todayTasks: 0,
    completedToday: 0,
    progress: 0,
    focusTimeToday: 0,
    hasStreakToday: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize focus session data if it doesn't exist
  useEffect(() => {
    const initializeFocusData = () => {
      try {
        const existingData = localStorage.getItem('focusSessionStats');
        if (!existingData) {
          // Auto-initialize with sample data for demo purposes
          const today = new Date();
          const stats: { [date: string]: number } = {};
          
          for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            if (i === 0) stats[dateStr] = 125; // Today: 2h 5m
            else if (i === 1) stats[dateStr] = 45; // Yesterday: 45m
            else if (i === 2) stats[dateStr] = 90; // 2 days ago: 1h 30m
            else if (i === 3) stats[dateStr] = 30; // 3 days ago: 30m
            else if (i === 4) stats[dateStr] = 60; // 4 days ago: 1h
            else if (i === 5) stats[dateStr] = 35; // 5 days ago: 35m
            else if (i === 6) stats[dateStr] = 50; // 6 days ago: 50m
          }
          
          localStorage.setItem('focusSessionStats', JSON.stringify(stats));
          if (process.env.NODE_ENV === 'development') {
            console.log('Auto-initialized focus session data for demo');
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Could not initialize focus session data:', error);
        }
      }
    };

    initializeFocusData();
  }, []);

  const fetchTodayStats = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      if (process.env.NODE_ENV === 'development') {
        console.log('📅 Fetching today\'s stats for:', today, 'user:', user.id);
      }

      // Get today's tasks
      const { data: todayTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('task_id, status, effort_units, scheduled_date')
        .eq('user_id', user.id)
        .eq('scheduled_date', today);

      if (tasksError) {
        console.warn('Today tasks error:', tasksError);
        // Continue with empty tasks array
      }

      const totalTodayTasks = (todayTasks && !tasksError) ? todayTasks.length : 0;
      const completedTodayTasks = (todayTasks && !tasksError) ? todayTasks.filter(t => t.status === 'Completed').length : 0;
      const todayProgress = totalTodayTasks > 0 ? (completedTodayTasks / totalTodayTasks) * 100 : 0;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Today\'s task stats:', { 
          totalTodayTasks, 
          completedTodayTasks, 
          todayProgress,
          tasksError: !!tasksError
        });
      }

      // Get focus session data from localStorage (primary source)
      let focusTimeFromSessions = 0;
      try {
        const sessionData = localStorage.getItem('focusSessionStats');
        if (sessionData) {
          const stats = JSON.parse(sessionData);
          const todaySessionTime = stats[today] || 0;
          focusTimeFromSessions = todaySessionTime;
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.log('No focus session data available');
        }
      }

      // Calculate focus time from completed tasks (effort_units are in minutes) - fallback
      const focusTimeFromTasks = (todayTasks && !tasksError)
        ? todayTasks.filter(t => t.status === 'Completed')
          .reduce((sum, t) => sum + (t.effort_units || 0), 0)
        : 0;

      // Use focus session data if available, otherwise fall back to task effort
      const totalFocusTime = focusTimeFromSessions > 0 ? focusTimeFromSessions : focusTimeFromTasks;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Focus time calculation:', {
          today,
          focusTimeFromSessions,
          focusTimeFromTasks,
          totalFocusTime,
          todayTasks: todayTasks?.length
        });
      }

      // Check if user has achieved streak today (30+ minutes of focus)
      const hasStreakToday = totalFocusTime >= 30;

      const finalStats = {
        todayTasks: totalTodayTasks,
        completedToday: completedTodayTasks,
        progress: todayProgress,
        focusTimeToday: totalFocusTime,
        hasStreakToday
      };

      setTodayStats(finalStats);
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Today\'s stats updated:', finalStats);
      }

    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Today\'s stats error:', err);
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch today\'s stats');
      
      // Set fallback data
      setTodayStats({
        todayTasks: 0,
        completedToday: 0,
        progress: 0,
        focusTimeToday: 0,
        hasStreakToday: false
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTodayStats();
  }, [fetchTodayStats]);

  return {
    todayStats,
    loading,
    error,
    refetch: fetchTodayStats
  };
}

// Hook to get focus session data from the context
export function useFocusSessionStats() {
  const [todayFocusTime, setTodayFocusTime] = useState(0);

  useEffect(() => {
    // Try to get today's focus time from localStorage or context
    const updateFocusTime = () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Check localStorage for session data
        const sessionData = localStorage.getItem('focusSessionStats');
        if (sessionData) {
          const stats = JSON.parse(sessionData);
          const todayTime = stats[today] || 0;
          if (process.env.NODE_ENV === 'development') {
            console.log('Focus session stats for today:', { today, todayTime, allStats: stats });
          }
          setTodayFocusTime(todayTime);
          return;
        }

        // Fallback: check if there's a current session running
        const currentSession = localStorage.getItem('focusSessionState');
        if (currentSession) {
          const session = JSON.parse(currentSession);
          if (session.isActive && session.sessionStartTime) {
            const sessionDuration = Date.now() - session.sessionStartTime;
            const sessionMinutes = Math.floor(sessionDuration / (1000 * 60));
            if (process.env.NODE_ENV === 'development') {
              console.log('Active session found:', { sessionMinutes });
            }
            setTodayFocusTime(sessionMinutes);
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Error getting focus session stats:', error);
        }
      }
    };

    updateFocusTime();
    
    // Update every minute
    const interval = setInterval(updateFocusTime, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return todayFocusTime;
}