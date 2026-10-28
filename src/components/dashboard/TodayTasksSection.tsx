'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, ArrowRight, Clock, Plus } from 'lucide-react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button, Card, IconBadge } from '@/components/ui';

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
                    const uncompletedTask = data.tasks?.find((t: { task_status?: string }) => t.task_status !== 'completed');
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
            <Card role="status">
                <span className="sr-only">Loading today&apos;s focus</span>
                <div className="flex items-center gap-4" aria-hidden="true">
                    <div className="h-11 w-11 rounded-xl bg-[#383A40]" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 rounded-lg bg-[#383A40]" />
                        <div className="h-3 w-1/4 rounded-lg bg-[#383A40]" />
                    </div>
                </div>
            </Card>
        );
    }

    if (!todayTask) {
        return (
            <Card className="flex h-full flex-col items-center justify-center py-10 text-center">
                <IconBadge tone="neutral" size="lg" className="mb-4">
                    <CalendarIcon size={20} />
                </IconBadge>
                <p className="mb-1 text-base font-bold tracking-tight text-[#F2F3F5]">
                    Today is clear
                </p>
                <p className="mb-5 max-w-xs text-sm leading-relaxed text-[#949BA4]">
                    Nothing is scheduled. Add something when you are ready.
                </p>
                <Button variant="secondary" onClick={() => router.push('/calendar')}>
                    <Plus size={16} aria-hidden="true" />
                    Open calendar
                </Button>
            </Card>
        );
    }

    // Format the time if available
    const timeDisplay = todayTask.start_time
        ? `${todayTask.start_time.substring(0, 5)}${todayTask.end_time ? ` – ${todayTask.end_time.substring(0, 5)}` : ''}`
        : todayTask.estimated_minutes ? `${todayTask.estimated_minutes} min` : 'Focus task';

    const encouragingText = todayTask.estimated_minutes && todayTask.estimated_minutes < 15
        ? "Quick win — you can do this."
        : "Your next focus session.";

    return (
        <Card className="p-0">
            <button
                type="button"
                onClick={() => router.push('/calendar')}
                className="group flex w-full flex-col rounded-2xl p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E1F22]"
            >
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#2DD4BF]">
                    <CalendarIcon size={16} aria-hidden="true" />
                    <span>Today&apos;s focus</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="mb-2 line-clamp-1 text-base font-bold tracking-tight text-[#F2F3F5]">
                            {todayTask.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#949BA4]">
                            <span className="flex items-center gap-1.5 rounded-lg border border-[#3F4147] px-2 py-1 font-medium text-[#DBDEE1]">
                                <Clock size={12} aria-hidden="true" className="text-[#2DD4BF]" />
                                {timeDisplay}
                            </span>
                            <span>{encouragingText}</span>
                        </div>
                    </div>

                    <ArrowRight
                        size={18}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-[#949BA4] transition-colors group-hover:text-[#2DD4BF] group-focus-visible:text-[#2DD4BF]"
                    />
                </div>
            </button>
        </Card>
    );
}
