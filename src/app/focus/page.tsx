'use client';

import React, { useState } from 'react';
import AmbientSoundPlayer from '@/components/FocusEnhancement/AmbientSoundPlayer';
import BreathingExercise from '@/components/FocusEnhancement/BreathingExercise';
import EyeStrainReminder from '@/components/FocusEnhancement/EyeStrainReminder';
import SmartBreakSuggestions from '@/components/FocusEnhancement/SmartBreakSuggestions';
import { Brain, Headphones, Wind, Eye, Coffee, Settings } from 'lucide-react';

interface FocusSession {
  soundsEnabled: boolean;
  eyeCareEnabled: boolean;
  breakRemindersEnabled: boolean;
  sessionLength: number;
}

export default function FocusPage() {
  const [focusSession, setFocusSession] = useState<FocusSession>({
    soundsEnabled: false,
    eyeCareEnabled: true,
    breakRemindersEnabled: true,
    sessionLength: 25
  });

  const [activeComponents, setActiveComponents] = useState({
    sounds: false,
    breathing: false,
    eyeCare: true,
    breaks: true
  });

  const updateFocusSession = (updates: Partial<FocusSession>) => {
    setFocusSession(prev => ({ ...prev, ...updates }));
  };

  const toggleComponent = (component: keyof typeof activeComponents) => {
    setActiveComponents(prev => ({
      ...prev,
      [component]: !prev[component]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Brain className="w-10 h-10 text-blue-400" />
            Focus Enhancement Suite
          </h1>
          <p className="text-slate-400 text-lg">
            Optimize your concentration with science-backed tools
          </p>
        </div>

        {/* Quick Controls */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Focus Session Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Session Length */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Session Length (minutes)
              </label>
              <select
                value={focusSession.sessionLength}
                onChange={(e) => updateFocusSession({ sessionLength: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={15}>15 minutes</option>
                <option value={25}>25 minutes (Pomodoro)</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes (Deep Work)</option>
              </select>
            </div>

            {/* Component Toggles */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sounds"
                checked={activeComponents.sounds}
                onChange={() => toggleComponent('sounds')}
                className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="sounds" className="text-sm text-slate-300 flex items-center gap-2">
                <Headphones className="w-4 h-4" />
                Ambient Sounds
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="eyeCare"
                checked={activeComponents.eyeCare}
                onChange={() => toggleComponent('eyeCare')}
                className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="eyeCare" className="text-sm text-slate-300 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Eye Care
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="breaks"
                checked={activeComponents.breaks}
                onChange={() => toggleComponent('breaks')}
                className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="breaks" className="text-sm text-slate-300 flex items-center gap-2">
                <Coffee className="w-4 h-4" />
                Smart Breaks
              </label>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Audio & Breathing */}
          <div className="space-y-8">
            {/* Ambient Sounds */}
            {activeComponents.sounds && (
              <AmbientSoundPlayer
                isActive={focusSession.soundsEnabled}
                onToggle={(isPlaying) => updateFocusSession({ soundsEnabled: isPlaying })}
              />
            )}

            {/* Breathing Exercise */}
            <BreathingExercise />
          </div>

          {/* Middle Column - Eye Care */}
          <div className="space-y-8">
            {activeComponents.eyeCare && (
              <EyeStrainReminder
                isActive={focusSession.eyeCareEnabled}
                onSettingsChange={(settings) => updateFocusSession({ eyeCareEnabled: settings.enabled })}
              />
            )}

            {/* Focus Tips */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                💡 Focus Tips
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Use binaural beats with headphones for maximum effect</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  <span>Take breathing breaks between intense work sessions</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>Follow the 20-20-20 rule to prevent eye strain</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Match break activities to your energy level</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Break Suggestions */}
          <div className="space-y-8">
            {activeComponents.breaks && (
              <SmartBreakSuggestions
                sessionLength={focusSession.sessionLength}
                userEnergyLevel="medium"
              />
            )}

            {/* Focus Statistics */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                📊 Today&apos;s Focus
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Deep Work Sessions</span>
                  <span className="text-white font-semibold">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Focus Time</span>
                  <span className="text-white font-semibold">2h 15m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Breathing Exercises</span>
                  <span className="text-white font-semibold">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Eye Breaks Taken</span>
                  <span className="text-white font-semibold">8/10</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-left">
                  🎯 Start 25-min Focus Session
                </button>
                <button className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-left">
                  🫁 Quick Breathing Exercise
                </button>
                <button className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-left">
                  👁️ Eye Break Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Science Section */}
        <div className="mt-12 bg-slate-800 rounded-lg border border-slate-700 p-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            🧠 The Science Behind Focus Enhancement
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-3">🎵</div>
              <h3 className="text-white font-semibold mb-2">Binaural Beats</h3>
              <p className="text-slate-400 text-sm">
                40Hz gamma waves enhance focus and cognitive performance by synchronizing brainwaves.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-3">🫁</div>
              <h3 className="text-white font-semibold mb-2">Controlled Breathing</h3>
              <p className="text-slate-400 text-sm">
                Activates the parasympathetic nervous system, reducing stress and improving concentration.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-3">👁️</div>
              <h3 className="text-white font-semibold mb-2">20-20-20 Rule</h3>
              <p className="text-slate-400 text-sm">
                Prevents digital eye strain by allowing eye muscles to relax and refocus regularly.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-white font-semibold mb-2">Strategic Breaks</h3>
              <p className="text-slate-400 text-sm">
                Prevents mental fatigue and maintains peak cognitive performance throughout the day.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}