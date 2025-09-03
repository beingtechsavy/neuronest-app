'use client';

import { SubjectStats } from '@/hooks/useAnalytics';
import { BookOpen, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface SubjectStatsGridProps {
  subjectStats: SubjectStats[];
}

export default function SubjectStatsGrid({ subjectStats }: SubjectStatsGridProps) {
  if (subjectStats.length === 0) {
    return (
      <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700 text-center">
        <BookOpen className="mx-auto mb-4 text-slate-400" size={48} />
        <h3 className="text-lg font-semibold text-white mb-2">No Subjects Yet</h3>
        <p className="text-slate-400">Add some subjects to see detailed analytics</p>
      </div>
    );
  }

  const getStressLevelColor = (level: number) => {
    if (level >= 70) return 'text-red-400';
    if (level >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStressLevelText = (level: number) => {
    if (level >= 70) return 'High';
    if (level >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <BookOpen className="text-blue-400" size={20} />
        Subject Performance
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjectStats.map((subject) => (
          <div
            key={subject.subject_id}
            className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
          >
            {/* Subject Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: subject.subject_color }}
              />
              <h4 className="font-semibold text-white truncate flex-1">
                {subject.subject_title}
              </h4>
            </div>

            {/* Progress Bars */}
            <div className="space-y-3 mb-4">
              {/* Chapter Progress */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">Chapters</span>
                  <span className="text-xs text-slate-300">
                    {subject.completedChapters}/{subject.totalChapters}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: subject.subject_color,
                      width: `${subject.completionRate}%`
                    }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {subject.completionRate.toFixed(0)}% complete
                </div>
              </div>

              {/* Task Progress */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">Tasks</span>
                  <span className="text-xs text-slate-300">
                    {subject.completedTasks}/{subject.totalTasks}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-green-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${subject.taskCompletionRate}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {subject.taskCompletionRate.toFixed(0)}% complete
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-2 bg-slate-700/30 rounded">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock size={12} className="text-blue-400" />
                  <span className="text-xs text-slate-400">Time</span>
                </div>
                <div className="text-sm font-bold text-blue-400">
                  {Math.round(subject.timeSpent)}m
                </div>
              </div>

              <div className="text-center p-2 bg-slate-700/30 rounded">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <AlertTriangle size={12} className={getStressLevelColor(subject.averageStressLevel)} />
                  <span className="text-xs text-slate-400">Stress</span>
                </div>
                <div className={`text-sm font-bold ${getStressLevelColor(subject.averageStressLevel)}`}>
                  {getStressLevelText(subject.averageStressLevel)}
                </div>
              </div>
            </div>

            {/* Performance Indicator */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Overall Progress</span>
              <div className="flex items-center gap-1">
                <CheckCircle size={12} className="text-green-400" />
                <span className="text-green-400 font-medium">
                  {((subject.completionRate + subject.taskCompletionRate) / 2).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-3 border-t border-slate-700">
              <div className="flex gap-2">
                <button
                  className="flex-1 text-xs py-2 px-3 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                  onClick={() => {
                    // Navigate to subject details
                    window.location.href = `/dashboard?subject=${subject.subject_id}`;
                  }}
                >
                  View Details
                </button>
                {subject.taskCompletionRate < 100 && (
                  <button
                    className="flex-1 text-xs py-2 px-3 rounded text-white transition-colors"
                    style={{
                      backgroundColor: subject.subject_color,
                      opacity: 0.8
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.8';
                    }}
                    onClick={() => {
                      // Navigate to tasks for this subject
                      window.location.href = `/tasks?subject=${subject.subject_id}`;
                    }}
                  >
                    Study Now
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}