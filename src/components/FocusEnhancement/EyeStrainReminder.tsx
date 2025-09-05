'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Eye, Clock, Settings, Play, Pause, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface EyeStrainSettings {
  reminderInterval: number; // minutes
  exerciseDuration: number; // seconds
  enabled: boolean;
  soundEnabled: boolean;
}

interface EyeStrainReminderProps {
  isActive?: boolean;
  onSettingsChange?: (settings: EyeStrainSettings) => void;
}

const EyeStrainReminder: React.FC<EyeStrainReminderProps> = ({
  isActive = true,
  onSettingsChange
}) => {
  const { warning, success } = useToast();
  
  const [settings, setSettings] = useState<EyeStrainSettings>({
    reminderInterval: 20, // 20-20-20 rule: every 20 minutes
    exerciseDuration: 20, // look at something 20 feet away for 20 seconds
    enabled: true,
    soundEnabled: true
  });
  
  const [timeUntilReminder, setTimeUntilReminder] = useState(settings.reminderInterval * 60);
  const [showReminder, setShowReminder] = useState(false);
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState(0);
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const reminderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const exerciseIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Main reminder countdown
  useEffect(() => {
    if (!settings.enabled || !isActive) {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
      return;
    }

    reminderIntervalRef.current = setInterval(() => {
      setTimeUntilReminder(prev => {
        if (prev <= 1) {
          triggerReminder();
          return settings.reminderInterval * 60; // Reset timer
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
    };
  }, [settings.enabled, settings.reminderInterval, isActive]);

  // Exercise countdown
  useEffect(() => {
    if (!isExerciseActive) return;

    exerciseIntervalRef.current = setInterval(() => {
      setExerciseTimeLeft(prev => {
        if (prev <= 1) {
          completeExercise();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (exerciseIntervalRef.current) {
        clearInterval(exerciseIntervalRef.current);
      }
    };
  }, [isExerciseActive]);

  const triggerReminder = () => {
    setShowReminder(true);
    
    if (settings.soundEnabled) {
      // Play a gentle notification sound
      playNotificationSound();
    }
    
    warning('👁️ Time for an eye break! Look at something 20 feet away for 20 seconds.');
  };

  const startExercise = () => {
    setExerciseTimeLeft(settings.exerciseDuration);
    setIsExerciseActive(true);
    setShowReminder(false);
  };

  const skipExercise = () => {
    setShowReminder(false);
    setTimeUntilReminder(settings.reminderInterval * 60); // Reset timer
  };

  const completeExercise = () => {
    setIsExerciseActive(false);
    setExerciseTimeLeft(0);
    success('✅ Great job! Your eyes will thank you.');
    setTimeUntilReminder(settings.reminderInterval * 60); // Reset timer
  };

  const playNotificationSound = () => {
    // Create a gentle notification sound
    if (typeof window !== 'undefined') {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a gentle bell-like sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  };

  const updateSettings = (newSettings: Partial<EyeStrainSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    onSettingsChange?.(updatedSettings);
    
    // Reset timer if interval changed
    if (newSettings.reminderInterval) {
      setTimeUntilReminder(updatedSettings.reminderInterval * 60);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Main Widget */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            👁️ Eye Care
          </h3>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Status Display */}
        <div className="text-center mb-4">
          <div className="text-3xl font-mono font-bold text-white mb-2">
            {formatTime(timeUntilReminder)}
          </div>
          <div className="text-slate-400 text-sm">
            {settings.enabled ? 'Until next eye break' : 'Eye reminders disabled'}
          </div>
        </div>

        {/* Progress Ring */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (timeUntilReminder / (settings.reminderInterval * 60))}`}
              className="text-blue-500 transition-all duration-1000"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Eye className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => updateSettings({ enabled: !settings.enabled })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              settings.enabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {settings.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {settings.enabled ? 'Disable' : 'Enable'}
          </button>
          
          <button
            onClick={triggerReminder}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Break Now
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-slate-700/50 rounded-lg space-y-4">
            <h4 className="text-white font-medium">Eye Care Settings</h4>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Reminder Interval (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={settings.reminderInterval}
                onChange={(e) => updateSettings({ reminderInterval: parseInt(e.target.value) || 20 })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Exercise Duration (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="60"
                value={settings.exerciseDuration}
                onChange={(e) => updateSettings({ exerciseDuration: parseInt(e.target.value) || 20 })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="soundEnabled"
                checked={settings.soundEnabled}
                onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="soundEnabled" className="text-sm text-slate-300">
                Play notification sound
              </label>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p className="text-blue-300 text-sm">
            💡 <strong>20-20-20 Rule:</strong> Every 20 minutes, look at something 20 feet away for 20 seconds to reduce eye strain.
          </p>
        </div>
      </div>

      {/* Reminder Modal */}
      {showReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">👁️</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Time for an Eye Break!
              </h3>
              <p className="text-slate-300">
                Look at something 20 feet away (6 meters) for {settings.exerciseDuration} seconds to rest your eyes.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={skipExercise}
                className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={startExercise}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Start Exercise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Modal */}
      {isExerciseActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">🔭</div>
            <h3 className="text-2xl font-semibold text-white mb-4">
              Look Far Away
            </h3>
            <div className="text-4xl font-mono font-bold text-blue-400 mb-4">
              {exerciseTimeLeft}s
            </div>
            <p className="text-slate-300 mb-6">
              Focus on something at least 20 feet away. Let your eyes relax and refocus.
            </p>
            
            <button
              onClick={() => setIsExerciseActive(false)}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              <X className="w-4 h-4 inline mr-2" />
              Stop Early
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EyeStrainReminder;