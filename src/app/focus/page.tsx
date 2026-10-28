'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { saveFocusSessionTime as trackFocusSessionTime } from '@/utils/focusSessionTracker';
import { Button, Card, PageHeader, PageShell } from '@/components/ui';

const DURATIONS = [
  { label: '25 min', value: 25 },
  { label: '50 min', value: 50 },
  { label: '90 min', value: 90 },
];

export default function FocusPage() {
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const endTimeRef = useRef<number | null>(null);

  // Background tab resilience: recalculate remaining time from Date.now() delta
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }

      interval = setInterval(() => {
        if (!endTimeRef.current) return;
        const remainingMs = endTimeRef.current - Date.now();
        const secondsRemaining = Math.max(0, Math.ceil(remainingMs / 1000));

        setTimeLeft(secondsRemaining);

        if (secondsRemaining <= 0) {
          setIsRunning(false);
          setSessionsCompleted(s => s + 1);
          trackFocusSessionTime(duration);
          endTimeRef.current = null;
          clearInterval(interval);
        }
      }, 500);
    } else {
      endTimeRef.current = null;
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, duration]);

  // Handle visibilitychange to update timer instantly when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && endTimeRef.current) {
        const remainingMs = endTimeRef.current - Date.now();
        const secondsRemaining = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeLeft(secondsRemaining);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning]);

  const reset = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
    setTimeLeft(duration * 60);
  }, [duration]);

  const selectDuration = (mins: number) => {
    setDuration(mins);
    setTimeLeft(mins * 60);
    setIsRunning(false);
    endTimeRef.current = null;
  };

  const toggleTimer = () => {
    if (!isRunning) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      setIsRunning(true);
    } else {
      setIsRunning(false);
      endTimeRef.current = null;
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / (duration * 60);

  return (
    <PageShell width="narrow">
      <PageHeader
        title="Focus timer"
        description="One block of time on one thing. Pause whenever you need to."
      />

      {/* Duration selection — same control shape as every other button. */}
      <div
        className="mx-auto mb-6 flex max-w-sm gap-2 rounded-xl border border-[#383A40] bg-[#2B2D31] p-1.5"
        role="group"
        aria-label="Session length"
      >
        {DURATIONS.map(d => (
          <button
            type="button"
            key={d.value}
            onClick={() => selectDuration(d.value)}
            aria-pressed={duration === d.value}
            className={`min-h-[44px] flex-1 rounded-lg px-3 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] ${
              duration === d.value
                ? 'bg-[#0D9488] text-[#F2F3F5]'
                : 'text-[#949BA4] hover:bg-[#383A40] hover:text-[#F2F3F5]'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Timer display */}
      <Card className="mb-6 text-center">
        <div className="relative mx-auto mb-8 h-44 w-44 sm:h-48 sm:w-48">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#383A40" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke="#14B8A6"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${progress * 283} 283`}
              className="transition-[stroke-dasharray] duration-500 motion-reduce:transition-none"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight text-[#F2F3F5]"
              role="timer"
              aria-live="off"
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={reset} aria-label="Reset timer" className="px-4">
            <RotateCcw size={18} aria-hidden="true" />
            Reset
          </Button>
          <Button size="lg" onClick={toggleTimer} className="min-w-[140px]">
            {isRunning ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            {isRunning ? 'Pause' : 'Start'}
          </Button>
        </div>
      </Card>

      <Card className="flex items-center justify-center gap-2 py-4">
        <span className="text-sm text-[#949BA4]">Completed today:</span>
        <span className="text-base font-bold text-[#F2F3F5]">
          {sessionsCompleted} session{sessionsCompleted !== 1 ? 's' : ''}
        </span>
      </Card>
    </PageShell>
  );
}