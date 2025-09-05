'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, BookOpen, Brain, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import AmbientSoundPlayer from '@/components/FocusEnhancement/AmbientSoundPlayer';
import BreathingExercise from '@/components/FocusEnhancement/BreathingExercise';
import EyeStrainReminder from '@/components/FocusEnhancement/EyeStrainReminder';
import SmartBreakSuggestions from '@/components/FocusEnhancement/SmartBreakSuggestions';

interface FocusSessionSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartSounds: boolean;
  autoSuggestBreathing: boolean;
  eyeCareEnabled: boolean;
}

type SessionState = 'work' | 'shortBreak' | 'longBreak';
type FocusMode = 'minimal' | 'enhanced' | 'full';

export default function FocusSessionPage() {
  const { success, warning } = useToast();
  
  // Pomodoro State
  const [settings, setSettings] = useState<FocusSessionSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartSounds: true,
    autoSuggestBreathing: true,
    eyeCareEnabled: true
  });

  const [currentState, setCurrentState] = useState<SessionState>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Focus Enhancement State
  const [focusMode, setFocusMode] = useState<FocusMode>('enhanced');
  const [soundsActive, setSoundsActive] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [showBreakSuggestions, setShowBreakSuggestions] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    
    if (currentState === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      success(`🍅 Work session completed! Great focus!`);
      
      // Determine next break type
      const isLongBreak = newCompletedSessions % settings.sessionsUntilLongBreak === 0;
      const nextState = isLongBreak ? 'longBreak' : 'shortBreak';
      setCurrentState(nextState);
      
      // Auto-suggest breathing exercise for breaks
      if (settings.autoSuggestBreathing) {
        setShowBreathingModal(true);
      } else {
        setShowBreakSuggestions(true);
      }
      
      warning(isLongBreak 
        ? `🎉 Time for a long break! You've completed ${newCompletedSessions} sessions.`
        : '☕ Time for a short break!'
      );
    } else {
      warning('💪 Break time is over! Ready for another work session?');
      setCurrentState('work');
      
      // Auto-start sounds for work session
      if (settings.autoStartSounds && !soundsActive) {
        setSoundsActive(true);
      }
    }
  };

  const toggleTimer = () => {
    if (!isRunning && currentState === 'work' && settings.autoStartSounds) {
      setSoundsActive(true);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSoundsActive(false);
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

  const getProgress = (): number => {
    const totalDuration = currentState === 'work' 
      ? settings.workDuration * 60
      : currentState === 'shortBreak' 
        ? settings.shortBreakDuration * 60
        : settings.longBreakDuration * 60;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  const getStateConfig = () => {
    switch (currentState) {
      case 'work':
        return {
          icon: BookOpen,
          label: 'Focus Time',
          color: 'red',
          bgGradient: 'from-red-500 to-pink-500',
          lightBg: 'bg-red-900/30',
          textColor: 'text-red-400',
          borderColor: 'border-red-700'
        };
      case 'shortBreak':
        return {
          icon: Coffee,
          label: 'Short Break',
          color: 'green',
          bgGradient: 'from-green-500 to-emerald-500',
          lightBg: 'bg-green-900/30',
          textColor: 'text-green-400',
          borderColor: 'border-green-700'
        };
      case 'longBreak':
        return {
          icon: Coffee,
          label: 'Long Break',
          color: 'blue',
          bgGradient: 'from-blue-500 to-indigo-500',
          lightBg: 'bg-blue-900/30',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-700'
        };
    }
  };

  const stateConfig = getStateConfig();
  const Icon = stateConfig.icon;

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Brain className="w-10 h-10 text-blue-400" />
            Focus Sessions
          </h1>
          <p className="text-slate-400 text-lg">
            Pomodoro Timer + Focus Enhancement Tools
          </p>
        </div>

        {/* Focus Mode Selector */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-8">
          <div className="flex items-center justify-center gap-4">
            <span className="text-slate-400 text-sm">Focus Mode:</span>
            <div className="flex bg-slate-700 rounded-lg p-1">
              {(['minimal', 'enhanced', 'full'] as FocusMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFocusMode(mode)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                    focusMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Timer */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 mb-6">
              {/* Timer Header */}
              <div className="flex items-center justify-between mb-8">
                <div className={`flex items-center gap-3 px-4 py-2 rounded-full ${stateConfig.lightBg} ${stateConfig.borderColor} border`}>
                  <Icon className={`w-6 h-6 ${stateConfig.textColor}`} />
                  <span className={`font-semibold ${stateConfig.textColor}`}>{stateConfig.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {soundsActive && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-700 rounded-full">
                      <Volume2 className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 text-sm">Sounds On</span>
                    </div>
                  )}
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-3 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-xl transition-all duration-200"
                  >
                    <Settings className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Circular Progress Timer */}
              <div className="relative flex items-center justify-center mb-8">
                <svg className="w-80 h-80 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-slate-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                    className={`${stateConfig.textColor} transition-all duration-1000 ease-out`}
                    strokeLinecap="round"
                  />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-7xl font-mono font-bold text-white mb-2">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-lg text-slate-400">
                    Session {completedSessions + 1}
                  </div>
                  {soundsActive && (
                    <div className="text-sm text-blue-400 mt-2">
                      🎵 Focus sounds active
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={toggleTimer}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg bg-gradient-to-r ${stateConfig.bgGradient} text-white`}
                >
                  {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  {isRunning ? 'Pause' : 'Start'}
                </button>
                
                <button
                  onClick={resetTimer}
                  className="flex items-center gap-2 px-6 py-4 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-2xl transition-all duration-200 font-medium"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Focus Tools - Contextual Display */}
            {focusMode !== 'minimal' && (
              <div className="space-y-6">
                {/* Ambient Sounds - Show during work sessions */}
                {(currentState === 'work' || focusMode === 'full') && (
                  <AmbientSoundPlayer
                    isActive={soundsActive}
                    onToggle={setSoundsActive}
                  />
                )}

                {/* Break Suggestions - Show during breaks */}
                {(currentState !== 'work' || focusMode === 'full') && (
                  <SmartBreakSuggestions
                    sessionLength={settings.workDuration}
                    timeOfDay={new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}
                  />
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Stats */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                📊 Today&apos;s Progress
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Completed Sessions</span>
                  <span className="text-white font-semibold">{completedSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Focus Time</span>
                  <span className="text-white font-semibold">
                    {Math.floor(completedSessions * settings.workDuration / 60)}h {(completedSessions * settings.workDuration) % 60}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Streak</span>
                  <span className="text-white font-semibold">{completedSessions}</span>
                </div>
              </div>
            </div>

            {/* Eye Care */}
            {focusMode !== 'minimal' && settings.eyeCareEnabled && (
              <EyeStrainReminder isActive={isRunning} />
            )}

            {/* Quick Actions */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowBreathingModal(true)}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-left"
                >
                  🫁 Breathing Exercise
                </button>
                <button
                  onClick={() => setSoundsActive(!soundsActive)}
                  className={`w-full px-4 py-3 rounded-lg transition-colors text-left ${
                    soundsActive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {soundsActive ? '🔇 Stop Sounds' : '🎵 Start Sounds'}
                </button>
                <button
                  onClick={() => setShowBreakSuggestions(true)}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-left"
                >
                  ☕ Break Ideas
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Focus Session Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Timer Settings */}
                <div>
                  <h4 className="text-white font-medium mb-3">Timer Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Work Duration (minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={settings.workDuration}
                        onChange={(e) => setSettings(prev => ({ ...prev, workDuration: parseInt(e.target.value) || 25 }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Short Break (minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={settings.shortBreakDuration}
                        onChange={(e) => setSettings(prev => ({ ...prev, shortBreakDuration: parseInt(e.target.value) || 5 }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Long Break (minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={settings.longBreakDuration}
                        onChange={(e) => setSettings(prev => ({ ...prev, longBreakDuration: parseInt(e.target.value) || 15 }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Focus Enhancement Settings */}
                <div>
                  <h4 className="text-white font-medium mb-3">Focus Enhancement</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoStartSounds"
                        checked={settings.autoStartSounds}
                        onChange={(e) => setSettings(prev => ({ ...prev, autoStartSounds: e.target.checked }))}
                        className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="autoStartSounds" className="text-sm text-slate-300">
                        Auto-start ambient sounds during work sessions
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoSuggestBreathing"
                        checked={settings.autoSuggestBreathing}
                        onChange={(e) => setSettings(prev => ({ ...prev, autoSuggestBreathing: e.target.checked }))}
                        className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="autoSuggestBreathing" className="text-sm text-slate-300">
                        Suggest breathing exercises during breaks
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="eyeCareEnabled"
                        checked={settings.eyeCareEnabled}
                        onChange={(e) => setSettings(prev => ({ ...prev, eyeCareEnabled: e.target.checked }))}
                        className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="eyeCareEnabled" className="text-sm text-slate-300">
                        Enable eye care reminders (20-20-20 rule)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Breathing Exercise Modal */}
        {showBreathingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Break Time Breathing</h3>
                <button
                  onClick={() => setShowBreathingModal(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
              <BreathingExercise
                onComplete={() => setShowBreathingModal(false)}
                autoStart={true}
              />
            </div>
          </div>
        )}

        {/* Break Suggestions Modal */}
        {showBreakSuggestions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Break Activity Suggestions</h3>
                <button
                  onClick={() => setShowBreakSuggestions(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
              <SmartBreakSuggestions
                sessionLength={settings.workDuration}
                onActivitySelect={() => setShowBreakSuggestions(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}