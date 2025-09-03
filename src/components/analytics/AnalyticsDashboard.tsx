'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { Loader2, TrendingUp, Target, Clock, Zap, Calendar, Award } from 'lucide-react';
import CompletionRateCard from './CompletionRateCard';
import SubjectStatsGrid from './SubjectStatsGrid';
import StudyStreakCard from './StudyStreakCard';
import WeeklyProgressChart from './WeeklyProgressChart';
import ProductivityHeatmap from './ProductivityHeatmap';
import PeakHoursChart from './PeakHoursChart';
import { MetricCardSkeleton, ChartSkeleton, HeatmapSkeleton, SubjectCardSkeleton } from './SkeletonCard';
import LoadingProgress from './LoadingProgress';
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

  // Show skeleton while loading or if no data yet
  const showSkeleton = loading || !analytics;
  const { taskStats, subjectStats, studyStreak, weeklyProgress, productivityHeatmap, peakHours } = analytics || {};

  // Show loading overlay for initial load
  if (loading && !analytics) {
    return <LoadingProgress isLoading={loading} hasData={!!analytics} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <TrendingUp className="text-purple-400" size={28} />
        <h1 className="text-3xl font-bold text-white">Study Analytics</h1>
      </div>

      {/* Key Metrics Row - Show QuickStats immediately, then replace with detailed stats */}
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
              <h3 className="text-slate-300 font-medium">Study Streak</h3>
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Rate Details */}
        {showSkeleton || !taskStats ? (
          <ChartSkeleton />
        ) : (
          <CompletionRateCard taskStats={taskStats} />
        )}
        
        {/* Study Streak */}
        {showSkeleton || !studyStreak ? (
          <ChartSkeleton />
        ) : (
          <StudyStreakCard studyStreak={studyStreak} />
        )}
        
        {/* Weekly Progress */}
        <div className="lg:col-span-2">
          {showSkeleton || !weeklyProgress ? (
            <ChartSkeleton />
          ) : (
            <WeeklyProgressChart weeklyProgress={weeklyProgress} />
          )}
        </div>
        
        {/* Peak Hours */}
        {showSkeleton || !peakHours ? (
          <ChartSkeleton />
        ) : (
          <PeakHoursChart peakHours={peakHours} />
        )}
        
        {/* Productivity Heatmap */}
        {showSkeleton || !productivityHeatmap ? (
          <HeatmapSkeleton />
        ) : (
          <ProductivityHeatmap productivityData={productivityHeatmap} />
        )}
      </div>

      {/* Subject Statistics */}
      <div className="mt-8">
        {showSkeleton || !subjectStats ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-slate-700 rounded animate-pulse" />
              <div className="w-40 h-5 bg-slate-700 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SubjectCardSkeleton />
              <SubjectCardSkeleton />
              <SubjectCardSkeleton />
            </div>
          </div>
        ) : (
          <SubjectStatsGrid subjectStats={subjectStats} />
        )}
      </div>
    </div>
  );
}