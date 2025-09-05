'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Brain, Volume2, VolumeX, Eye, Wind } from 'lucide-react';
import Link from 'next/link';

interface FocusSessionWidgetProps {
  className?: string;
}

const FocusSessionWidget: React.FC<FocusSessionWidgetProps> = ({ className = '' }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState(1);
  const [focusFeatures, setFocusFeatures] = useState({
    sounds: false,
    eyeCare: true,
    breathing: false
  });

  // Simple countdown timer
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFeature = (feature: keyof typeof focusFeatures) => {
    setFocusFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  const activeFeatures = Object.values(focusFeatures).filter(Boolean).length;
  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className={`bg-slate-800 rounded-xl border border-slate-700 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-white">Focus Session</span>
        </div>
        <Link 
          href="/focus-session"
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Full Session
        </Link>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-4">
        <div className="text-3xl font-mono font-bold text-white mb-1">
          {formatTime(timeLeft)}
        </div>
        <div className="text-xs text-slate-400 mb-2">
          Session {currentSession} • Pomodoro + Focus Tools
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Focus Features Status */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={() => toggleFeature('sounds')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
            focusFeatures.sounds
              ? 'bg-blue-900/30 border border-blue-700 text-blue-300'
              : 'bg-slate-700/50 text-slate-400 hover:text-slate-300'
          }`}
        >
          {focusFeatures.sounds ? <Volume2 className="w-4 h-4 mb-1" /> : <VolumeX className="w-4 h-4 mb-1" />}
          <span className="text-xs">Sounds</span>
        </button>

        <button
          onClick={() => toggleFeature('eyeCare')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
            focusFeatures.eyeCare
              ? 'bg-green-900/30 border border-green-700 text-green-300'
              : 'bg-slate-700/50 text-slate-400 hover:text-slate-300'
          }`}
        >
          <Eye className="w-4 h-4 mb-1" />
          <span className="text-xs">Eye Care</span>
        </button>

        <button
          onClick={() => toggleFeature('breathing')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
            focusFeatures.breathing
              ? 'bg-purple-900/30 border border-purple-700 text-purple-300'
              : 'bg-slate-700/50 text-slate-400 hover:text-slate-300'
          }`}
        >
          <Wind className="w-4 h-4 mb-1" />
          <span className="text-xs">Breathing</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={toggleTimer}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
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
          className="px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
          title="Reset"
        >
          ↻
        </button>
      </div>

      {/* Status */}
      <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-700">
        <span>{activeFeatures}/3 tools active</span>
        <span>Today: 2h 15m</span>
      </div>
    </div>
  );
};

export default FocusSessionWidget;