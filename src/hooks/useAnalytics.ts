import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';

export interface TaskCompletionStats {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    overdueTasks: number;
    onTimeTasks: number;
    averageCompletionTime: number; // in days
}

export interface SubjectStats {
    subject_id: number;
    subject_title: string;
    subject_color: string;
    totalChapters: number;
    completedChapters: number;
    completionRate: number;
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
    averageStressLevel: number;
    timeSpent: number; // in minutes
}

export interface StudyStreak {
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: string | null;
    streakDates: string[];
}

export interface ProductivityData {
    date: string;
    tasksCompleted: number;
    timeSpent: number;
    focusScore: number; // 0-100
}

export interface WeeklyProgress {
    weekStart: string;
    tasksCompleted: number;
    chaptersCompleted: number;
    timeSpent: number;
    completionRate: number;
}

export interface AnalyticsData {
    taskStats: TaskCompletionStats;
    subjectStats: SubjectStats[];
    studyStreak: StudyStreak;
    weeklyProgress: WeeklyProgress[];
    productivityHeatmap: ProductivityData[];
    peakHours: { hour: number; productivity: number }[];
}

export function useAnalytics() {
    const user = useUser();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const calculateTaskStats = useCallback(async (): Promise<TaskCompletionStats> => {
        if (!user) throw new Error('User not authenticated');

        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('status, deadline, end_time')
            .eq('user_id', user.id);

        if (error) throw error;

        const totalTasks = tasks?.length || 0;
        const completedTasks = tasks?.filter(t => t.status === 'Completed').length || 0;
        const overdueTasks = tasks?.filter(t => {
            if (t.status === 'Completed') return false;
            if (!t.deadline) return false;
            return new Date(t.deadline) < new Date();
        }).length || 0;

        const onTimeTasks = tasks?.filter(t => {
            if (t.status !== 'Completed') return false;
            if (!t.deadline || !t.end_time) return false;
            return new Date(t.end_time) <= new Date(t.deadline);
        }).length || 0;

        // Calculate average completion time
        const completedWithDeadlines = tasks?.filter(t =>
            t.status === 'Completed' && t.deadline && t.end_time
        ) || [];

        const avgCompletionTime = completedWithDeadlines.length > 0
            ? completedWithDeadlines.reduce((sum, task) => {
                const deadline = new Date(task.deadline!);
                const completed = new Date(task.end_time!);
                const daysEarly = Math.max(0, (deadline.getTime() - completed.getTime()) / (1000 * 60 * 60 * 24));
                return sum + daysEarly;
            }, 0) / completedWithDeadlines.length
            : 0;

        return {
            totalTasks,
            completedTasks,
            completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
            overdueTasks,
            onTimeTasks,
            averageCompletionTime: avgCompletionTime
        };
    }, [user]);

    const calculateSubjectStats = useCallback(async (): Promise<SubjectStats[]> => {
        if (!user) throw new Error('User not authenticated');

        const { data: subjects, error: subjectsError } = await supabase
            .from('subjects')
            .select(`
        subject_id,
        title,
        color,
        is_stressful,
        chapters (
          chapter_id,
          completed,
          is_stressful,
          tasks (
            task_id,
            status,
            effort_units,
            is_stressful
          )
        )
      `)
            .eq('user_id', user.id);

        if (subjectsError) throw subjectsError;

        return (subjects || []).map(subject => {
            const chapters = subject.chapters || [];
            const totalChapters = chapters.length;
            const completedChapters = chapters.filter(c => c.completed).length;

            const allTasks = chapters.flatMap(c => c.tasks || []);
            const totalTasks = allTasks.length;
            const completedTasks = allTasks.filter(t => t.status === 'Completed').length;

            const stressfulItems = [
                subject.is_stressful ? 1 : 0,
                ...chapters.map(c => c.is_stressful ? 1 : 0),
                ...allTasks.map(t => t.is_stressful ? 1 : 0)
            ];
            const averageStressLevel = stressfulItems.length > 0
                ? (stressfulItems.reduce((sum, val) => sum + val, 0) / stressfulItems.length) * 100
                : 0;

            const timeSpent = allTasks
                .filter(t => t.status === 'Completed')
                .reduce((sum, t) => sum + (t.effort_units || 0), 0);

            return {
                subject_id: subject.subject_id,
                subject_title: subject.title,
                subject_color: subject.color,
                totalChapters,
                completedChapters,
                completionRate: totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0,
                totalTasks,
                completedTasks,
                taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
                averageStressLevel,
                timeSpent
            };
        });
    }, [user]);

    const calculateStudyStreak = useCallback(async (): Promise<StudyStreak> => {
        if (!user) throw new Error('User not authenticated');

        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('scheduled_date, status, end_time')
            .eq('user_id', user.id)
            .eq('status', 'Completed')
            .not('scheduled_date', 'is', null)
            .order('scheduled_date', { ascending: false });

        if (error) throw error;

        const studyDates = [...new Set(tasks?.map(t => t.scheduled_date) || [])].sort();

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate current streak (working backwards from today)
        for (let i = 0; i < 30; i++) { // Check last 30 days
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            if (studyDates.includes(dateStr)) {
                if (i === 0 || currentStreak > 0) {
                    currentStreak++;
                }
            } else if (i === 0) {
                // If no study today, check yesterday
                continue;
            } else {
                break;
            }
        }

        // Calculate longest streak
        for (let i = 0; i < studyDates.length; i++) {
            if (i === 0) {
                tempStreak = 1;
            } else {
                const prevDate = new Date(studyDates[i - 1]);
                const currDate = new Date(studyDates[i]);
                const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

                if (dayDiff === 1) {
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        return {
            currentStreak,
            longestStreak,
            lastStudyDate: studyDates[studyDates.length - 1] || null,
            streakDates: studyDates
        };
    }, [user]);

    const calculateWeeklyProgress = useCallback(async (): Promise<WeeklyProgress[]> => {
        if (!user) throw new Error('User not authenticated');

        const weeks: WeeklyProgress[] = [];
        const today = new Date();

        for (let i = 0; i < 8; i++) { // Last 8 weeks
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - (today.getDay() + (i * 7)));
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            const { data: weekTasks } = await supabase
                .from('tasks')
                .select('task_id, status, effort_units, scheduled_date')
                .eq('user_id', user.id)
                .gte('scheduled_date', weekStart.toISOString().split('T')[0])
                .lte('scheduled_date', weekEnd.toISOString().split('T')[0]);

            const { data: weekChapters } = await supabase
                .from('chapters')
                .select('chapter_id, completed, updated_at')
                .eq('user_id', user.id)
                .gte('updated_at', weekStart.toISOString())
                .lte('updated_at', weekEnd.toISOString())
                .eq('completed', true);

            const tasksCompleted = weekTasks?.filter(t => t.status === 'Completed').length || 0;
            const totalTasks = weekTasks?.length || 0;
            const timeSpent = weekTasks
                ?.filter(t => t.status === 'Completed')
                .reduce((sum, t) => sum + (t.effort_units || 0), 0) || 0;

            weeks.unshift({
                weekStart: weekStart.toISOString().split('T')[0],
                tasksCompleted,
                chaptersCompleted: weekChapters?.length || 0,
                timeSpent,
                completionRate: totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0
            });
        }

        return weeks;
    }, [user]);

    const calculateProductivityHeatmap = useCallback(async (): Promise<ProductivityData[]> => {
        if (!user) throw new Error('User not authenticated');

        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('scheduled_date, status, effort_units, end_time')
            .eq('user_id', user.id)
            .eq('status', 'Completed')
            .not('scheduled_date', 'is', null)
            .gte('scheduled_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (error) throw error;

        const dailyData: { [date: string]: ProductivityData } = {};

        tasks?.forEach(task => {
            const date = task.scheduled_date!;
            if (!dailyData[date]) {
                dailyData[date] = {
                    date,
                    tasksCompleted: 0,
                    timeSpent: 0,
                    focusScore: 0
                };
            }

            dailyData[date].tasksCompleted++;
            dailyData[date].timeSpent += task.effort_units || 0;
        });

        // Calculate focus score based on tasks completed and time spent
        Object.values(dailyData).forEach(day => {
            const efficiency = day.timeSpent > 0 ? (day.tasksCompleted / day.timeSpent) * 100 : 0;
            day.focusScore = Math.min(100, efficiency * 10); // Scale to 0-100
        });

        return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
    }, [user]);

    const fetchAnalytics = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // Phase 1: Load critical stats first for immediate display
            const taskStats = await calculateTaskStats();
            
            // Show basic analytics immediately
            setAnalytics(prev => ({
                taskStats,
                subjectStats: prev?.subjectStats || [],
                studyStreak: prev?.studyStreak || { currentStreak: 0, longestStreak: 0, lastStudyDate: null, streakDates: [] },
                weeklyProgress: prev?.weeklyProgress || [],
                productivityHeatmap: prev?.productivityHeatmap || [],
                peakHours: prev?.peakHours || []
            }));
            
            // Phase 2: Load remaining data in parallel
            const [
                subjectStats,
                studyStreak,
                weeklyProgress,
                productivityHeatmap
            ] = await Promise.all([
                calculateSubjectStats(),
                calculateStudyStreak(),
                calculateWeeklyProgress(),
                calculateProductivityHeatmap()
            ]);

            // Calculate peak hours from productivity data
            const hourlyProductivity: { [hour: number]: number[] } = {};
            productivityHeatmap.forEach(day => {
                // Simulate hourly distribution based on daily data
                for (let hour = 6; hour <= 22; hour++) {
                    if (!hourlyProductivity[hour]) hourlyProductivity[hour] = [];
                    // Simple distribution - peak around typical study hours
                    const productivity = day.focusScore * Math.random() * (hour >= 9 && hour <= 17 ? 1.2 : 0.8);
                    hourlyProductivity[hour].push(productivity);
                }
            });

            const peakHours = Object.entries(hourlyProductivity)
                .map(([hour, scores]) => ({
                    hour: parseInt(hour),
                    productivity: scores.reduce((sum, score) => sum + score, 0) / scores.length
                }))
                .sort((a, b) => b.productivity - a.productivity);

            // Update with complete data
            setAnalytics({
                taskStats,
                subjectStats,
                studyStreak,
                weeklyProgress,
                productivityHeatmap,
                peakHours
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    }, [user, calculateTaskStats, calculateSubjectStats, calculateStudyStreak, calculateWeeklyProgress, calculateProductivityHeatmap]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return {
        analytics,
        loading,
        error,
        refetch: fetchAnalytics
    };
}