'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, Coffee, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

type TimerState = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroWidgetProps {
  className?: string;
}

const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({ className = '' }) => {
  const { success, warning } = useToast();
  
  const [currentState, setCurrentState] = useState<TimerState>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    setIsRunning(false);

    if (currentState === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      success(`🍅 Work session completed!`);
      
      // Switch to break
      const isLongBreak = newCompletedSessions % 4 === 0;
      setCurrentState(isLongBreak ? 'longBreak' : 'shortBreak');
      setTimeLeft(isLongBreak ? 15 * 60 : 5 * 60);
      
      warning(isLongBreak ? '🎉 Time for a long break!' : '☕ Time for a short break!');
    } else {
      warning('💪 Break time is over!');
      setCurrentState('work');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setCurrentState('work');
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateConfig = () => {
    switch (currentState) {
      case 'work':
        return {
          icon: BookOpen,
          label: 'Focus',
          color: 'text-red-400',
          bg: 'bg-red-900/30',
          border: 'border-red-700'
        };
      case 'shortBreak':
        return {
          icon: Coffee,
          label: 'Break',
          color: 'text-green-400',
          bg: 'bg-green-900/30',
          border: 'border-green-700'
        };
      case 'longBreak':
        return {
          icon: Coffee,
          label: 'Long Break',
          color: 'text-blue-400',
          bg: 'bg-blue-900/30',
          border: 'border-blue-700'
        };
    }
  };

  const stateConfig = getStateConfig();
  const Icon = stateConfig.icon;

  return (
    <div className={`bg-slate-800 rounded-xl border border-slate-700 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${stateConfig.bg} ${stateConfig.border} border`}>
          <Icon className={`w-4 h-4 ${stateConfig.color}`} />
          <span className={`text-sm font-medium ${stateConfig.color}`}>{stateConfig.label}</span>
        </div>
        <Link 
          href="/pomodoro"
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Full Timer
        </Link>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-4">
        <div className="text-3xl font-mono font-bold text-white mb-1">
          {formatTime(timeLeft)}
        </div>
        <div className="text-xs text-slate-400">
          Session {completedSessions + 1}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={toggleTimer}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isRunning
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        
        <button
          onClick={resetTimer}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
          title="Reset Timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Progress indicator */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Progress</span>
          <span>{completedSessions} sessions</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-1000 ${
              currentState === 'work' ? 'bg-red-400' : 'bg-green-400'
            }`}
            style={{ 
              width: `${((currentState === 'work' ? 25 * 60 : currentState === 'shortBreak' ? 5 * 60 : 15 * 60) - timeLeft) / (currentState === 'work' ? 25 * 60 : currentState === 'shortBreak' ? 5 * 60 : 15 * 60) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PomodoroWidget;