'use client';

import { WeeklyProgress } from '@/hooks/useAnalytics';
import { TrendingUp, Calendar } from 'lucide-react';

interface WeeklyProgressChartProps {
  weeklyProgress: WeeklyProgress[];
}

export default function WeeklyProgressChart({ weeklyProgress }: WeeklyProgressChartProps) {
  if (weeklyProgress.length === 0) {
    return (
      <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-400" size={20} />
          Weekly Progress
        </h3>
        <div className="text-center py-8">
          <Calendar className="mx-auto mb-4 text-slate-400" size={48} />
          <p className="text-slate-400">No progress data available yet</p>
        </div>
      </div>
    );
  }

  const maxTasks = Math.max(...weeklyProgress.map(w => w.tasksCompleted), 1);
  const maxTime = Math.max(...weeklyProgress.map(w => w.timeSpent), 1);

  const formatWeekLabel = (weekStart: string) => {
    const date = new Date(weekStart);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-400';
    if (rate >= 60) return 'bg-yellow-400';
    if (rate >= 40) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <TrendingUp className="text-green-400" size={20} />
        Weekly Progress Trends
      </h3>

      {/* Chart */}
      <div className="space-y-6">
        {/* Tasks Completed Chart */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Tasks Completed</h4>
          <div className="flex items-end gap-2 h-32">
            {weeklyProgress.map((week, index) => (
              <div key={week.weekStart} className="flex-1 flex flex-col items-center">
                <div className="flex-1 flex items-end w-full">
                  <div
                    className="w-full bg-blue-400 rounded-t transition-all duration-300 hover:bg-blue-300"
                    style={{
                      height: `${(week.tasksCompleted / maxTasks) * 100}%`,
                      minHeight: week.tasksCompleted > 0 ? '4px' : '0px'
                    }}
                    title={`${week.tasksCompleted} tasks completed`}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-2 text-center">
                  {formatWeekLabel(week.weekStart)}
                </div>
                <div className="text-xs font-medium text-blue-400">
                  {week.tasksCompleted}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Spent Chart */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Study Time (minutes)</h4>
          <div className="flex items-end gap-2 h-32">
            {weeklyProgress.map((week, index) => (
              <div key={`time-${week.weekStart}`} className="flex-1 flex flex-col items-center">
                <div className="flex-1 flex items-end w-full">
                  <div
                    className="w-full bg-purple-400 rounded-t transition-all duration-300 hover:bg-purple-300"
                    style={{
                      height: `${(week.timeSpent / maxTime) * 100}%`,
                      minHeight: week.timeSpent > 0 ? '4px' : '0px'
                    }}
                    title={`${week.timeSpent} minutes studied`}
                  />
                </div>
                <div className="text-xs font-medium text-purple-400 mt-2">
                  {Math.round(week.timeSpent)}m
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completion Rate Indicators */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Completion Rate</h4>
          <div className="flex gap-2">
            {weeklyProgress.map((week, index) => (
              <div key={`rate-${week.weekStart}`} className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">
                    {formatWeekLabel(week.weekStart)}
                  </span>
                  <span className="text-xs font-medium text-white">
                    {week.completionRate.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getCompletionColor(week.completionRate)}`}
                    style={{ width: `${week.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-400">
              {weeklyProgress.reduce((sum, w) => sum + w.tasksCompleted, 0)}
            </div>
            <div className="text-xs text-slate-400">Total Tasks</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-400">
              {Math.round(weeklyProgress.reduce((sum, w) => sum + w.timeSpent, 0) / 60)}h
            </div>
            <div className="text-xs text-slate-400">Total Hours</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-400">
              {(weeklyProgress.reduce((sum, w) => sum + w.completionRate, 0) / weeklyProgress.length).toFixed(0)}%
            </div>
            <div className="text-xs text-slate-400">Avg Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}