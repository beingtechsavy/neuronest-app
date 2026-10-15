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
    dataQuality: {
        hasTaskData: boolean;
        hasFocusData: boolean;
        hasEnoughPeakHourData: boolean;
        peakHourDataPoints: number;
    };
}

export function useAnalytics() {
    const user = useUser();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const calculateTaskStats = useCallback(async (): Promise<TaskCompletionStats> => {
        if (!user) throw new Error('User not authenticated');

        try {
            const { data: tasks, error } = await supabase
                .from('tasks')
                .select('task_status, deadline, end_time')
                .eq('user_id', user.id);

            if (error) {
                console.warn('Task stats error:', error);
                // Return default stats if query fails
                return {
                    totalTasks: 0,
                    completedTasks: 0,
                    completionRate: 0,
                    overdueTasks: 0,
                    onTimeTasks: 0,
                    averageCompletionTime: 0
                };
            }

        const totalTasks = tasks?.length || 0;
        const completedTasks = tasks?.filter(t => t.task_status === 'completed').length || 0;
        const overdueTasks = tasks?.filter(t => {
            if (t.task_status === 'completed') return false;
            if (!t.deadline) return false;
            return new Date(t.deadline) < new Date();
        }).length || 0;

        const onTimeTasks = tasks?.filter(t => {
            if (t.task_status !== 'completed') return false;
            if (!t.deadline || !t.end_time) return false;
            return new Date(t.end_time) <= new Date(t.deadline);
        }).length || 0;

        // Calculate average completion time
        const completedWithDeadlines = tasks?.filter(t =>
            t.task_status === 'completed' && t.deadline && t.end_time
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
        } catch (error) {
            console.warn('Error calculating task stats:', error);
            return {
                totalTasks: 0,
                completedTasks: 0,
                completionRate: 0,
                overdueTasks: 0,
                onTimeTasks: 0,
                averageCompletionTime: 0
            };
        }
    }, [user]);

    const calculateSubjectStats = useCallback(async (): Promise<SubjectStats[]> => {
        if (!user) throw new Error('User not authenticated');

        try {
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
                task_status,
                effort_units,
                is_stressful
              )
            )
          `)
                .eq('user_id', user.id);

            if (subjectsError) {
                console.warn('Subject stats error:', subjectsError);
                return [];
            }

            return (subjects || []).map(subject => {
                const chapters = subject.chapters || [];
                const totalChapters = chapters.length;
                const completedChapters = chapters.filter(c => c.completed).length;

                const allTasks = chapters.flatMap(c => c.tasks || []);
                const totalTasks = allTasks.length;
                const completedTasks = allTasks.filter(t => t.task_status === 'completed').length;

                const stressfulItems = [
                    subject.is_stressful ? 1 : 0,
                    ...chapters.map(c => c.is_stressful ? 1 : 0),
                    ...allTasks.map(t => t.is_stressful ? 1 : 0)
                ];
                const averageStressLevel = stressfulItems.length > 0
                    ? (stressfulItems.reduce((sum, val) => sum + val, 0) / stressfulItems.length) * 100
                    : 0;

                const timeSpent = allTasks
                    .filter(t => t.task_status === 'completed')
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
        } catch (error) {
            console.warn('Error calculating subject stats:', error);
            return [];
        }
    }, [user]);

    const calculateStudyStreak = useCallback(async (): Promise<StudyStreak> => {
        if (!user) throw new Error('User not authenticated');

        try {
            // Get tasks with effort units (focus time) for the last 60 days
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

            const { data: tasks, error } = await supabase
                .from('tasks')
                .select('scheduled_date, task_status, effort_units, end_time')
                .eq('user_id', user.id)
                .eq('task_status', 'completed')
                .not('scheduled_date', 'is', null)
                .gte('scheduled_date', sixtyDaysAgo.toISOString().split('T')[0])
                .order('scheduled_date', { ascending: false });

            if (error) {
                console.warn('Study streak error:', error);
                return {
                    currentStreak: 0,
                    longestStreak: 0,
                    lastStudyDate: null,
                    streakDates: []
                };
            }

        // Group tasks by date and calculate daily focus time
        const dailyFocusTime: { [date: string]: number } = {};

        tasks?.forEach(task => {
            const date = task.scheduled_date!;
            if (!dailyFocusTime[date]) {
                dailyFocusTime[date] = 0;
            }
            dailyFocusTime[date] += task.effort_units || 0;
        });

        // Find dates with 30+ minutes of focus (streak days)
        const streakDates = Object.entries(dailyFocusTime)
            .filter(([date, minutes]) => minutes >= 30)
            .map(([date]) => date)
            .sort();

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        // Calculate current streak (working backwards from today)
        for (let i = 0; i < 60; i++) { // Check last 60 days
            const checkDate = new Date(todayDate);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            if (streakDates.includes(dateStr)) {
                if (i === 0 || currentStreak > 0) {
                    currentStreak++;
                }
            } else if (i === 0) {
                // If no streak today, check yesterday
                continue;
            } else {
                break;
            }
        }

        // Calculate longest streak
        for (let i = 0; i < streakDates.length; i++) {
            if (i === 0) {
                tempStreak = 1;
            } else {
                const prevDate = new Date(streakDates[i - 1]);
                const currDate = new Date(streakDates[i]);
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
                lastStudyDate: streakDates[streakDates.length - 1] || null,
                streakDates
            };
        } catch (error) {
            console.warn('Error calculating study streak:', error);
            return {
                currentStreak: 0,
                longestStreak: 0,
                lastStudyDate: null,
                streakDates: []
            };
        }
    }, [user]);

    const calculateWeeklyProgress = useCallback(async (): Promise<WeeklyProgress[]> => {
        if (!user) throw new Error('User not authenticated');

        try {
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
                .select('task_id, task_status, effort_units, scheduled_date')
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

            const tasksCompleted = weekTasks?.filter(t => t.task_status === 'completed').length || 0;
            const totalTasks = weekTasks?.length || 0;
            const timeSpent = weekTasks
                ?.filter(t => t.task_status === 'completed')
                .reduce((sum, t) => sum + (t.effort_units || 0), 0) || 0;

            weeks.unshift({
                weekStart: weekStart.toISOString().split('T')[0],
                tasksCompleted,
                chaptersCompleted: weekChapters?.length || 0,
                timeSpent,
                completionRate: totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0
            });
        }

            const hasRealData = weeks.some((week) =>
                week.tasksCompleted > 0 || week.chaptersCompleted > 0 || week.timeSpent > 0,
            );
            return hasRealData ? weeks : [];
        } catch (error) {
            console.warn('Error calculating weekly progress:', error);
            return [];
        }
    }, [user]);

    const calculatePeakHours = useCallback(async (): Promise<{
        hours: { hour: number; productivity: number }[];
        dataPoints: number;
    }> => {
        if (!user) throw new Error('User not authenticated');

        try {
            const { data: tasks, error } = await supabase
                .from('tasks')
                .select('end_time, effort_units, task_status')
                .eq('user_id', user.id)
                .eq('task_status', 'completed')
                .not('end_time', 'is', null)
                .order('end_time', { ascending: false })
                .limit(500);

            if (error) {
                console.warn('Peak hours error:', error);
                return { hours: [], dataPoints: 0 };
            }

            const completedTasks = (tasks || []).filter((task) => Boolean(task.end_time));
            if (completedTasks.length < 3) return { hours: [], dataPoints: completedTasks.length };

            const byHour = new Map<number, { count: number; minutes: number }>();
            for (const task of completedTasks) {
                const rawEndTime = String(task.end_time);
                const timeMatch = /^(\d{1,2}):/.exec(rawEndTime);
                const hour = timeMatch ? Number(timeMatch[1]) : new Date(rawEndTime).getHours();
                if (!Number.isInteger(hour) || hour < 0 || hour > 23) continue;
                const current = byHour.get(hour) || { count: 0, minutes: 0 };
                current.count += 1;
                current.minutes += Number(task.effort_units || 0) * 15;
                byHour.set(hour, current);
            }

            return {
                hours: Array.from(byHour.entries())
                    .map(([hour, data]) => ({
                        hour,
                        productivity: data.count + data.minutes / 60,
                    }))
                    .sort((a, b) => a.hour - b.hour),
                dataPoints: completedTasks.length,
            };
        } catch (error) {
            console.warn('Error calculating peak hours:', error);
            return { hours: [], dataPoints: 0 };
        }
    }, [user]);

    const calculateProductivityHeatmap = useCallback(async (): Promise<ProductivityData[]> => {
        if (!user) throw new Error('User not authenticated');

        try {
            const { data: tasks, error } = await supabase
                .from('tasks')
                .select('scheduled_date, task_status, effort_units, end_time')
                .eq('user_id', user.id)
                .eq('task_status', 'completed')
                .not('scheduled_date', 'is', null)
                .gte('scheduled_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

            if (error) {
                console.warn('Productivity heatmap error:', error);
                return [];
            }

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
                dailyData[date].timeSpent += (task.effort_units || 0) * 15;
        });

        // Calculate focus score based on tasks completed and time spent
        Object.values(dailyData).forEach(day => {
            const efficiency = day.timeSpent > 0 ? (day.tasksCompleted / day.timeSpent) * 100 : 0;
            day.focusScore = Math.min(100, efficiency * 10); // Scale to 0-100
        });

            return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
        } catch (error) {
            console.warn('Error calculating productivity heatmap:', error);
            return [];
        }
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
                peakHours: prev?.peakHours || [],
                dataQuality: prev?.dataQuality || {
                    hasTaskData: taskStats.totalTasks > 0,
                    hasFocusData: false,
                    hasEnoughPeakHourData: false,
                    peakHourDataPoints: 0,
                },
            }));

            // Phase 2: Load remaining data in parallel
            const [
                subjectStats,
                studyStreak,
                weeklyProgress,
                productivityHeatmap,
                peakHourData,
            ] = await Promise.all([
                calculateSubjectStats(),
                calculateStudyStreak(),
                calculateWeeklyProgress(),
                calculateProductivityHeatmap(),
                calculatePeakHours(),
            ]);

            // Update with complete data
            setAnalytics({
                taskStats,
                subjectStats,
                studyStreak,
                weeklyProgress,
                productivityHeatmap,
                peakHours: peakHourData.hours,
                dataQuality: {
                    hasTaskData: taskStats.totalTasks > 0,
                    hasFocusData: productivityHeatmap.length > 0,
                    hasEnoughPeakHourData: peakHourData.dataPoints >= 3,
                    peakHourDataPoints: peakHourData.dataPoints,
                },
            });
        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error('❌ Analytics fetch error:', err);
            }
            setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
            
            // Set minimal fallback data so UI doesn't break
            setAnalytics({
                taskStats: {
                    totalTasks: 0,
                    completedTasks: 0,
                    completionRate: 0,
                    overdueTasks: 0,
                    onTimeTasks: 0,
                    averageCompletionTime: 0
                },
                subjectStats: [],
                studyStreak: { currentStreak: 0, longestStreak: 0, lastStudyDate: null, streakDates: [] },
                weeklyProgress: [],
                productivityHeatmap: [],
                peakHours: [],
                dataQuality: {
                    hasTaskData: false,
                    hasFocusData: false,
                    hasEnoughPeakHourData: false,
                    peakHourDataPoints: 0,
                },
            });
        } finally {
            setLoading(false);
        }
    }, [user, calculateTaskStats, calculateSubjectStats, calculateStudyStreak, calculateWeeklyProgress, calculateProductivityHeatmap, calculatePeakHours]);

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
