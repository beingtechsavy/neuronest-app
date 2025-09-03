'use client';

import { StudyStreak } from '@/hooks/useAnalytics';
import { Flame, Calendar, Trophy } from 'lucide-react';

interface StudyStreakCardProps {
  studyStreak: StudyStreak;
}

export default function StudyStreakCard({ studyStreak }: StudyStreakCardProps) {
  const { currentStreak, longestStreak, lastStudyDate, streakDates } = studyStreak;
  
  // Generate last 7 days for streak visualization
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⚡';
    if (streak >= 7) return '💪';
    if (streak >= 3) return '🌟';
    return '🎯';
  };

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Flame className="text-orange-400" size={20} />
        Study Streak
      </h3>

      {/* Current Streak Display */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-2">{getStreakEmoji(currentStreak)}</div>
        <div className="text-3xl font-bold text-orange-400 mb-1">
          {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
        </div>
        <div className="text-sm text-slate-400">Current streak</div>
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy size={16} className="text-yellow-400" />
            <span className="text-sm text-slate-300">Best Streak</span>
          </div>
          <div className="text-xl font-bold text-yellow-400">{longestStreak}</div>
        </div>

        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar size={16} className="text-blue-400" />
            <span className="text-sm text-slate-300">Last Study</span>
          </div>
          <div className="text-sm font-bold text-blue-400">
            {formatDate(lastStudyDate)}
          </div>
        </div>
      </div>

      {/* Last 7 Days Visualization */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-300">Last 7 Days</h4>
        <div className="flex gap-1">
          {last7Days.map((date, index) => {
            const hasStudy = streakDates.includes(date);
            const isToday = date === new Date().toISOString().split('T')[0];
            
            return (
              <div key={date} className="flex-1 text-center">
                <div
                  className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium mx-auto mb-1
                    ${hasStudy 
                      ? 'bg-orange-400 text-white' 
                      : isToday 
                        ? 'bg-slate-600 text-slate-300 border-2 border-orange-400' 
                        : 'bg-slate-700 text-slate-500'
                    }
                  `}
                >
                  {hasStudy ? '✓' : new Date(date).getDate()}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational Message */}
      <div className="mt-6 p-3 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-lg border border-orange-500/20">
        <p className="text-sm text-center text-orange-300">
          {currentStreak === 0 
            ? "Start your study streak today! 🚀"
            : currentStreak < 7
              ? `Keep it up! ${7 - currentStreak} more days to reach a week! 💪`
              : currentStreak < longestStreak
                ? `You're on fire! ${longestStreak - currentStreak} days to beat your record! 🔥`
                : "New personal record! You're unstoppable! 🏆"
          }
        </p>
      </div>
    </div>
  );
}