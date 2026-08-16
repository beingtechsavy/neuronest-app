'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, ArrowRight, Clock, Plus } from 'lucide-react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

interface Task {
    task_id: number;
    title: string;
    estimated_minutes: number | null;
    start_time: string | null;
    end_time: string | null;
}

export default function TodayTasksSection() {
    const router = useRouter();
    const user = useUser();
    const supabase = useSupabaseClient();
    const [todayTask, setTodayTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTodayTask = async () => {
            if (!user) return; // Wait for user info
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const response = await fetch(`/api/tasks/today?userId=${user.id}`, {
                    headers: {
                        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    // Find the first uncompleted task
                    const uncompletedTask = data.tasks?.find((t: any) => t.task_status !== 'completed');
                    if (uncompletedTask) {
                        setTodayTask(uncompletedTask);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch today tasks:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchTodayTask();
        }
    }, [user, supabase]);

    if (loading) {
        return (
            <div className="animate-pulse flex items-center gap-4 py-2">
                <div className="w-12 h-12 bg-slate-800/50 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-800/50 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-800/50 rounded w-1/4"></div>
                </div>
            </div>
        );
    }

    if (!todayTask) {
        return (
            <div className="flex flex-col items-center justify-center py-6 px-4 bg-white/5 border border-white/10 rounded-2xl">
                <CalendarIcon size={32} className="text-slate-500 mb-3" />
                <p className="text-slate-300 text-sm mb-4 text-center">Your schedule is clear for today!</p>
                <button
                    onClick={() => router.push('/calendar')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 rounded-lg text-sm font-medium transition-colors border border-blue-500/20"
                >
                    <Plus size={16} />
                    <span>Create Task Now</span>
                </button>
            </div>
        );
    }

    // Format the time if available
    const timeDisplay = todayTask.start_time
        ? `${todayTask.start_time.substring(0, 5)}${todayTask.end_time ? ` - ${todayTask.end_time.substring(0, 5)}` : ''}`
        : todayTask.estimated_minutes ? `${todayTask.estimated_minutes} min` : 'Focus task';

    const encouragingText = todayTask.estimated_minutes && todayTask.estimated_minutes < 15
        ? "Quick win! You can do this."
        : "Your next focus session.";

    return (
        <div
            onClick={() => router.push('/calendar')}
            className="group cursor-pointer rounded-2xl bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/20 p-5 transition-all hover:bg-white/10 hover:border-blue-500/40 relative overflow-hidden"
        >
            {/* Decorative accent */}
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors"></div>

            <div className="flex items-center justify-between mb-3 pl-2">
                <div className="flex items-center gap-2 text-blue-400 font-medium text-sm">
                    <CalendarIcon size={16} />
                    <span>Today&apos;s Focus</span>
                </div>
            </div>

            <div className="flex items-start justify-between pl-2">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors line-clamp-1">
                        {todayTask.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 font-medium">
                            <Clock size={12} className="text-blue-400" />
                            <span>{timeDisplay}</span>
                        </div>
                        <span className="text-slate-400 italic">{encouragingText}</span>
                    </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors mt-1 shrink-0">
                    <ArrowRight size={18} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
                </div>
            </div>
        </div>
    );
}
