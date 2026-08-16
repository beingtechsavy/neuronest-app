'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { trackFocusSessionTime } from '@/utils/focusSessionTracker';

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
    <main className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Timer size={24} className="text-purple-400" />
        <h1 className="text-2xl font-bold text-white">Focus Timer</h1>
      </div>

      {/* Duration Selection */}
      <div className="flex gap-3 justify-center mb-8">
        {DURATIONS.map(d => (
          <button
            key={d.value}
            onClick={() => selectDuration(d.value)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              duration === d.value
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center mb-8">
        {/* Progress Ring */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={timeLeft === 0 ? '#22c55e' : '#a855f7'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${progress * 283} 283`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-mono font-bold text-white">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            aria-label="Reset timer"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={toggleTimer}
            className={`p-5 rounded-full text-white transition-all transform hover:scale-105 ${
              isRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-purple-600 hover:bg-purple-500'
            }`}
            aria-label={isRunning ? 'Pause timer' : 'Start timer'}
          >
            {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
        <p className="text-slate-400 text-sm">
          Completed Today:{' '}
          <span className="font-bold text-white text-base">{sessionsCompleted} session{sessionsCompleted !== 1 ? 's' : ''}</span>
        </p>
      </div>
    </main>
  );
}