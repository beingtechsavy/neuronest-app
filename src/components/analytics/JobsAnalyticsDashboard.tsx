'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { useTodayAnalytics } from '@/hooks/useTodayAnalytics';
import { 
  TrendingUp, 
  Target, 
  Flame, 
  BookOpen, 
  Clock,
  Calendar,
  Award,
  BarChart3,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

// Steve Jobs-worthy detailed analytics - ruthlessly simplified
export default function JobsAnalyticsDashboard() {
  const { analytics, loading, error } = useAnalytics();
  const { todayStats } = useTodayAnalytics();

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-red-400 mb-4">Unable to load analytics</p>
        <p className="text-slate-400 text-sm">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-6xl mb-4"
          >
            📈
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2">Analyzing Your Progress</h3>
          <p className="text-slate-400">Crunching the numbers...</p>
        </div>
      </div>
    );
  }

  const { taskStats, subjectStats, studyStreak } = analytics || {};

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <BarChart3 className="mx-auto mb-4 text-purple-400" size={48} />
        <h1 className="text-4xl font-bold text-white mb-2">Detailed Analytics</h1>
        <p className="text-slate-400">Deep insights into your learning journey</p>
      </motion.div>

      {/* Key Performance Indicators - Only What Matters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Overall Completion Rate */}
        <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-md border border-green-500/20 rounded-2xl p-8 text-center">
          <Target className="mx-auto mb-4 text-green-400" size={32} />
          <h3 className="text-lg font-semibold text-white mb-2">Task Success Rate</h3>
          <div className="text-4xl font-bold text-green-400 mb-2">
            {taskStats?.completionRate?.toFixed(0) || '0'}%
          </div>
          <p className="text-green-200 text-sm">
            {taskStats?.completedTasks || 0} of {taskStats?.totalTasks || 0} tasks completed
          </p>
          <div className="mt-4 w-full bg-green-900/30 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${taskStats?.completionRate || 0}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
            />
          </div>
        </div>

        {/* Study Consistency */}
        <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 backdrop-blur-md border border-orange-500/20 rounded-2xl p-8 text-center">
          <Flame className="mx-auto mb-4 text-orange-400" size={32} />
          <h3 className="text-lg font-semibold text-white mb-2">Study Consistency</h3>
          <div className="text-4xl font-bold text-orange-400 mb-2">
            {studyStreak?.currentStreak || 0}
          </div>
          <p className="text-orange-200 text-sm">
            day streak (best: {studyStreak?.longestStreak || 0})
          </p>
          <div className="mt-4 flex justify-center gap-1">
            {Array.from({ length: Math.min(7, studyStreak?.currentStreak || 0) }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="w-2 h-2 bg-orange-400 rounded-full"
              />
            ))}
            {Array.from({ length: Math.max(0, 7 - (studyStreak?.currentStreak || 0)) }).map((_, i) => (
              <div key={`empty-${i}`} className="w-2 h-2 bg-gray-600 rounded-full opacity-30" />
            ))}
          </div>
        </div>

        {/* Today's Focus */}
        <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-md border border-blue-500/20 rounded-2xl p-8 text-center">
          <Clock className="mx-auto mb-4 text-blue-400" size={32} />
          <h3 className="text-lg font-semibold text-white mb-2">Today&apos;s Focus</h3>
          <div className="text-4xl font-bold text-blue-400 mb-2">
            {Math.floor((todayStats?.focusTimeToday || 0) / 60)}h {(todayStats?.focusTimeToday || 0) % 60}m
          </div>
          <p className="text-blue-200 text-sm">
            {todayStats?.focusTimeToday >= 30 ? '✅ Goal achieved!' : `${30 - (todayStats?.focusTimeToday || 0)}m to goal`}
          </p>
          <div className="mt-4 w-full bg-blue-900/30 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, ((todayStats?.focusTimeToday || 0) / 30) * 100)}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Subject Performance - Only If There Are Subjects */}
      {subjectStats && subjectStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <BookOpen className="text-blue-400" size={28} />
            Subject Performance
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjectStats.slice(0, 6).map((subject, index) => (
              <motion.div
                key={subject.subject_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: subject.subject_color }}
                    />
                    <h3 className="font-semibold text-white">{subject.subject_title}</h3>
                  </div>
                  {subject.completionRate === 100 && (
                    <CheckCircle2 className="text-green-400" size={20} />
                  )}
                </div>

                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Overall Progress</span>
                      <span className="text-sm font-medium text-white">
                        {Math.round(subject.completionRate)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${subject.completionRate}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        className="h-3 rounded-full"
                        style={{ backgroundColor: subject.subject_color }}
                      />
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-400">
                        {subject.completedChapters}
                      </div>
                      <div className="text-xs text-gray-400">Chapters</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-400">
                        {subject.completedTasks}
                      </div>
                      <div className="text-xs text-gray-400">Tasks</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-400">
                        {Math.round(subject.timeSpent)}m
                      </div>
                      <div className="text-xs text-gray-400">Time</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Weekly Trend - Simple and Clear */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-8"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Calendar className="text-green-400" size={28} />
          Weekly Activity
        </h2>

        <div className="grid grid-cols-7 gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            const dateStr = date.toISOString().split('T')[0];
            
            // Check if this day has focus session data
            let hasActivity = false;
            let focusTime = 0;
            try {
              const sessionData = localStorage.getItem('focusSessionStats');
              if (sessionData) {
                const stats = JSON.parse(sessionData);
                focusTime = stats[dateStr] || 0;
                hasActivity = focusTime >= 30;
              }
            } catch (e) {
              // Ignore
            }

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-sm text-gray-400 mb-2">{day}</div>
                <div
                  className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium mx-auto mb-2
                    ${hasActivity 
                      ? 'bg-green-400 text-white shadow-lg shadow-green-400/30' 
                      : 'bg-gray-700 text-gray-400'
                    }
                  `}
                >
                  {hasActivity ? '✓' : date.getDate()}
                </div>
                <div className="text-xs text-gray-500">
                  {focusTime > 0 ? `${Math.floor(focusTime / 60)}h ${focusTime % 60}m` : 'No activity'}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-400">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - i));
              const dateStr = date.toISOString().split('T')[0];
              
              try {
                const sessionData = localStorage.getItem('focusSessionStats');
                if (sessionData) {
                  const stats = JSON.parse(sessionData);
                  return (stats[dateStr] || 0) >= 30;
                }
              } catch (e) {
                return false;
              }
              return false;
            }).filter(Boolean).length} active days this week
          </div>
        </div>
      </motion.div>

      {/* Insights - What Actually Matters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-md border border-purple-500/20 rounded-2xl p-8"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Zap className="text-purple-400" size={28} />
          Key Insights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-200">What&apos;s Working</h3>
            <div className="space-y-3">
              {studyStreak && studyStreak.currentStreak >= 3 && (
                <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-2xl">🔥</div>
                  <div>
                    <div className="text-sm font-medium text-green-300">Strong Consistency</div>
                    <div className="text-xs text-green-400">{studyStreak.currentStreak} day study streak</div>
                  </div>
                </div>
              )}
              
              {taskStats && taskStats.completionRate >= 80 && (
                <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <div className="text-sm font-medium text-blue-300">High Performance</div>
                    <div className="text-xs text-blue-400">{Math.round(taskStats.completionRate)}% task completion rate</div>
                  </div>
                </div>
              )}

              {todayStats && todayStats.focusTimeToday >= 60 && (
                <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-2xl">⏰</div>
                  <div>
                    <div className="text-sm font-medium text-purple-300">Deep Focus</div>
                    <div className="text-xs text-purple-400">{Math.floor(todayStats.focusTimeToday / 60)}h+ focused work today</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-200">Opportunities</h3>
            <div className="space-y-3">
              {studyStreak && studyStreak.currentStreak === 0 && (
                <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="text-2xl">🌱</div>
                  <div>
                    <div className="text-sm font-medium text-orange-300">Build Consistency</div>
                    <div className="text-xs text-orange-400">Start a study streak today</div>
                  </div>
                </div>
              )}

              {taskStats && taskStats.completionRate < 60 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="text-2xl">📈</div>
                  <div>
                    <div className="text-sm font-medium text-yellow-300">Improve Completion</div>
                    <div className="text-xs text-yellow-400">Focus on finishing started tasks</div>
                  </div>
                </div>
              )}

              {todayStats && todayStats.focusTimeToday < 30 && (
                <div className="flex items-center gap-3 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <div className="text-sm font-medium text-cyan-300">Increase Focus Time</div>
                    <div className="text-xs text-cyan-400">Aim for 30+ minutes daily</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}