'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { Loader2, TrendingUp, Target, Clock, Zap, Award } from 'lucide-react';
import CompletionRateCard from './CompletionRateCard';
import WeeklyProgressChart from './WeeklyProgressChart';
import PeakHoursChart from './PeakHoursChart';
import QuickStats from './QuickStats';

export default function AnalyticsDashboard() {
  const { analytics, loading, error } = useAnalytics();

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400 mb-4">Failed to load analytics</p>
        <p className="text-slate-400 text-sm">{error}</p>
      </div>
    );
  }

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-purple-400" size={32} />
      </div>
    );
  }

  const { taskStats, studyStreak, weeklyProgress, peakHours } = analytics || {};

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      {!analytics ? (
        <QuickStats />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Target className="text-green-400" size={20} />
              <h3 className="text-slate-300 font-medium">Task Completion</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {taskStats?.completionRate?.toFixed(1) || '0.0'}%
            </p>
            <p className="text-sm text-slate-400">
              {taskStats?.completedTasks || 0} of {taskStats?.totalTasks || 0} tasks
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-yellow-400" size={20} />
              <h3 className="text-slate-300 font-medium">Streak</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {studyStreak?.currentStreak || 0}
            </p>
            <p className="text-sm text-slate-400">
              days (best: {studyStreak?.longestStreak || 0})
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-blue-400" size={20} />
              <h3 className="text-slate-300 font-medium">Avg Completion</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {taskStats?.averageCompletionTime?.toFixed(1) || '0.0'}
            </p>
            <p className="text-sm text-slate-400">days early</p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Award className="text-purple-400" size={20} />
              <h3 className="text-slate-300 font-medium">On-Time Rate</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {(taskStats?.totalTasks && taskStats.totalTasks > 0)
                ? ((taskStats.onTimeTasks / taskStats.totalTasks) * 100).toFixed(1)
                : '0'
              }%
            </p>
            <p className="text-sm text-slate-400">
              {taskStats?.onTimeTasks || 0} on-time tasks
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {taskStats && <CompletionRateCard taskStats={taskStats} />}
        {peakHours && <PeakHoursChart peakHours={peakHours} />}
        <div className="lg:col-span-2">
          {weeklyProgress && <WeeklyProgressChart weeklyProgress={weeklyProgress} />}
        </div>
      </div>
    </div>
  );
}