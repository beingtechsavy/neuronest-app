'use client';

import { TaskCompletionStats } from '@/hooks/useAnalytics';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface CompletionRateCardProps {
  taskStats: TaskCompletionStats;
}

export default function CompletionRateCard({ taskStats }: CompletionRateCardProps) {
  const { totalTasks, completedTasks, overdueTasks, onTimeTasks, completionRate } = taskStats;
  
  const pendingTasks = totalTasks - completedTasks;
  const lateRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;
  const onTimeRate = totalTasks > 0 ? (onTimeTasks / totalTasks) * 100 : 0;

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <CheckCircle className="text-green-400" size={20} />
        Task Completion Overview
      </h3>
      
      {/* Completion Rate Circle */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-slate-700"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - completionRate / 100)}`}
              className="text-green-400 transition-all duration-500"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {completionRate.toFixed(0)}%
              </div>
              <div className="text-xs text-slate-400">Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-sm text-slate-300">Completed</span>
          </div>
          <div className="text-xl font-bold text-green-400">{completedTasks}</div>
        </div>

        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock size={16} className="text-blue-400" />
            <span className="text-sm text-slate-300">Pending</span>
          </div>
          <div className="text-xl font-bold text-blue-400">{pendingTasks}</div>
        </div>

        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertTriangle size={16} className="text-yellow-400" />
            <span className="text-sm text-slate-300">Overdue</span>
          </div>
          <div className="text-xl font-bold text-yellow-400">{overdueTasks}</div>
        </div>

        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle size={16} className="text-purple-400" />
            <span className="text-sm text-slate-300">On Time</span>
          </div>
          <div className="text-xl font-bold text-purple-400">{onTimeTasks}</div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">On-time completion rate</span>
          <span className="text-purple-400 font-medium">{onTimeRate.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Overdue rate</span>
          <span className="text-yellow-400 font-medium">{lateRate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}