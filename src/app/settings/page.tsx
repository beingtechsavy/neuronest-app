'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';
import { Loader2, Moon, Sun, Coffee, Utensils, Clock, Brain, Zap, Trash2 } from 'lucide-react';
import { useToastContext } from '@/components/ToastProvider';
import { useTimeouts } from '@/hooks/useTimeout';
import UsageDashboard from '@/components/UsageDashboard';
import { Button, Card, IconBadge, Input, PageHeader, PageShell, SectionCard } from '@/components/ui';

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
  const [deletingSessions, setDeletingSessions] = useState(false);

  const deleteRescueHistory = async () => {
    if (!user || !window.confirm('Delete your cloud Rescue history? This cannot be undone.')) return;
    setDeletingSessions(true);
    const session = (await supabase.auth.getSession()).data.session;
    const response = await fetch('/api/rescue/sessions', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token || ''}` },
    });
    setDeletingSessions(false);
    if (response.ok) success('Cloud Rescue history deleted.');
    else showError('Unable to delete Rescue history.');
  };

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
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#1E1F22]">
        <div className="flex items-center gap-3 text-[#949BA4]">
          <Loader2 size={20} className="animate-spin text-[#2DD4BF] motion-reduce:animate-none" aria-hidden="true" />
          <span className="text-sm">Loading your preferences...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#1E1F22]">
      <PageShell width="narrow">
        <PageHeader
          eyebrow="Settings"
          title="Your day structure"
          description="Set when you rest, eat, and focus. The calendar uses these to stop scheduling work over the parts of your day that need to stay protected."
        />

        <div className="space-y-6">
          <UsageDashboard />

          <SectionCard
            icon={<Trash2 size={18} />}
            title="Rescue history"
            description="Delete authenticated Rescue sessions from the cloud. Local anonymous history stays on this device until you clear it."
          >
            <Button variant="danger" onClick={deleteRescueHistory} disabled={deletingSessions}>
              <Trash2 size={16} />
              {deletingSessions ? 'Deleting…' : 'Delete cloud Rescue history'}
            </Button>
          </SectionCard>

          <SectionCard
            icon={<Moon size={18} />}
            title="Sleep"
            description="When you rest and recharge."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Bedtime"
                type="time"
                value={preferences.sleep_start}
                onChange={(e) => setPreferences({ ...preferences, sleep_start: e.target.value })}
              />
              <Input
                label="Wake up"
                type="time"
                value={preferences.sleep_end}
                onChange={(e) => setPreferences({ ...preferences, sleep_end: e.target.value })}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={<Utensils size={18} />}
            title="Meals"
            description="Mealtimes the scheduler should not book over."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {preferences.meal_start_times.map((time, index) => {
                const mealNames = ['Breakfast', 'Lunch', 'Dinner'];
                const mealIcons = [Coffee, Sun, Moon];
                const MealIcon = mealIcons[index];

                return (
                  <div key={index}>
                    <label
                      htmlFor={`meal-${index}`}
                      className="mb-2 flex items-center gap-2 text-sm font-medium text-[#DBDEE1]"
                    >
                      <MealIcon size={16} className="text-[#949BA4]" aria-hidden="true" />
                      {mealNames[index]}
                    </label>
                    <input
                      id={`meal-${index}`}
                      type="time"
                      value={time}
                      onChange={(e) => handleMealTimeChange(index, e.target.value)}
                      className="w-full rounded-xl border border-[#3F4147] bg-[#1E1F22] px-4 py-3.5 text-base text-[#F2F3F5] transition-colors duration-150 focus:border-[#14B8A6] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-4 sm:max-w-xs">
              <Input
                label="Meal duration"
                type="number"
                min="15"
                max="120"
                step="5"
                value={preferences.meal_duration}
                onChange={(e) => setPreferences({ ...preferences, meal_duration: parseInt(e.target.value) })}
                hint="Minutes reserved for each meal."
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={<Zap size={18} />}
            title="Focus"
            description="How long a focus session runs, and how long the break after it."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Session length"
                type="number"
                min="15"
                max="120"
                step="5"
                value={preferences.session_length}
                onChange={(e) => setPreferences({ ...preferences, session_length: parseInt(e.target.value) })}
                hint="Minutes."
              />
              <Input
                label="Break time"
                type="number"
                min="5"
                max="30"
                step="5"
                value={preferences.buffer_length}
                onChange={(e) => setPreferences({ ...preferences, buffer_length: parseInt(e.target.value) })}
                hint="Minutes."
              />
            </div>
          </SectionCard>

          <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <IconBadge tone="brand">
                <Brain size={18} />
              </IconBadge>
              <p className="text-sm text-[#949BA4]">
                {message || 'Changes apply the next time you schedule.'}
              </p>
            </div>
            <Button size="lg" onClick={handleSave} disabled={isSaving} className="sm:shrink-0">
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                'Save preferences'
              )}
            </Button>
          </Card>
        </div>
      </PageShell>
    </div>
  );
}
