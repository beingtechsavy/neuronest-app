'use client';

import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabaseClient';

// Types and Interfaces
export interface FocusSessionSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoSuggestBreathing: boolean;
  eyeCareEnabled: boolean;
}

export type SessionState = 'work' | 'shortBreak' | 'longBreak' | 'idle';

export interface ActiveSound {
  id: string;
  name: string;
  volume: number;
  isPlaying: boolean;
}

export interface AudioState {
  currentSounds: ActiveSound[];
  masterVolume: number;
  isMuted: boolean;
  isLoading: boolean;
  isActive: boolean;
  selectedSoundId: string | null;
}

export interface FocusSessionState {
  // Session State
  isActive: boolean;
  currentState: SessionState;
  timeLeft: number;
  isRunning: boolean;
  completedSessions: number;
  sessionStartTime: number | null;
  
  // Task Attribution (NEW)
  currentTaskId: number | null;
  currentTaskTitle: string | null;
  currentSubjectColor: string | null;
  dbSessionId: number | null;
  
  // Settings
  settings: FocusSessionSettings;
  
  // Audio State
  audioState: AudioState;
  
  // UI State
  floatingWidgetVisible: boolean;
  floatingWidgetMinimized: boolean;
}

// Action Types
type FocusSessionAction =
  | { type: 'START_SESSION'; payload?: { taskId?: number; taskTitle?: string; subjectColor?: string; dbSessionId?: number } }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'SKIP_SESSION' }
  | { type: 'RESET_SESSION' }
  | { type: 'TICK' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<FocusSessionSettings> }

  | { type: 'TOGGLE_FLOATING_WIDGET' }
  | { type: 'MINIMIZE_FLOATING_WIDGET'; payload: boolean }
  | { type: 'RESTORE_STATE'; payload: Partial<FocusSessionState> };

// Initial State
const initialSettings: FocusSessionSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoSuggestBreathing: true,
  eyeCareEnabled: true
};

const initialAudioState: AudioState = {
  currentSounds: [],
  masterVolume: 0.7,
  isMuted: false,
  isLoading: false,
  isActive: false,
  selectedSoundId: null
};

const initialState: FocusSessionState = {
  isActive: false,
  currentState: 'idle',
  timeLeft: initialSettings.workDuration * 60,
  isRunning: false,
  completedSessions: 0,
  sessionStartTime: null,
  
  // Task Attribution
  currentTaskId: null,
  currentTaskTitle: null,
  currentSubjectColor: null,
  dbSessionId: null,
  
  settings: initialSettings,
  audioState: initialAudioState,
  floatingWidgetVisible: false,
  floatingWidgetMinimized: false
};

// Reducer
function focusSessionReducer(state: FocusSessionState, action: FocusSessionAction): FocusSessionState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        isActive: true,
        isRunning: true,
        currentState: 'work',
        timeLeft: state.settings.workDuration * 60, // Ensure we have the correct time
        sessionStartTime: Date.now(),
        floatingWidgetVisible: true,
        
        // Task Attribution
        currentTaskId: action.payload?.taskId || null,
        currentTaskTitle: action.payload?.taskTitle || null,
        currentSubjectColor: action.payload?.subjectColor || null,
        dbSessionId: action.payload?.dbSessionId || null
      };

    case 'PAUSE_SESSION':
      return {
        ...state,
        isRunning: false
      };

    case 'RESUME_SESSION':
      return {
        ...state,
        isRunning: true,
        sessionStartTime: state.sessionStartTime || Date.now() // Ensure we have a start time
      };

    case 'COMPLETE_SESSION':
    case 'SKIP_SESSION':
      const isWorkSession = state.currentState === 'work';
      const newCompletedSessions = isWorkSession ? state.completedSessions + 1 : state.completedSessions;
      
      let nextState: SessionState;
      let nextTimeLeft: number;
      
      if (isWorkSession) {
        const isLongBreak = newCompletedSessions % state.settings.sessionsUntilLongBreak === 0;
        nextState = isLongBreak ? 'longBreak' : 'shortBreak';
        nextTimeLeft = isLongBreak 
          ? state.settings.longBreakDuration * 60 
          : state.settings.shortBreakDuration * 60;
      } else {
        nextState = 'work';
        nextTimeLeft = state.settings.workDuration * 60;
      }

      return {
        ...state,
        isRunning: false,
        currentState: nextState,
        timeLeft: nextTimeLeft,
        completedSessions: newCompletedSessions,
        
        // Reset task attribution when session completes
        currentTaskId: null,
        currentTaskTitle: null,
        currentSubjectColor: null,
        dbSessionId: null
      };

    case 'RESET_SESSION':
      // Fully reset to initial idle state
      return {
        ...initialState,
        settings: state.settings, // Keep user settings
        completedSessions: state.completedSessions // Keep session count for the day
      };

    case 'TICK':
      const newTimeLeft = Math.max(0, state.timeLeft - 1);
      return {
        ...state,
        timeLeft: newTimeLeft
      };

    case 'UPDATE_SETTINGS':
      const newSettings = { ...state.settings, ...action.payload };
      let updatedTimeLeft = state.timeLeft;
      
      // Update timeLeft if not running and duration changed
      if (!state.isRunning) {
        if (state.currentState === 'work') {
          updatedTimeLeft = newSettings.workDuration * 60;
        } else if (state.currentState === 'shortBreak') {
          updatedTimeLeft = newSettings.shortBreakDuration * 60;
        } else if (state.currentState === 'longBreak') {
          updatedTimeLeft = newSettings.longBreakDuration * 60;
        }
      }

      return {
        ...state,
        settings: newSettings,
        timeLeft: updatedTimeLeft
      };



    case 'TOGGLE_FLOATING_WIDGET':
      return {
        ...state,
        floatingWidgetVisible: !state.floatingWidgetVisible
      };

    case 'MINIMIZE_FLOATING_WIDGET':
      return {
        ...state,
        floatingWidgetMinimized: action.payload
      };

    case 'RESTORE_STATE':
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
}

// Context
interface FocusSessionContextType {
  state: FocusSessionState;
  startSession: (payload?: { taskId?: number; taskTitle?: string; subjectColor?: string; dbSessionId?: number }) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  skipSession: () => void;
  resetSession: () => void;
  updateSettings: (settings: Partial<FocusSessionSettings>) => void;
  toggleFloatingWidget: () => void;
  minimizeFloatingWidget: (minimized: boolean) => void;
  formatTime: (seconds: number) => string;
  getProgress: () => number;
  getStateConfig: () => {
    iconName: string;
    label: string;
    color: string;
    bgGradient: string;
    lightBg: string;
    textColor: string;
    borderColor: string;
  };
}

const FocusSessionContext = createContext<FocusSessionContextType | undefined>(undefined);

// Provider Component
interface FocusSessionProviderProps {
  children: ReactNode;
}

export function FocusSessionProvider({ children }: FocusSessionProviderProps) {
  const [state, dispatch] = useReducer(focusSessionReducer, initialState);
  const { success, warning } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup effect to ensure timer is cleared on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const handleSessionComplete = useCallback(() => {
    const isWorkSession = state.currentState === 'work';
    
    if (isWorkSession) {
      success('🍅 Work session completed! Great focus!');
      
      const newCompletedSessions = state.completedSessions + 1;
      const isLongBreak = newCompletedSessions % state.settings.sessionsUntilLongBreak === 0;
      
      warning(isLongBreak 
        ? `🎉 Time for a long break! You've completed ${newCompletedSessions} sessions.`
        : '☕ Time for a short break!'
      );

      // Save completed work session to analytics
      try {
        const today = new Date().toISOString().split('T')[0];
        const sessionDuration = state.settings.workDuration; // Duration in minutes
        
        // Update localStorage stats for analytics
        const existingData = localStorage.getItem('focusSessionStats');
        const stats = existingData ? JSON.parse(existingData) : {};
        stats[today] = (stats[today] || 0) + sessionDuration;
        localStorage.setItem('focusSessionStats', JSON.stringify(stats));
        
        console.log('Session completed and saved to analytics:', {
          today,
          sessionDuration,
          totalToday: stats[today]
        });

        // If we have a database session ID, complete it in the database
        if (state.dbSessionId) {
          supabase
            .from('focus_sessions')
            .update({
              end_time: new Date().toISOString(),
              duration: sessionDuration,
              completed: true
            })
            .eq('session_id', state.dbSessionId)
            .then(({ error }) => {
              if (error) {
                console.error('Error completing database session:', error);
              } else {
                console.log('Database session completed:', state.dbSessionId);
              }
            });
        }
      } catch (error) {
        console.error('Error saving session to analytics:', error);
      }
    } else {
      warning('💪 Break time is over! Ready for another work session?');
    }
    
    dispatch({ type: 'COMPLETE_SESSION' });
  }, [state.currentState, state.completedSessions, state.settings.sessionsUntilLongBreak, state.settings.workDuration, state.dbSessionId, success, warning]);

  const handleSessionSkip = useCallback(() => {
    const isWorkSession = state.currentState === 'work';
    
    if (isWorkSession) {
      warning('⏭️ Work session skipped. Moving to break.');

      // Save skipped work session to analytics (count as full session)
      try {
        const today = new Date().toISOString().split('T')[0];
        const sessionDuration = state.settings.workDuration; // Full duration even if skipped
        
        // Update localStorage stats for analytics
        const existingData = localStorage.getItem('focusSessionStats');
        const stats = existingData ? JSON.parse(existingData) : {};
        stats[today] = (stats[today] || 0) + sessionDuration;
        localStorage.setItem('focusSessionStats', JSON.stringify(stats));
        
        console.log('Skipped session counted as full session:', {
          today,
          sessionDuration,
          totalToday: stats[today]
        });

        // If we have a database session ID, complete it in the database
        if (state.dbSessionId) {
          supabase
            .from('focus_sessions')
            .update({
              end_time: new Date().toISOString(),
              duration: sessionDuration,
              completed: true,
              was_skipped: true // Optional: track that it was skipped
            })
            .eq('session_id', state.dbSessionId)
            .then(({ error }) => {
              if (error) {
                console.error('Error completing skipped session:', error);
              } else {
                console.log('Skipped session saved to database:', state.dbSessionId);
              }
            });
        }
      } catch (error) {
        console.error('Error saving skipped session to analytics:', error);
      }
    } else {
      success('⏭️ Break skipped! Ready for the next work session.');
    }
    
    dispatch({ type: 'SKIP_SESSION' });
  }, [state.currentState, state.settings.workDuration, state.dbSessionId, success, warning]);

  // Timer effect - simplified and more reliable
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start timer if session is running and has time left
    if (state.isRunning && state.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    }
    
    // Handle session completion
    if (state.timeLeft === 0 && state.isActive) {
      handleSessionComplete();
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isRunning, state.timeLeft, state.isActive, handleSessionComplete]);

  // Simple persistence - no complex time calculations
  // DISABLED AUTO-RESTORE to prevent confusing UI flicker
  // Users must explicitly start a new session each time
  useEffect(() => {
    // Clear any old session state on mount
    const savedState = localStorage.getItem('focusSessionState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Only clear if session is old (>5 minutes)
        const sessionAge = Date.now() - (parsedState.sessionStartTime || 0);
        const fiveMinutes = 5 * 60 * 1000;
        
        if (sessionAge > fiveMinutes) {
          localStorage.removeItem('focusSessionState');
        }
      } catch (error) {
        localStorage.removeItem('focusSessionState');
      }
    }
  }, []);

  // Save state only when session starts, pauses, or resets (not every second)
  useEffect(() => {
    if (state.isActive) {
      localStorage.setItem('focusSessionState', JSON.stringify({
        isActive: state.isActive,
        currentState: state.currentState,
        timeLeft: state.timeLeft,
        isRunning: state.isRunning,
        completedSessions: state.completedSessions,
        sessionStartTime: state.sessionStartTime,
        settings: state.settings
      }));
    } else {
      localStorage.removeItem('focusSessionState');
    }
  }, [state.isActive, state.currentState, state.isRunning, state.completedSessions, state.sessionStartTime, state.settings, state.timeLeft]);

  // Audio management is now handled by AmbientSoundContext - no auto-start here

  // No auto-start sounds - user must explicitly control sounds

  // Action handlers
  const startSession = (payload?: { taskId?: number; taskTitle?: string; subjectColor?: string; dbSessionId?: number }) => {
    dispatch({ type: 'START_SESSION', payload });
  };

  const pauseSession = () => {
    dispatch({ type: 'PAUSE_SESSION' });
  };

  const resumeSession = () => {
    dispatch({ type: 'RESUME_SESSION' });
  };

  const skipSession = () => {
    handleSessionSkip();
  };

  const resetSession = () => {
    dispatch({ type: 'RESET_SESSION' });
  };

  const updateSettings = (settings: Partial<FocusSessionSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  // Audio controls removed - handled by AmbientSoundContext

  const toggleFloatingWidget = () => {
    dispatch({ type: 'TOGGLE_FLOATING_WIDGET' });
  };

  const minimizeFloatingWidget = (minimized: boolean) => {
    dispatch({ type: 'MINIMIZE_FLOATING_WIDGET', payload: minimized });
  };

  // Utility functions
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    const totalDuration = state.currentState === 'work' 
      ? state.settings.workDuration * 60
      : state.currentState === 'shortBreak' 
        ? state.settings.shortBreakDuration * 60
        : state.settings.longBreakDuration * 60;
    return ((totalDuration - state.timeLeft) / totalDuration) * 100;
  };

  const getStateConfig = () => {
    switch (state.currentState) {
      case 'work':
        return {
          iconName: 'BookOpen',
          label: 'Focus Time',
          color: 'red',
          bgGradient: 'from-red-500 to-pink-500',
          lightBg: 'bg-red-900/30',
          textColor: 'text-red-400',
          borderColor: 'border-red-700'
        };
      case 'shortBreak':
        return {
          iconName: 'Coffee',
          label: 'Short Break',
          color: 'green',
          bgGradient: 'from-green-500 to-emerald-500',
          lightBg: 'bg-green-900/30',
          textColor: 'text-green-400',
          borderColor: 'border-green-700'
        };
      case 'longBreak':
        return {
          iconName: 'Coffee',
          label: 'Long Break',
          color: 'blue',
          bgGradient: 'from-blue-500 to-indigo-500',
          lightBg: 'bg-blue-900/30',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-700'
        };
      default:
        return {
          iconName: 'Brain',
          label: 'Ready to Focus',
          color: 'gray',
          bgGradient: 'from-gray-500 to-slate-500',
          lightBg: 'bg-gray-900/30',
          textColor: 'text-gray-400',
          borderColor: 'border-gray-700'
        };
    }
  };

  const contextValue: FocusSessionContextType = {
    state,
    startSession,
    pauseSession,
    resumeSession,
    skipSession,
    resetSession,
    updateSettings,
    toggleFloatingWidget,
    minimizeFloatingWidget,
    formatTime,
    getProgress,
    getStateConfig
  };

  return (
    <FocusSessionContext.Provider value={contextValue}>
      {children}
    </FocusSessionContext.Provider>
  );
}

// Custom Hook
export function useFocusSession() {
  const context = useContext(FocusSessionContext);
  if (context === undefined) {
    throw new Error('useFocusSession must be used within a FocusSessionProvider');
  }
  return context;
}