'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';
import { Loader2, Moon, Sun, Coffee, Utensils, Clock, Brain, Zap } from 'lucide-react';
import { useToastContext } from '@/components/ToastProvider';
import { useTimeouts } from '@/hooks/useTimeout';
import UsageDashboard from '@/components/UsageDashboard';

// --- TYPE DEFINITIONS ---
interface UserPreferences {
  sleep_start: string;
  sleep_end: string;
  meal_start_times: string[];
  meal_duration: number;
  session_length: number;
  buffer_length: number;
}

// --- MAIN COMPONENT ---
export default function SettingsPage() {
  const { success, error: showError } = useToastContext();
  const { addTimeout } = useTimeouts();
  const user = useUser();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // If data exists, use it. Otherwise, create default preferences.
        setPreferences(data || {
          sleep_start: '23:00',
          sleep_end: '07:00',
          meal_start_times: ['08:00', '13:00', '19:00'],
          meal_duration: 60,
          session_length: 50,
          buffer_length: 10,
        });
      }
      setLoading(false);
    };
    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    if (!user || !preferences) return;
    setIsSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id, ...preferences });

    if (error) {
      console.error('Settings save error:', error);
      showError('Failed to save preferences');
      setMessage('Error saving preferences.');
    } else {
      success('Preferences saved successfully!');
      setMessage('Preferences saved successfully!');
      addTimeout(() => setMessage(''), 3000);
    }
    setIsSaving(false);
  };

  const handleMealTimeChange = (index: number, value: string) => {
    if (!preferences) return;
    const newMealTimes = [...preferences.meal_start_times];
    newMealTimes[index] = value;
    setPreferences({ ...preferences, meal_start_times: newMealTimes });
  };

  if (loading || !preferences) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-white" />
          </div>
          <p className="text-slate-400 text-sm">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl">
            <Brain size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-light text-white mb-2">
            Your Rhythm
          </h1>
          <p className="text-slate-400 text-lg">
            Personalize your perfect day
          </p>
        </div>

        <div className="space-y-8">
          {/* Usage Dashboard */}
          <UsageDashboard />

          {/* Sleep Schedule - Redesigned */}
          <div className="group">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <Moon size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-light text-white">Sleep</h2>
                  <p className="text-slate-400 text-sm">When you rest and recharge</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-slate-300 text-sm font-medium">Bedtime</label>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={preferences.sleep_start} 
                      onChange={(e) => setPreferences({ ...preferences, sleep_start: e.target.value })}
                      className="w-full bg-white/10 backdrop-blur-sm text-white text-lg p-4 rounded-2xl border border-white/20 focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 outline-none transition-all duration-200 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-slate-300 text-sm font-medium">Wake up</label>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={preferences.sleep_end} 
                      onChange={(e) => setPreferences({ ...preferences, sleep_end: e.target.value })}
                      className="w-full bg-white/10 backdrop-blur-sm text-white text-lg p-4 rounded-2xl border border-white/20 focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 outline-none transition-all duration-200 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Meals - Redesigned */}
          <div className="group">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                  <Utensils size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-light text-white">Meals</h2>
                  <p className="text-slate-400 text-sm">Fuel your focus throughout the day</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                {preferences.meal_start_times.map((time, index) => {
                  const mealNames = ['Breakfast', 'Lunch', 'Dinner'];
                  const mealIcons = [Coffee, Sun, Moon];
                  const MealIcon = mealIcons[index];
                  
                  return (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MealIcon size={16} className="text-slate-400" />
                        <label className="block text-slate-300 text-sm font-medium">
                          {mealNames[index]}
                        </label>
                      </div>
                      <input 
                        type="time" 
                        value={time} 
                        onChange={(e) => handleMealTimeChange(index, e.target.value)}
                        className="w-full bg-white/10 backdrop-blur-sm text-white p-3 rounded-xl border border-white/20 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 outline-none transition-all duration-200 font-mono text-sm"
                      />
                    </div>
                  );
                })}
              </div>
              
              <div className="space-y-3">
                <label className="block text-slate-300 text-sm font-medium">Meal duration</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={preferences.meal_duration} 
                    onChange={(e) => setPreferences({ ...preferences, meal_duration: parseInt(e.target.value) })}
                    className="w-full bg-white/10 backdrop-blur-sm text-white text-lg p-4 rounded-2xl border border-white/20 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 outline-none transition-all duration-200"
                    min="15"
                    max="120"
                    step="5"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Focus Sessions - Redesigned */}
          <div className="group">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <Zap size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-light text-white">Focus</h2>
                  <p className="text-slate-400 text-sm">Optimize your deep work sessions</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    <label className="block text-slate-300 text-sm font-medium">Session length</label>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={preferences.session_length} 
                      onChange={(e) => setPreferences({ ...preferences, session_length: parseInt(e.target.value) })}
                      className="w-full bg-white/10 backdrop-blur-sm text-white text-lg p-4 rounded-2xl border border-white/20 focus:border-green-400 focus:ring-4 focus:ring-green-400/20 outline-none transition-all duration-200"
                      min="15"
                      max="120"
                      step="5"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">min</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Coffee size={16} className="text-slate-400" />
                    <label className="block text-slate-300 text-sm font-medium">Break time</label>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={preferences.buffer_length} 
                      onChange={(e) => setPreferences({ ...preferences, buffer_length: parseInt(e.target.value) })}
                      className="w-full bg-white/10 backdrop-blur-sm text-white text-lg p-4 rounded-2xl border border-white/20 focus:border-green-400 focus:ring-4 focus:ring-green-400/20 outline-none transition-all duration-200"
                      min="5"
                      max="30"
                      step="5"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button - Redesigned */}
        <div className="mt-12 text-center">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium py-4 px-8 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-purple-500/25 hover:scale-105 active:scale-95"
          >
            {isSaving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Saving your rhythm...</span>
              </>
            ) : (
              <>
                <Brain size={20} />
                <span>Save Preferences</span>
              </>
            )}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          </button>
        </div>
      </main>
    </div>
  );
}
