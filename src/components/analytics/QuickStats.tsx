'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';
import { Target, Zap, Clock, Award } from 'lucide-react';
import { Card, StatCard } from '@/components/ui';

interface QuickStatsData {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  recentActivity: number;
}

export default function QuickStats() {
  const user = useUser();
  const [stats, setStats] = useState<QuickStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuickStats = async () => {
      if (!user) return;

      try {
        // Single optimized query for basic stats
        const { data: tasks } = await supabase
          .from('tasks')
          .select('task_status, scheduled_date')
          .eq('user_id', user.id);

        if (tasks) {
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter(t => t.task_status === 'completed').length;
          const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
          
          // Count tasks from last 7 days
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const recentActivity = tasks.filter(t => 
            t.scheduled_date && new Date(t.scheduled_date) >= weekAgo
          ).length;

          setStats({
            totalTasks,
            completedTasks,
            completionRate,
            recentActivity
          });
        }
      } catch (error) {
        console.error('Failed to fetch quick stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuickStats();
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" role="status">
        <span className="sr-only">Loading your stats</span>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5" aria-hidden="true">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="h-4 w-4 rounded-lg bg-[#383A40]" />
              <div className="h-4 w-24 rounded-lg bg-[#383A40]" />
            </div>
            <div className="mb-2 h-8 w-16 rounded-lg bg-[#383A40]" />
            <div className="h-3 w-32 rounded-lg bg-[#383A40]" />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Task completion"
        value={`${stats.completionRate.toFixed(1)}%`}
        detail={`${stats.completedTasks} of ${stats.totalTasks} tasks`}
        icon={<Target size={18} />}
        tone="success"
      />
      <StatCard
        label="Recent activity"
        value={stats.recentActivity}
        detail="tasks this week"
        icon={<Zap size={18} />}
        tone="warning"
      />
      <StatCard
        label="Total tasks"
        value={stats.totalTasks}
        detail="all time"
        icon={<Clock size={18} />}
        tone="neutral"
      />
      <StatCard
        label="Completed"
        value={stats.completedTasks}
        detail="tasks finished"
        icon={<Award size={18} />}
      />
    </div>
  );
}