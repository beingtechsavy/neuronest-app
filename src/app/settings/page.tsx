'use client';

import { useState, useEffect } from 'react';
// import Sidebar from '@/components/SideBar'; // No longer needed here
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

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
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

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
  }, []);

  const handleSave = async () => {
    if (!user || !preferences) return;
    setIsSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id, ...preferences });

    if (error) {
      setMessage('Error saving preferences.');
      console.error(error);
    } else {
      setMessage('Preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    // The outer div and Sidebar component have been removed
    <main className="p-4 sm:p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-slate-100">
        My Preferences
      </h1>

      <div className="space-y-8">
        {/* Sleep Schedule */}
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Sleep Schedule</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sleep_start" className="block text-sm font-medium text-slate-400 mb-1">I usually sleep at</label>
              <input type="time" id="sleep_start" value={preferences.sleep_start} onChange={(e) => setPreferences({ ...preferences, sleep_start: e.target.value })} className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" />
            </div>
            <div>
              <label htmlFor="sleep_end" className="block text-sm font-medium text-slate-400 mb-1">And wake up at</label>
              <input type="time" id="sleep_end" value={preferences.sleep_end} onChange={(e) => setPreferences({ ...preferences, sleep_end: e.target.value })} className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Meal Times */}
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Meal Times</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {preferences.meal_start_times.map((time, index) => (
              <div key={index}>
                <label htmlFor={`meal_time_${index}`} className="block text-sm font-medium text-slate-400 mb-1">{`Meal ${index + 1}`}</label>
                <input type="time" id={`meal_time_${index}`} value={time} onChange={(e) => handleMealTimeChange(index, e.target.value)} className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" />
              </div>
            ))}
          </div>
          <div>
            <label htmlFor="meal_duration" className="block text-sm font-medium text-slate-400 mb-1">Meal Duration (minutes)</label>
            <input type="number" id="meal_duration" value={preferences.meal_duration} onChange={(e) => setPreferences({ ...preferences, meal_duration: parseInt(e.target.value) })} className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" />
          </div>
        </div>

        {/* Study Sessions */}
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Study Sessions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="session_length" className="block text-sm font-medium text-slate-400 mb-1">Ideal session length (minutes)</label>
              <input type="number" id="session_length" value={preferences.session_length} onChange={(e) => setPreferences({ ...preferences, session_length: parseInt(e.target.value) })} className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" />
            </div>
            <div>
              <label htmlFor="buffer_length" className="block text-sm font-medium text-slate-400 mb-1">Break between sessions (minutes)</label>
              <input type="number" id="buffer_length" value={preferences.buffer_length} onChange={(e) => setPreferences({ ...preferences, buffer_length: parseInt(e.target.value) })} className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end items-center gap-4">
          {message && <span className="text-sm text-green-400">{message}</span>}
          <button onClick={handleSave} disabled={isSaving} className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50">
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </main>
  );
}
