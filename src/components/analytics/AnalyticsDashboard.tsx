'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { Loader2, TrendingUp, Target, Clock, Zap, Award } from 'lucide-react';
import CompletionRateCard from './CompletionRateCard';
import WeeklyProgressChart from './WeeklyProgressChart';
import PeakHoursChart from './PeakHoursChart';
import QuickStats from './QuickStats';
import { Card, StatCard } from '@/components/ui';

export default function AnalyticsDashboard() {
  const { analytics, loading, error } = useAnalytics();

  if (error) {
    return (
      <Card className="text-center">
        <p className="mb-2 font-semibold text-[#FF6B6B]">Failed to load insights</p>
        <p className="text-sm text-[#949BA4]">{error}</p>
      </Card>
    );
  }

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-[#949BA4]">
        <Loader2 className="animate-spin text-[#14B8A6]" size={24} />
        <span className="text-sm">Loading insights…</span>
      </div>
    );
  }

  const { taskStats, studyStreak, weeklyProgress, peakHours, dataQuality } = analytics || {};

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      {!analytics ? (
        <QuickStats />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Task completion"
            value={`${taskStats?.completionRate?.toFixed(1) || '0.0'}%`}
            detail={`${taskStats?.completedTasks || 0} of ${taskStats?.totalTasks || 0} tasks`}
            icon={<Target size={18} />}
            tone="success"
          />
          <StatCard
            label="Streak"
            value={studyStreak?.currentStreak || 0}
            detail={`days (best: ${studyStreak?.longestStreak || 0})`}
            icon={<Zap size={18} />}
            tone="warning"
          />
          <StatCard
            label="Average completion"
            value={taskStats?.averageCompletionTime?.toFixed(1) || '0.0'}
            detail="days early"
            icon={<Clock size={18} />}
          />
          <StatCard
            label="On-time rate"
            value={`${
              taskStats?.totalTasks && taskStats.totalTasks > 0
                ? ((taskStats.onTimeTasks / taskStats.totalTasks) * 100).toFixed(1)
                : '0'
            }%`}
            detail={`${taskStats?.onTimeTasks || 0} on-time tasks`}
            icon={<Award size={18} />}
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {taskStats && <CompletionRateCard taskStats={taskStats} />}
        {peakHours && <PeakHoursChart peakHours={peakHours} />}
        <div className="lg:col-span-2">
          {weeklyProgress && <WeeklyProgressChart weeklyProgress={weeklyProgress} />}
        </div>
      </div>
      {analytics && !dataQuality?.hasTaskData && (
        <Card className="text-center">
          <p className="font-semibold text-[#DBDEE1]">
            Your real progress will appear here as you use NeuroNest.
          </p>
          <p className="mt-1 text-sm text-[#949BA4]">
            There is no sample or simulated activity in this view.
          </p>
        </Card>
      )}
    </div>
  );
}
