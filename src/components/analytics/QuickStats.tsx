'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';
import { Target, Zap, Clock, Award } from 'lucide-react';

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
          .select('status, scheduled_date')
          .eq('user_id', user.id);

        if (tasks) {
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter(t => t.status === 'Completed').length;
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 animate-pulse">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-5 bg-slate-700 rounded" />
              <div className="w-24 h-4 bg-slate-700 rounded" />
            </div>
            <div className="w-16 h-8 bg-slate-700 rounded mb-2" />
            <div className="w-32 h-3 bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
        <div className="flex items-center gap-3 mb-2">
          <Target className="text-green-400" size={20} />
          <h3 className="text-slate-300 font-medium">Task Completion</h3>
        </div>
        <p className="text-2xl font-bold text-white">
          {stats.completionRate.toFixed(1)}%
        </p>
        <p className="text-sm text-slate-400">
          {stats.completedTasks} of {stats.totalTasks} tasks
        </p>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="text-yellow-400" size={20} />
          <h3 className="text-slate-300 font-medium">Recent Activity</h3>
        </div>
        <p className="text-2xl font-bold text-white">
          {stats.recentActivity}
        </p>
        <p className="text-sm text-slate-400">
          tasks this week
        </p>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="text-blue-400" size={20} />
          <h3 className="text-slate-300 font-medium">Total Tasks</h3>
        </div>
        <p className="text-2xl font-bold text-white">
          {stats.totalTasks}
        </p>
        <p className="text-sm text-slate-400">
          all time
        </p>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
        <div className="flex items-center gap-3 mb-2">
          <Award className="text-purple-400" size={20} />
          <h3 className="text-slate-300 font-medium">Completed</h3>
        </div>
        <p className="text-2xl font-bold text-white">
          {stats.completedTasks}
        </p>
        <p className="text-sm text-slate-400">
          tasks finished
        </p>
      </div>
    </div>
  );
}