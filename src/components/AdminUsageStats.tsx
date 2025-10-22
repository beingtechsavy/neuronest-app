'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Users, Zap, TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface UsageStats {
  totalUsers: number;
  freeUsers: number;
  masterUsers: number;
  warriorUsers: number;
  totalAIUsageToday: number;
  totalSubjects: number;
  averageSubjectsPerUser: number;
  conversionRate: number;
}

export default function AdminUsageStats() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get user counts by plan
        const { data: usageLimits, error: usageError } = await supabase
          .from('usage_limits')
          .select('plan_type, breakdowns_used, user_id');

        if (usageError) throw usageError;

        // Get total subjects
        const { data: subjects, error: subjectsError } = await supabase
          .from('subjects')
          .select('user_id');

        if (subjectsError) throw subjectsError;

        // Calculate stats
        const totalUsers = usageLimits?.length || 0;
        const freeUsers = usageLimits?.filter(u => u.plan_type === 'free').length || 0;
        const masterUsers = usageLimits?.filter(u => u.plan_type === 'master').length || 0;
        const warriorUsers = usageLimits?.filter(u => u.plan_type === 'warrior').length || 0;
        const totalAIUsageToday = usageLimits?.reduce((sum, u) => sum + (u.breakdowns_used || 0), 0) || 0;
        const totalSubjects = subjects?.length || 0;
        const averageSubjectsPerUser = totalUsers > 0 ? totalSubjects / totalUsers : 0;
        const paidUsers = masterUsers + warriorUsers;
        const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;

        setStats({
          totalUsers,
          freeUsers,
          masterUsers,
          warriorUsers,
          totalAIUsageToday,
          totalSubjects,
          averageSubjectsPerUser,
          conversionRate
        });
      } catch (err) {
        console.error('Failed to load admin stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
        <div className="text-center">
          <p className="text-red-400">Failed to load admin stats</p>
          <p className="text-slate-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
          <BarChart3 size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-light text-white">Usage Analytics</h2>
          <p className="text-slate-400 text-sm">Real-time platform statistics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-blue-400" />
            </div>
            <h3 className="text-white font-medium">Total Users</h3>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.totalUsers}</div>
          <p className="text-slate-400 text-xs">Registered accounts</p>
        </div>

        {/* AI Usage Today */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-purple-400" />
            </div>
            <h3 className="text-white font-medium">AI Usage</h3>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.totalAIUsageToday}</div>
          <p className="text-slate-400 text-xs">Breakdowns today</p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-green-400" />
            </div>
            <h3 className="text-white font-medium">Conversion</h3>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.conversionRate.toFixed(1)}%</div>
          <p className="text-slate-400 text-xs">Free to paid</p>
        </div>

        {/* Revenue Estimate */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <DollarSign size={16} className="text-yellow-400" />
            </div>
            <h3 className="text-white font-medium">MRR Est.</h3>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            ${((stats.masterUsers * 6.99) + (stats.warriorUsers * 9.99)).toFixed(0)}
          </div>
          <p className="text-slate-400 text-xs">Monthly recurring</p>
        </div>
      </div>

      {/* Plan Breakdown */}
      <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 mb-6">
        <h3 className="text-white font-medium mb-4">Plan Distribution</h3>
        <div className="space-y-4">
          {/* Free Plan */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-slate-300">Free Plan</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">{stats.freeUsers}</span>
              <span className="text-slate-400 text-sm">
                ({((stats.freeUsers / stats.totalUsers) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Master Plan */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span className="text-slate-300">Master Plan</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">{stats.masterUsers}</span>
              <span className="text-slate-400 text-sm">
                ({((stats.masterUsers / stats.totalUsers) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Warrior Plan */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-slate-300">Warrior Plan</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">{stats.warriorUsers}</span>
              <span className="text-slate-400 text-sm">
                ({((stats.warriorUsers / stats.totalUsers) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-white font-medium mb-3">Content Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Subjects</span>
              <span className="text-white">{stats.totalSubjects}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg per User</span>
              <span className="text-white">{stats.averageSubjectsPerUser.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-white font-medium mb-3">AI Usage</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Today's Usage</span>
              <span className="text-white">{stats.totalAIUsageToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg per User</span>
              <span className="text-white">
                {stats.totalUsers > 0 ? (stats.totalAIUsageToday / stats.totalUsers).toFixed(1) : '0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}