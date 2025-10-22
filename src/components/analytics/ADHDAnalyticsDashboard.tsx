'use client';

import { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTodayAnalytics, useFocusSessionStats } from '@/hooks/useTodayAnalytics';
import { useCelebration, useProgressRewards } from '@/hooks/useCelebration';
import { 
  Zap, 
  Target, 
  Trophy, 
  Flame, 
  Star, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Heart,
  Brain,
  Coffee,
  BookOpen,
  TrendingUp,
  Calendar,
  Info,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DemoActions from './DemoActions';
import EnhancedProgressRing from './EnhancedProgressRing';
import AIInsightsPanel from './AIInsightsPanel';
import GestureAnalyticsView from './GestureAnalyticsView';
import FallbackAnalytics from './FallbackAnalytics';


// Celebration animations component
const CelebrationEffect = ({ show, type = 'default' }: { show: boolean; type?: string }) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="absolute inset-0 pointer-events-none flex items-center justify-center"
    >
      <motion.div
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 0.6 }}
        className="text-4xl"
      >
        {type === 'streak' ? '🔥' : type === 'completion' ? '🎉' : '✨'}
      </motion.div>
    </motion.div>
  );
};

// Dopamine-driven progress ring
const ProgressRing = ({ 
  progress, 
  size = 120, 
  strokeWidth = 8, 
  color = 'from-green-400 to-emerald-500',
  showCelebration = false 
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showCelebration?: boolean;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className="text-green-400" stopColor="currentColor" />
            <stop offset="100%" className="text-emerald-500" stopColor="currentColor" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {Math.round(progress)}%
          </div>
          <div className="text-xs text-gray-400">Complete</div>
        </div>
      </div>
      
      <CelebrationEffect show={showCelebration} type="completion" />
    </div>
  );
};

// Hero section with today's focus
const TodayHero = ({ todayStats }: { todayStats: any }) => {
  const [showCelebration, setShowCelebration] = useState(false);
  
  useEffect(() => {
    if (todayStats.progress >= 80) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  }, [todayStats.progress]);

  const getMotivationalMessage = () => {
    if (todayStats.todayTasks === 0) return "🎉 Hooray! No tasks for today - enjoy your free time!";
    if (todayStats.progress >= 90) return "🚀 You&apos;re absolutely crushing it today!";
    if (todayStats.progress >= 70) return "🔥 You&apos;re on fire! Keep going!";
    if (todayStats.progress >= 50) return "💪 Great progress! You&apos;re halfway there!";
    if (todayStats.progress >= 25) return "⭐ Nice start! Building momentum!";
    return "🎯 Ready to make today amazing?";
  };

  const getNextAction = () => {
    if (todayStats.todayTasks === 0) return "Perfect day to relax! 🌟";
    const remaining = todayStats.todayTasks - todayStats.completedToday;
    if (remaining === 0) return "All done! Time to celebrate! 🎉";
    return `${remaining} task${remaining === 1 ? '' : 's'} to go`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-md border border-purple-500/20 rounded-2xl p-8 mb-8 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/10 to-transparent rounded-full blur-2xl" />
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
          <motion.h1 
            className="text-3xl font-bold text-white mb-2 flex items-center gap-3"
            animate={{ scale: showCelebration ? [1, 1.05, 1] : 1 }}
          >
            <Brain className="text-purple-400" size={32} />
            Today&apos;s Progress
          </motion.h1>
          
          <motion.p 
            className="text-lg text-purple-200 mb-4"
            key={getMotivationalMessage()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {getMotivationalMessage()}
          </motion.p>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-300">
              {todayStats.completedToday} of {todayStats.todayTasks} tasks done today
            </div>
            <div className="text-sm text-purple-300">
              {getNextAction()}
            </div>
          </div>
          
          {/* Continue button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-white font-medium flex items-center gap-2 transition-all duration-200 shadow-lg"
            onClick={() => window.location.href = '/tasks'}
          >
            <Target size={20} />
            Continue Working
            <ArrowRight size={16} />
          </motion.button>
        </div>
        
        <div className="ml-8">
          <EnhancedProgressRing 
            progress={todayStats.progress} 
            showCelebration={showCelebration}
            size={140}
            animate={true}
          />
        </div>
      </div>
    </motion.div>
  );
};

// Streak card with visual stars
const StreakCard = ({ studyStreak, todayFocusTime }: { studyStreak: any; todayFocusTime: number }) => {
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  useEffect(() => {
    if (studyStreak?.currentStreak >= 3) {
      setShowStreakCelebration(true);
      setTimeout(() => setShowStreakCelebration(false), 1500);
    }
  }, [studyStreak?.currentStreak]);

  const hasStreakToday = todayFocusTime >= 30;
  const progressToStreak = Math.min(100, (todayFocusTime / 30) * 100);

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⚡';
    if (streak >= 3) return '⭐';
    return '🎯';
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 30) return "Legendary streak! You&apos;re unstoppable!";
    if (streak >= 14) return "Two weeks strong! Amazing dedication!";
    if (streak >= 7) return "One week streak! You&apos;re building a habit!";
    if (streak >= 3) return "Great momentum! Keep it up!";
    if (streak >= 1) return "Nice start! Every day counts!";
    return "Ready to start your streak?";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-gradient-to-br from-orange-900/50 to-red-900/50 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full blur-xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <Flame className="text-orange-400" size={24} />
          <h3 className="text-lg font-semibold text-white">Study Streak</h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowInfo(!showInfo)}
            className="p-1 rounded-full bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
          >
            <Info className="text-orange-300" size={16} />
          </motion.button>
        </div>
        
        {/* Info Panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 overflow-hidden"
            >
              <div className="flex items-start gap-3">
                <Clock className="text-orange-400 mt-0.5" size={16} />
                <div className="text-sm text-orange-200">
                  <p className="font-medium mb-2">How Study Streaks Work:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Complete at least <strong>30 minutes</strong> of focused study in a day</li>
                    <li>• This can be through focus sessions, completing tasks, or studying</li>
                    <li>• Consecutive days of 30+ minutes = your streak! 🔥</li>
                    <li>• Miss a day? No worries - just start fresh tomorrow!</li>
                  </ul>
                  <p className="mt-2 text-xs opacity-80">
                    💡 <strong>Tip:</strong> Use the focus session widget to easily track your study time!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="text-center mb-4">
          <motion.div 
            className="text-6xl mb-2"
            animate={{ 
              scale: showStreakCelebration ? [1, 1.2, 1] : 1,
              rotate: showStreakCelebration ? [0, 10, -10, 0] : 0
            }}
          >
            {getStreakEmoji(studyStreak?.currentStreak || 0)}
          </motion.div>
          
          <div className="text-3xl font-bold text-orange-400 mb-1">
            {studyStreak?.currentStreak || 0}
          </div>
          <div className="text-sm text-gray-300">
            {studyStreak?.currentStreak === 1 ? 'day' : 'days'}
          </div>
        </div>
        
        <p className="text-sm text-orange-200 text-center mb-4">
          {getStreakMessage(studyStreak?.currentStreak || 0)}
        </p>
        
        {/* Visual streak representation */}
        <div className="flex justify-center gap-1 mb-4">
          {Array.from({ length: Math.min(7, studyStreak?.currentStreak || 0) }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="w-3 h-3 bg-orange-400 rounded-full"
            />
          ))}
          {Array.from({ length: Math.max(0, 7 - (studyStreak?.currentStreak || 0)) }).map((_, i) => (
            <div key={`empty-${i}`} className="w-3 h-3 bg-gray-600 rounded-full opacity-30" />
          ))}
        </div>
        
        {/* Today's Focus Progress */}
        <div className="mb-4 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-orange-300">Today&apos;s Focus</span>
            <span className="text-xs text-orange-200 font-medium">
              {Math.floor(todayFocusTime / 60)}h {todayFocusTime % 60}m
            </span>
          </div>
          <div className="w-full bg-orange-900/30 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToStreak}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-2 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full relative overflow-hidden"
            >
              {hasStreakToday && (
                <motion.div
                  animate={{ x: [-100, 100] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  style={{ width: '50px' }}
                />
              )}
            </motion.div>
          </div>
          <div className="text-xs text-center mt-1">
            {hasStreakToday ? (
              <span className="text-orange-300 font-medium">✅ Streak achieved today!</span>
            ) : (
              <span className="text-orange-400">
                {30 - todayFocusTime} min to go for today&apos;s streak
              </span>
            )}
          </div>
        </div>
        
        <div className="text-xs text-gray-400 text-center">
          Best: {studyStreak?.longestStreak || 0} days
        </div>
      </div>
      
      <CelebrationEffect show={showStreakCelebration} type="streak" />
    </motion.div>
  );
};

// Weekly dots visualization
const WeeklyDots = ({ weeklyProgress }: { weeklyProgress: any[] }) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const getDayData = (date: string) => {
    // Check focus session data first
    try {
      const sessionData = localStorage.getItem('focusSessionStats');
      if (sessionData) {
        const stats = JSON.parse(sessionData);
        const dayFocusTime = stats[date] || 0;
        if (dayFocusTime >= 30) {
          return { tasksCompleted: 1, focusTime: dayFocusTime }; // Has activity if 30+ min focus
        }
      }
    } catch (e) {
      console.log('No focus session data for', date);
    }

    // Fallback to weekly progress data
    return weeklyProgress?.find(w => {
      const weekStart = new Date(w.weekStart);
      const dayOfWeek = new Date(date).getDay();
      const dayInWeek = new Date(weekStart);
      dayInWeek.setDate(weekStart.getDate() + dayOfWeek);
      return dayInWeek.toISOString().split('T')[0] === date;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-md border border-green-500/20 rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="text-green-400" size={24} />
        <h3 className="text-lg font-semibold text-white">This Week</h3>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
          const date = last7Days[index];
          const dayData = getDayData(date);
          const hasActivity = dayData && (dayData.tasksCompleted > 0 || dayData.focusTime >= 30);
          const isToday = date === new Date().toISOString().split('T')[0];
          
          return (
            <div key={day} className="text-center">
              <div className="text-xs text-gray-400 mb-2">{day}</div>
              <motion.div
                whileHover={{ scale: 1.2 }}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${hasActivity 
                    ? 'bg-green-400 text-white shadow-lg shadow-green-400/30' 
                    : isToday 
                      ? 'bg-gray-600 text-gray-300 border-2 border-green-400' 
                      : 'bg-gray-700 text-gray-500'
                  }
                `}
                title={hasActivity 
                  ? dayData.focusTime 
                    ? `${Math.floor(dayData.focusTime / 60)}h ${dayData.focusTime % 60}m focus time`
                    : `${dayData.tasksCompleted} tasks completed`
                  : 'No activity'
                }
              >
                {hasActivity ? '✓' : new Date(date).getDate()}
              </motion.div>
            </div>
          );
        })}
      </div>
      
      <div className="text-center">
        <div className="text-sm text-green-200">
          {last7Days.filter(date => {
            const dayData = getDayData(date);
            return dayData && (dayData.tasksCompleted > 0 || dayData.focusTime >= 30);
          }).length} active days this week
        </div>
      </div>
    </motion.div>
  );
};

// Recent wins celebration
const RecentWins = ({ analytics, todayStats }: { analytics: any; todayStats?: any }) => {
  const wins = [];
  
  // Use today's specific stats if available
  const todayTasks = todayStats?.completedToday || 0;
  const todayProgress = todayStats?.progress || 0;
  const focusTime = todayStats?.focusTimeToday || 0;
  
  if (todayTasks > 0) {
    wins.push({
      icon: '✨',
      text: `Completed ${todayTasks} task${todayTasks === 1 ? '' : 's'} today`,
      color: 'text-blue-400'
    });
  }
  
  if (analytics?.studyStreak?.currentStreak >= 3) {
    wins.push({
      icon: '🔥',
      text: `${analytics.studyStreak.currentStreak} day study streak`,
      color: 'text-orange-400'
    });
  }
  
  if (todayProgress >= 80) {
    wins.push({
      icon: '🎯',
      text: `${Math.round(todayProgress)}% of today's tasks done`,
      color: 'text-green-400'
    });
  }
  
  if (analytics?.subjectStats?.some((s: any) => s.completionRate === 100)) {
    const completedSubjects = analytics.subjectStats.filter((s: any) => s.completionRate === 100);
    wins.push({
      icon: '🏆',
      text: `Mastered ${completedSubjects.length} subject${completedSubjects.length === 1 ? '' : 's'}`,
      color: 'text-purple-400'
    });
  }

  // Add focus time wins
  if (focusTime >= 30) {
    wins.push({
      icon: '🧠',
      text: `${Math.floor(focusTime / 60)}h ${focusTime % 60}m of focused work today`,
      color: 'text-indigo-400'
    });
  }

  // Add time-based wins
  const currentHour = new Date().getHours();
  if (todayTasks > 0 && currentHour < 12) {
    wins.push({
      icon: '🌅',
      text: 'Early bird! Started your day productively',
      color: 'text-yellow-400'
    });
  }

  if (wins.length === 0) {
    wins.push({
      icon: '🌟',
      text: 'Ready to create some wins today!',
      color: 'text-yellow-400'
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 backdrop-blur-md border border-yellow-500/20 rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="text-yellow-400" size={24} />
        <h3 className="text-lg font-semibold text-white">Recent Wins</h3>
      </div>
      
      <div className="space-y-3">
        {wins.map((win, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
          >
            <span className="text-2xl">{win.icon}</span>
            <span className={`text-sm ${win.color} font-medium`}>
              {win.text}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Subject cards with simple progress
const SubjectCards = ({ subjectStats }: { subjectStats: any[] }) => {
  console.log('SubjectCards received:', subjectStats); // Debug log
  
  if (!subjectStats || subjectStats.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 text-center"
      >
        <BookOpen className="mx-auto mb-4 text-slate-400" size={48} />
        <h3 className="text-lg font-semibold text-white mb-2">No Subjects Yet</h3>
        <p className="text-slate-400 mb-4">Add some subjects to see your progress</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.href = '/dashboard'}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-white font-medium transition-all duration-200 shadow-lg"
        >
          <BookOpen size={20} className="inline mr-2" />
          Add Your First Subject
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {subjectStats.map((subject, index) => {
        // Ensure we have valid data
        const safeSubject = {
          subject_id: subject.subject_id || index,
          subject_title: subject.subject_title || 'Untitled Subject',
          subject_color: subject.subject_color || '#6366f1',
          completionRate: subject.completionRate || 0,
          completedChapters: subject.completedChapters || 0,
          totalChapters: subject.totalChapters || 0,
          completedTasks: subject.completedTasks || 0,
          totalTasks: subject.totalTasks || 0,
          timeSpent: subject.timeSpent || 0
        };

        return (
          <motion.div
            key={safeSubject.subject_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-4 h-4 rounded-full shadow-lg"
                style={{ backgroundColor: safeSubject.subject_color }}
              />
              <h4 className="font-semibold text-white truncate flex-1">
                {safeSubject.subject_title}
              </h4>
              {safeSubject.completionRate === 100 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <CheckCircle className="text-green-400" size={20} />
                </motion.div>
              )}
            </div>

            {/* Enhanced progress bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Overall Progress</span>
                <span className="text-sm text-white font-medium">
                  {Math.round(safeSubject.completionRate)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${safeSubject.completionRate}%` }}
                  transition={{ duration: 1.5, delay: index * 0.1, ease: "easeOut" }}
                  className="h-3 rounded-full relative"
                  style={{ backgroundColor: safeSubject.subject_color }}
                >
                  {/* Shimmer effect for high progress */}
                  {safeSubject.completionRate >= 80 && (
                    <motion.div
                      animate={{ x: [-100, 100] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      style={{ width: '50px' }}
                    />
                  )}
                </motion.div>
              </div>
            </div>

            {/* Enhanced stats grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-slate-700/30 rounded-lg">
                <div className="text-lg font-bold text-blue-400">
                  {safeSubject.completedChapters}
                </div>
                <div className="text-xs text-gray-400">Chapters</div>
                <div className="text-xs text-gray-500">
                  of {safeSubject.totalChapters}
                </div>
              </div>
              <div className="text-center p-2 bg-slate-700/30 rounded-lg">
                <div className="text-lg font-bold text-green-400">
                  {safeSubject.completedTasks}
                </div>
                <div className="text-xs text-gray-400">Tasks</div>
                <div className="text-xs text-gray-500">
                  of {safeSubject.totalTasks}
                </div>
              </div>
              <div className="text-center p-2 bg-slate-700/30 rounded-lg">
                <div className="text-lg font-bold text-purple-400">
                  {Math.round(safeSubject.timeSpent)}m
                </div>
                <div className="text-xs text-gray-400">Time</div>
                <div className="text-xs text-gray-500">spent</div>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                      i < Math.floor(safeSubject.completionRate / 20)
                        ? 'opacity-100'
                        : 'opacity-30'
                    }`}
                    style={{ 
                      backgroundColor: safeSubject.subject_color,
                      transitionDelay: `${i * 100}ms`
                    }}
                  />
                ))}
              </div>
              <div className="text-xs text-center text-gray-400">
                {safeSubject.completionRate >= 100 ? '🎉 Complete!' :
                 safeSubject.completionRate >= 80 ? '🔥 Almost there!' :
                 safeSubject.completionRate >= 60 ? '💪 Great progress!' :
                 safeSubject.completionRate >= 40 ? '⭐ Getting there!' :
                 safeSubject.completionRate >= 20 ? '🌱 Good start!' :
                 '🎯 Just beginning!'}
              </div>
            </div>

            {/* Action button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 px-4 rounded-xl text-white font-medium transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
              style={{
                backgroundColor: safeSubject.subject_color,
                opacity: 0.9
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onClick={() => {
                window.location.href = `/dashboard?subject=${safeSubject.subject_id}`;
              }}
            >
              {safeSubject.completionRate === 100 ? (
                <>
                  <Trophy size={16} />
                  Review Complete
                </>
              ) : (
                <>
                  <ArrowRight size={16} />
                  Continue Learning
                </>
              )}
            </motion.button>
          </motion.div>
        );
      })}
    </div>
  );
};

export default function ADHDAnalyticsDashboard() {
  const { analytics, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics();
  const { todayStats, loading: todayLoading, error: todayError, refetch: refetchToday } = useTodayAnalytics();
  const todayFocusTime = useFocusSessionStats();
  const { checkAndReward } = useProgressRewards();
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(true);

  const handleRetry = () => {
    refetchAnalytics();
    refetchToday();
  };

  // Combine loading states
  const loading = analyticsLoading || todayLoading;
  const error = analyticsError || todayError;

  // Check for rewards when analytics data changes
  useEffect(() => {
    if (analytics) {
      checkAndReward({
        tasksCompleted: todayStats.completedToday,
        streak: analytics.studyStreak?.currentStreak || 0,
        completionRate: todayStats.progress,
        subjectsCompleted: analytics.subjectStats?.filter((s: any) => s.completionRate === 100).length || 0
      });
    }
  }, [analytics, todayStats, checkAndReward]);

  if (error) {
    return <FallbackAnalytics onRetry={handleRetry} />;
  }

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-6xl mb-4"
          >
            🧠
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Your Progress</h3>
          <p className="text-slate-400">Getting your awesome stats ready...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Sparkles className="text-purple-400" size={32} />
          <h1 className="text-3xl font-bold text-white">Your Progress</h1>
        </motion.div>
        
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowDetailedView(!showDetailedView)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm transition-colors"
        >
          {showDetailedView ? 'Simple View' : 'Detailed View'}
        </motion.button>
      </div>

      {/* Revolutionary AI Insights Panel */}
      {showAIInsights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <AIInsightsPanel analytics={analytics} todayStats={todayStats} />
          
          {/* Toggle button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAIInsights(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 hover:text-white transition-all"
            title="Hide AI Insights"
          >
            ×
          </motion.button>
        </motion.div>
      )}

      {/* Show AI Insights button when hidden */}
      {!showAIInsights && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAIInsights(true)}
          className="w-full py-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl text-white font-medium flex items-center justify-center gap-3 hover:from-indigo-500/30 hover:to-purple-500/30 transition-all"
        >
          <Brain size={20} />
          Show AI Insights
          <Sparkles size={16} />
        </motion.button>
      )}

      {/* Gesture-Driven Analytics Navigation */}
      <GestureAnalyticsView>
        {(timeRange) => (
          <div className="space-y-6">
            {timeRange.id === 'today' && (
              <>
                <TodayHero todayStats={todayStats} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <StreakCard studyStreak={analytics?.studyStreak} todayFocusTime={todayFocusTime} />
                  <WeeklyDots weeklyProgress={analytics?.weeklyProgress || []} />
                  <RecentWins analytics={analytics} todayStats={todayStats} />
                </div>
              </>
            )}
            
            {timeRange.id === 'week' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-md border border-green-500/20 rounded-2xl p-6"
                >
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <Calendar className="text-green-400" size={24} />
                    Weekly Overview
                  </h3>
                  <WeeklyDots weeklyProgress={analytics?.weeklyProgress || []} />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-md border border-blue-500/20 rounded-2xl p-6"
                >
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <TrendingUp className="text-blue-400" size={24} />
                    Weekly Progress
                  </h3>
                  <div className="space-y-4">
                    {analytics?.weeklyProgress?.slice(-4).map((week, index) => (
                      <div key={week.weekStart} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-sm text-gray-300">
                          Week {index + 1}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-gray-700 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${week.completionRate}%` }}
                              transition={{ delay: index * 0.1, duration: 1 }}
                              className="h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                            />
                          </div>
                          <span className="text-sm font-medium text-blue-400">
                            {Math.round(week.completionRate)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
            
            {timeRange.id === 'month' && (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-md border border-purple-500/20 rounded-2xl p-6"
                >
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Trophy className="text-purple-400" size={24} />
                    Monthly Achievements
                  </h3>
                  <SubjectCards subjectStats={analytics?.subjectStats || []} />
                </motion.div>
              </div>
            )}
          </div>
        )}
      </GestureAnalyticsView>

      {/* Demo Actions - Only show in development */}
      {process.env.NODE_ENV === 'development' && <DemoActions />}

      {/* Detailed view toggle */}
      <AnimatePresence>
        {showDetailedView && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-400" size={20} />
              Detailed Stats
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {analytics?.taskStats?.completionRate?.toFixed(1) || '0.0'}%
                </div>
                <div className="text-gray-400">Completion Rate</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {analytics?.taskStats?.averageCompletionTime?.toFixed(1) || '0.0'}
                </div>
                <div className="text-gray-400">Days Early (Avg)</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">
                  {analytics?.taskStats?.onTimeTasks || 0}
                </div>
                <div className="text-gray-400">On-Time Tasks</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}