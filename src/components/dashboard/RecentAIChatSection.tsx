'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

interface BreakdownListItem {
    id: number;
    original_task_title: string;
    created_at: string;
    completion_rate: number;
    steps_count: number;
}

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
                console.error('Failed to fetch recent breakown:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchRecentBreakdown();
        }
    }, [user]);

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

    if (!recentBreakdown) {
        return (
            <div
                onClick={() => router.push('/ai-breakdown')}
                className="group cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-blue-500/10 border border-purple-500/20 p-6 transition-all hover:bg-gradient-to-r hover:from-purple-500/20 hover:via-fuchsia-500/20 hover:to-blue-500/20 hover:border-purple-500/30"
            >
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex flex-shrink-0 items-center justify-center border border-purple-500/30 group-hover:bg-purple-500/30 transition-colors">
                            <Sparkles size={24} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-100 transition-colors">Try Magic Breakdown</h3>
                            <p className="text-sm text-slate-300">Let AI turn your complex task into easy steps</p>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                        <ArrowRight size={18} className="text-slate-400 group-hover:text-purple-300 transition-colors" />
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles size={64} className="text-purple-400" />
                </div>
            </div>
        );
    }

    const completionPercentage = Math.round((recentBreakdown.completion_rate || 0) * 100);

    return (
        <div
            onClick={() => router.push('/ai-breakdown')}
            className="group cursor-pointer rounded-2xl bg-white/5 border border-white/10 p-5 transition-all hover:bg-white/10 hover:border-purple-500/30"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-purple-400 font-medium text-sm">
                    <Sparkles size={16} />
                    <span>Recent AI Chat</span>
                </div>
            </div>

            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors line-clamp-1">
                        {recentBreakdown.original_task_title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>{formatDistanceToNow(new Date(recentBreakdown.created_at), { addSuffix: true })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={14} className={completionPercentage === 100 ? "text-green-400" : ""} />
                            <span>{completionPercentage}% Complete</span>
                        </div>
                        <div className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                            {recentBreakdown.steps_count} steps
                        </div>
                    </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors mt-1">
                    <ArrowRight size={18} className="text-slate-400 group-hover:text-purple-300 transition-colors" />
                </div>
            </div>
        </div>
    );
}
