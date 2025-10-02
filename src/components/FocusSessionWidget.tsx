'use client';

import React from 'react';
import { Play, Pause, Brain, Eye, Wind, BookOpen, Coffee } from 'lucide-react';
import Link from 'next/link';
import { useFocusSession } from '@/contexts/FocusSessionContext';

interface FocusSessionWidgetProps {
  className?: string;
}

const FocusSessionWidget: React.FC<FocusSessionWidgetProps> = ({ className = '' }) => {
  const {
    state,
    startSession,
    pauseSession,
    resumeSession,
    resetSession,
    formatTime,
    getProgress,
    getStateConfig
  } = useFocusSession();

  const toggleTimer = () => {
    if (!state.isRunning) {
      if (state.currentState === 'idle') {
        startSession();
      } else {
        resumeSession();
      }
    } else {
      pauseSession();
    }
  };

  const stateConfig = getStateConfig();
  const progress = getProgress();

  // Get appropriate icon for session state
  const getStateIcon = () => {
    switch (state.currentState) {
      case 'work':
        return BookOpen;
      case 'shortBreak':
      case 'longBreak':
        return Coffee;
      default:
        return Brain;
    }
  };

  const StateIcon = getStateIcon();
  const activeFeatures = [
    state.settings.eyeCareEnabled,
    state.settings.autoSuggestBreathing
  ].filter(Boolean).length;

  return (
    <div className={`bg-slate-800 rounded-xl border border-slate-700 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StateIcon className={`w-5 h-5 ${stateConfig.textColor}`} />
          <span className="font-semibold text-white">{stateConfig.label}</span>
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
        <div className={`text-3xl font-mono font-bold ${stateConfig.textColor} mb-1`}>
          {formatTime(state.timeLeft)}
        </div>
        <div className="text-xs text-slate-400 mb-2">
          Session {state.completedSessions + 1} • {state.isRunning ? 'Running' : state.isActive ? 'Paused' : 'Ready'}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
          <div 
            className={`h-2 rounded-full bg-gradient-to-r ${stateConfig.bgGradient} transition-all duration-1000`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Focus Features Status - Simplified */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
            state.settings.eyeCareEnabled
              ? 'bg-green-900/30 border border-green-700 text-green-300'
              : 'bg-slate-700/50 text-slate-400'
          }`}
        >
          <Eye className="w-4 h-4 mb-1" />
          <span className="text-xs">Eye Care</span>
        </div>

        <div
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
            state.settings.autoSuggestBreathing
              ? 'bg-purple-900/30 border border-purple-700 text-purple-300'
              : 'bg-slate-700/50 text-slate-400'
          }`}
        >
          <Wind className="w-4 h-4 mb-1" />
          <span className="text-xs">Breathing</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={toggleTimer}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-gradient-to-r ${stateConfig.bgGradient} text-white hover:opacity-90`}
        >
          {state.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {state.isRunning ? 'Pause' : (state.currentState === 'idle' ? 'Start' : 'Resume')}
        </button>
        
        <button
          onClick={resetSession}
          className="px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
          title="Reset"
        >
          ↻
        </button>
      </div>

      {/* Status */}
      <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-700">
        <span>{activeFeatures}/2 tools active</span>
        <span>Sessions: {state.completedSessions}</span>
      </div>
    </div>
  );
};

export default FocusSessionWidget;