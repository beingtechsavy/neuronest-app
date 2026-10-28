'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card, IconBadge } from '@/components/ui';

interface BreakdownListItem {
    id: number;
    original_task_title: string;
    created_at: string;
    completion_rate: number;
    steps_count: number;
}

function SectionSkeleton() {
    return (
        <Card role="status">
            <span className="sr-only">Loading your recent breakdown</span>
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

// One skeleton shape for both cards, so the dashboard row does not reflow when
// data arrives.
const cardButton =
    'group flex w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E1F22]';

export default function RecentAIChatSection() {
    const router = useRouter();
    const user = useUser();
    const supabase = useSupabaseClient();
    const [recentBreakdown, setRecentBreakdown] = useState<BreakdownListItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentBreakdown = async () => {
            if (!user) return; // Wait for user to load
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const response = await fetch(`/api/ai/breakdowns/recent?userId=${user.id}`, {
                    headers: {
                        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setRecentBreakdown(data.breakdown);
                }
            } catch (error) {
                console.error('Failed to fetch recent breakdown:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchRecentBreakdown();
        }
    }, [user, supabase]);

    if (loading) {
        return <SectionSkeleton />;
    }

    if (!recentBreakdown) {
        return (
            <Card className="p-0">
                <button
                    type="button"
                    onClick={() => router.push('/ai-breakdown')}
                    className={`${cardButton} items-center justify-between gap-4 p-6`}
                >
                    <div className="flex items-center gap-4">
                        <IconBadge tone="brand" size="lg">
                            <Sparkles size={20} />
                        </IconBadge>
                        <div>
                            <h3 className="mb-0.5 text-base font-bold tracking-tight text-[#F2F3F5]">
                                Break a task down
                            </h3>
                            <p className="text-sm leading-relaxed text-[#949BA4]">
                                Turn something overwhelming into ordered steps.
                            </p>
                        </div>
                    </div>
                    <ArrowRight
                        size={18}
                        aria-hidden="true"
                        className="shrink-0 text-[#949BA4] transition-colors group-hover:text-[#2DD4BF] group-focus-visible:text-[#2DD4BF]"
                    />
                </button>
            </Card>
        );
    }

    const completionPercentage = Math.round((recentBreakdown.completion_rate || 0) * 100);

    return (
        <Card className="p-0">
            <button
                type="button"
                onClick={() => router.push('/ai-breakdown')}
                className={`${cardButton} flex-col p-6`}
            >
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#2DD4BF]">
                    <Sparkles size={16} aria-hidden="true" />
                    <span>Recent breakdown</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="mb-2 line-clamp-1 text-base font-bold tracking-tight text-[#F2F3F5]">
                            {recentBreakdown.original_task_title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#949BA4]">
                            <span className="flex items-center gap-1.5">
                                <Clock size={14} aria-hidden="true" />
                                {formatDistanceToNow(new Date(recentBreakdown.created_at), { addSuffix: true })}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2
                                    size={14}
                                    aria-hidden="true"
                                    className={completionPercentage === 100 ? 'text-[#23A55A]' : ''}
                                />
                                {completionPercentage}% complete
                            </span>
                            <span className="rounded-lg border border-[#3F4147] px-2 py-0.5">
                                {recentBreakdown.steps_count} steps
                            </span>
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
