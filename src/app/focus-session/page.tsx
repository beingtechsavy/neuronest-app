'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, BookOpen, Brain, Volume2, VolumeX, Target } from 'lucide-react';
import { useFocusSession } from '@/contexts/FocusSessionContext';
import { useFocusSessionTasks } from '@/hooks/useFocusSessionTasks';
import TaskSelectionModal from '@/components/TaskSelectionModal';
import AmbientSoundPlayer from '@/components/FocusEnhancement/AmbientSoundPlayer';
import BreathingExercise from '@/components/FocusEnhancement/BreathingExercise';
import EyeStrainReminder from '@/components/FocusEnhancement/EyeStrainReminder';
import SmartBreakSuggestions from '@/components/FocusEnhancement/SmartBreakSuggestions';

type FocusMode = 'minimal' | 'enhanced' | 'full';

// Today's Progress Card Component
function TodayProgressCard({ completedSessions, workDuration }: { completedSessions: number; workDuration: number }) {
  const [todayFocusTime, setTodayFocusTime] = useState(0);
  const [todaySessionCount, setTodaySessionCount] = useState(0);

  useEffect(() => {
    // Get today's data from localStorage
    const updateTodayData = () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get focus time
        const sessionData = localStorage.getItem('focusSessionStats');
        if (sessionData) {
          const stats = JSON.parse(sessionData);
          const todayTime = stats[today] || 0;
          setTodayFocusTime(todayTime);
          
          // Calculate session count from focus time (assuming standard work duration)
          const sessionCount = Math.floor(todayTime / workDuration);
          setTodaySessionCount(sessionCount);
        }
      } catch (error) {
        console.error('Error reading today\'s data:', error);
      }
    };

    updateTodayData();
    // Update every 10 seconds
    const interval = setInterval(updateTodayData, 10000);
    return () => clearInterval(interval);
  }, [workDuration]);

  // Use localStorage data if available, otherwise use context
  const displayFocusTime = todayFocusTime > 0 ? todayFocusTime : (completedSessions * workDuration);
  const displaySessions = todaySessionCount > 0 ? todaySessionCount : completedSessions;
  const hours = Math.floor(displayFocusTime / 60);
  const minutes = displayFocusTime % 60;

  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
        <h3 className="text-xl font-light text-white">Today&apos;s Progress</h3>
      </div>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-light">Sessions</span>
          <span className="text-3xl font-light text-white">{displaySessions}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-light">Focus Time</span>
          <span className="text-xl font-light text-white">
            {hours}h {minutes}m
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-light">Streak</span>
          <span className="text-xl font-light text-white">{displaySessions}</span>
        </div>
      </div>
    </div>
  );
}

export default function FocusSessionPage() {
  // Use the focus session context
  const {
    state,
    startSession,
    pauseSession,
    resumeSession,
    skipSession,
    resetSession,
    updateSettings,
    toggleFloatingWidget,
    formatTime,
    getProgress,
    getStateConfig
  } = useFocusSession();

  const { startFocusSession, completeFocusSession, smartSuggestions, lastTask } = useFocusSessionTasks();

  // Local UI state
  const [showSettings, setShowSettings] = useState(false);
  const [focusMode, setFocusMode] = useState<FocusMode>('enhanced');
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [showBreakSuggestions, setShowBreakSuggestions] = useState(false);
  const [showTaskSelection, setShowTaskSelection] = useState(false);

  // Loading state for session start
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Handle task selection and start session
  const handleStartWithTask = async (task: any) => {
    setIsStartingSession(true);
    
    try {
      // Start database session
      const dbSessionId = await startFocusSession(task?.task_id);
      
      // Small delay for better UX (shows loading state)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Start UI session with task info
      startSession({
        taskId: task?.task_id,
        taskTitle: task?.title,
        subjectColor: task?.subject_color,
        dbSessionId: dbSessionId || undefined
      });
    } finally {
      setIsStartingSession(false);
    }
  };

  // Handle timer controls
  const toggleTimer = () => {
    if (!state.isRunning) {
      if (state.currentState === 'idle') {
        // Show task selection instead of starting immediately
        setShowTaskSelection(true);
      } else {
        resumeSession();
      }
    } else {
      pauseSession();
    }
  };

  const handleReset = () => {
    resetSession();
  };

  const stateConfig = getStateConfig();
  
  // Map icon names to actual components
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return BookOpen;
      case 'Coffee': return Coffee;
      case 'Brain': return Brain;
      default: return Brain;
    }
  };
  
  const Icon = getIconComponent(stateConfig.iconName);

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

        {/* Simplified Mode Selector - Steve Jobs: "Simplicity is the ultimate sophistication" */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-slate-800/50 backdrop-blur-sm rounded-full p-1 border border-slate-700">
            {(['minimal', 'enhanced', 'full'] as FocusMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setFocusMode(mode)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 capitalize ${
                  focusMode === mode
                    ? 'bg-white text-slate-900 shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Timer - Clean and Focused */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 mb-6 shadow-2xl">
              {/* Clean Header - Minimal and Elegant */}
              <div className="flex items-center justify-between mb-12">
                <div className={`flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r ${stateConfig.bgGradient} shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                  <span className="font-medium text-white">{stateConfig.label}</span>
                </div>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all duration-200"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              {/* Beautiful Circular Timer - Steve Jobs would love this simplicity */}
              <div className="relative flex items-center justify-center mb-12">
                <div className="relative">
                  <svg className="w-96 h-96 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="rgba(148, 163, 184, 0.1)"
                      strokeWidth="1"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="url(#gradient)"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                      className="transition-all duration-1000 ease-out drop-shadow-lg"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-8xl font-light text-white mb-3 tracking-tight">
                      {formatTime(state.timeLeft)}
                    </div>
                    
                    {/* Show current task if selected */}
                    {state.currentTaskTitle ? (
                      <div className="text-center mb-2">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: state.currentSubjectColor || '#6366f1' }}
                          />
                          <div className="text-slate-300 text-lg font-medium">
                            {state.currentTaskTitle}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-lg font-light mb-2">
                        General Study
                      </div>
                    )}
                    
                    <div className="text-slate-400 text-sm">
                      Session {state.completedSessions + 1}
                    </div>
                    <div className="text-slate-500 text-sm mt-1">
                      {Math.round(getProgress())}% complete
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset Session Button - Show if session is active but user wants to start fresh */}
              {state.isActive && !state.isRunning && (
                <div className="mb-8 text-center">
                  <div className="space-y-4">
                    <p className="text-slate-400 text-sm">Session paused</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <button
                        onClick={() => {
                          resetSession();
                          localStorage.removeItem('focusSessionState');
                        }}
                        className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-white font-medium transition-all duration-200 shadow-lg"
                      >
                        <RotateCcw size={16} />
                        Start New Session
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State - Show while starting session */}
              {isStartingSession && (
                <div className="mb-8 text-center">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/30">
                      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-300 font-medium">Starting your focus session...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Continue - Last Task (Compact) */}
              {!state.isActive && !isStartingSession && lastTask && (
                <div className="mb-6 text-center">
                  <p className="text-slate-400 text-xs mb-3">Quick Continue</p>
                  <button
                    onClick={() => handleStartWithTask(lastTask)}
                    disabled={isStartingSession}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 hover:border-yellow-500/50 rounded-lg text-yellow-300 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: lastTask.subject_color }}
                    />
                    {lastTask.title}
                  </button>
                </div>
              )}

              {/* Current Task Display - Show during active session */}
              {state.isActive && state.currentTaskTitle && (
                <div className="mb-8 text-center">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-xl border border-slate-600/50 backdrop-blur-sm">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: state.currentSubjectColor || '#6366f1' }}
                    />
                    <span className="text-slate-300 font-medium">Focusing on:</span>
                    <span className="text-white font-semibold">{state.currentTaskTitle}</span>
                    <button
                      onClick={() => setShowTaskSelection(true)}
                      className="ml-2 text-slate-400 hover:text-white text-sm underline"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* Main Action Button - Single, Clear Call-to-Action */}
              <div className="flex items-center justify-center gap-6">
                {state.isActive ? (
                  <>
                    <button
                      onClick={toggleTimer}
                      className={`group flex items-center gap-4 px-12 py-5 rounded-full font-medium text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl bg-gradient-to-r ${stateConfig.bgGradient} text-white hover:shadow-3xl`}
                    >
                      {state.isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
                      {state.isRunning ? 'Pause' : 'Resume'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Primary Action: Choose Task */}
                    <button
                      onClick={() => setShowTaskSelection(true)}
                      disabled={isStartingSession}
                      className="group flex items-center gap-4 px-12 py-5 rounded-full font-medium text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Target className="w-7 h-7" />
                      Choose Task & Start
                    </button>
                    
                    {/* Secondary Action: General Session */}
                    <button
                      onClick={() => handleStartWithTask(null)}
                      disabled={isStartingSession}
                      className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-all duration-300 font-medium backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Start without a specific task"
                    >
                      <Brain className="w-5 h-5" />
                      General
                    </button>
                  </>
                )}
                
                {/* Skip button - elegant and contextual */}
                {state.isActive && state.currentState !== 'idle' && (
                  <button
                    onClick={skipSession}
                    className="flex items-center gap-3 px-8 py-5 text-orange-400 hover:text-white hover:bg-orange-500 rounded-full transition-all duration-300 font-medium border border-orange-400/30 hover:border-orange-500 backdrop-blur-sm"
                    title={state.currentState === 'work' ? 'Skip to break' : 'Skip break'}
                  >
                    ⏭️ Skip {state.currentState === 'work' ? 'to Break' : 'Break'}
                  </button>
                )}
                
                <button
                  onClick={handleReset}
                  className="flex items-center gap-3 px-8 py-5 text-slate-400 hover:text-white hover:bg-slate-600 rounded-full transition-all duration-300 font-medium backdrop-blur-sm"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Focus Enhancement Tools - Contextual and Elegant */}
            {focusMode !== 'minimal' && (
              <div className="space-y-8">
                {/* Ambient Sounds - The ONLY place for sound controls */}
                <div className="transform transition-all duration-500 hover:scale-[1.02]">
                  <AmbientSoundPlayer />
                </div>

                {/* Break Suggestions - Show during breaks or in full mode */}
                {(state.currentState !== 'work' || focusMode === 'full') && (
                  <div className="transform transition-all duration-500 hover:scale-[1.02]">
                    <SmartBreakSuggestions
                      sessionLength={state.settings.workDuration}
                      timeOfDay={new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Elegant Sidebar */}
          <div className="space-y-8">
            {/* Beautiful Progress Card */}
            <TodayProgressCard 
              completedSessions={state.completedSessions}
              workDuration={state.settings.workDuration}
            />

            {/* Eye Care */}
            {focusMode !== 'minimal' && state.settings.eyeCareEnabled && (
              <EyeStrainReminder isActive={state.isRunning} />
            )}

            {/* Minimal Quick Actions */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-400 rounded-full"></div>
                <h3 className="text-xl font-light text-white">Quick Actions</h3>
              </div>
              <div className="space-y-4">
                {state.isActive && !state.floatingWidgetVisible && (
                  <button
                    onClick={toggleFloatingWidget}
                    className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500/20 to-indigo-600/20 hover:from-indigo-500/30 hover:to-indigo-600/30 text-indigo-300 rounded-xl transition-all duration-300 text-left border border-indigo-500/20 hover:border-indigo-400/30 backdrop-blur-sm"
                  >
                    📱 Show Floating Widget
                  </button>
                )}
                <button
                  onClick={() => setShowBreathingModal(true)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 text-blue-300 rounded-xl transition-all duration-300 text-left border border-blue-500/20 hover:border-blue-400/30 backdrop-blur-sm"
                >
                  🫁 Breathing Exercise
                </button>
                <button
                  onClick={() => setShowBreakSuggestions(true)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 text-purple-300 rounded-xl transition-all duration-300 text-left border border-purple-500/20 hover:border-purple-400/30 backdrop-blur-sm"
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
                        value={state.settings.workDuration}
                        onChange={(e) => updateSettings({ workDuration: parseInt(e.target.value) || 25 })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Short Break (minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={state.settings.shortBreakDuration}
                        onChange={(e) => updateSettings({ shortBreakDuration: parseInt(e.target.value) || 5 })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Long Break (minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={state.settings.longBreakDuration}
                        onChange={(e) => updateSettings({ longBreakDuration: parseInt(e.target.value) || 15 })}
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
                        id="autoSuggestBreathing"
                        checked={state.settings.autoSuggestBreathing}
                        onChange={(e) => updateSettings({ autoSuggestBreathing: e.target.checked })}
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
                        checked={state.settings.eyeCareEnabled}
                        onChange={(e) => updateSettings({ eyeCareEnabled: e.target.checked })}
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
                sessionLength={state.settings.workDuration}
                onActivitySelect={() => setShowBreakSuggestions(false)}
              />
            </div>
          </div>
        )}

        {/* Task Selection Modal */}
        <TaskSelectionModal
          isOpen={showTaskSelection}
          onClose={() => setShowTaskSelection(false)}
          onSelectTask={(task) => {
            handleStartWithTask(task);
            setShowTaskSelection(false);
          }}
        />
      </div>
    </div>
  );
}