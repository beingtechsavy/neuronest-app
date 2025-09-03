'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

type TimerState = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroTimerProps {
  onSessionComplete?: (type: TimerState, duration: number) => void;
  taskId?: string;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ 
  onSessionComplete,
  taskId 
}) => {
  const { success, warning } = useToast();
  
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4
  });

  const [currentState, setCurrentState] = useState<TimerState>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Update timeLeft when settings change
  useEffect(() => {
    if (!isRunning) {
      const duration = currentState === 'work' 
        ? settings.workDuration 
        : currentState === 'shortBreak' 
          ? settings.shortBreakDuration 
          : settings.longBreakDuration;
      setTimeLeft(duration * 60);
    }
  }, [settings, currentState, isRunning]);

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
    
    const sessionDuration = currentState === 'work' 
      ? settings.workDuration 
      : currentState === 'shortBreak' 
        ? settings.shortBreakDuration 
        : settings.longBreakDuration;

    // Notify parent component
    onSessionComplete?.(currentState, sessionDuration);

    if (currentState === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      success(`Work session completed! Great job! 🍅`);
      
      // Determine next break type
      const isLongBreak = newCompletedSessions % settings.sessionsUntilLongBreak === 0;
      const nextState = isLongBreak ? 'longBreak' : 'shortBreak';
      setCurrentState(nextState);
      
      warning(isLongBreak 
        ? `Time for a long break! You've completed ${newCompletedSessions} sessions.`
        : 'Time for a short break!'
      );
    } else {
      warning('Break time is over! Ready for another work session?');
      setCurrentState('work');
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const duration = currentState === 'work' 
      ? settings.workDuration 
      : currentState === 'shortBreak' 
        ? settings.shortBreakDuration 
        : settings.longBreakDuration;
    setTimeLeft(duration * 60);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateIcon = () => {
    switch (currentState) {
      case 'work':
        return <BookOpen className="w-6 h-6" />;
      case 'shortBreak':
      case 'longBreak':
        return <Coffee className="w-6 h-6" />;
    }
  };

  const getStateColor = () => {
    switch (currentState) {
      case 'work':
        return 'text-red-400 bg-red-900/30 border-red-700';
      case 'shortBreak':
        return 'text-green-400 bg-green-900/30 border-green-700';
      case 'longBreak':
        return 'text-blue-400 bg-blue-900/30 border-blue-700';
    }
  };

  const getStateLabel = () => {
    switch (currentState) {
      case 'work':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStateColor()}`}>
          {getStateIcon()}
          <span className="font-medium text-sm">{getStateLabel()}</span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className="text-6xl font-mono font-bold text-white mb-2">
          {formatTime(timeLeft)}
        </div>
        <div className="text-sm text-slate-400">
          Session {completedSessions + 1} • {completedSessions} completed
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={toggleTimer}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            isRunning
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        
        <button
          onClick={resetTimer}
          className="flex items-center gap-2 px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-t border-slate-700 pt-4 space-y-4">
          <h3 className="font-medium text-white">Timer Settings</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Work Duration (min)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.workDuration}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  workDuration: parseInt(e.target.value) || 25
                }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Short Break (min)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.shortBreakDuration}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  shortBreakDuration: parseInt(e.target.value) || 5
                }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Long Break (min)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.longBreakDuration}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  longBreakDuration: parseInt(e.target.value) || 15
                }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Sessions until Long Break
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={settings.sessionsUntilLongBreak}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  sessionsUntilLongBreak: parseInt(e.target.value) || 4
                }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;