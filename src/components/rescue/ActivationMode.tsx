'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Timer, Play, Pause, Check, HelpCircle, X } from 'lucide-react';
import type { RescueAction } from '@/types/rescue';

interface ActivationModeProps {
  action: RescueAction;
  onDone: () => void;
  onStillStuck: () => void;
  onStop: () => void;
}

export default function ActivationMode({
  action,
  onDone,
  onStillStuck,
  onStop,
}: ActivationModeProps) {
  const [showTimer, setShowTimer] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(120); // 2 min default
  const [timerElapsed, setTimerElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    setShowTimer(true);
    setTimerRunning(true);
    intervalRef.current = setInterval(() => {
      setTimerElapsed((prev) => {
        if (prev >= 120) {
          clearInterval(intervalRef.current!);
          setTimerRunning(false);
          return 120;
        }
        return prev + 1;
      });
    }, 1000);
  }, []);

  const toggleTimer = useCallback(() => {
    if (timerRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimerRunning(false);
    } else {
      setTimerRunning(true);
      intervalRef.current = setInterval(() => {
        setTimerElapsed((prev) => {
          if (prev >= 120) {
            clearInterval(intervalRef.current!);
            setTimerRunning(false);
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    }
  }, [timerRunning]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerRunning(false);
    setTimerElapsed(0);
  }, []);

  const remaining = Math.max(0, timerSeconds - timerElapsed);
  const timerMinutes = Math.floor(remaining / 60);
  const timerSecs = remaining % 60;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between min-h-[100dvh] px-4 sm:px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto">
      <div className="w-full max-w-md mx-auto text-center flex-1 flex flex-col justify-between py-4">
        {/* Content area */}
        <div className="my-auto py-6">
          {/* Action display */}
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">
            Your only step
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-white leading-relaxed mb-8 font-heading break-words">
            {action.text}
          </p>

          {/* Timer toggle */}
          {!showTimer ? (
            <button
              onClick={startTimer}
              className="flex items-center gap-2 mx-auto px-4 py-2.5 min-h-[44px] bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 hover:text-white text-sm transition-all"
            >
              <Timer size={16} />
              Add a 2-minute timer
            </button>
          ) : (
            <div className="mb-6">
              <div className="text-5xl font-mono font-bold text-white mb-4">
                {String(timerMinutes).padStart(2, '0')}:{String(timerSecs).padStart(2, '0')}
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={toggleTimer}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                  aria-label={timerRunning ? 'Pause timer' : 'Resume timer'}
                >
                  {timerRunning ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button
                  onClick={resetTimer}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                  aria-label="Reset timer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons (positioned in bottom third for easy thumb reach) */}
        <div className="space-y-3 w-full mt-4">
          <button
            onClick={onDone}
            className="w-full min-h-[48px] py-4 px-6 bg-green-600 hover:bg-green-500 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Check size={22} />
            Done
          </button>
          <button
            onClick={onStillStuck}
            className="w-full min-h-[44px] py-3 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <HelpCircle size={18} />
            Still stuck
          </button>
          <button
            onClick={onStop}
            className="w-full min-h-[44px] text-slate-500 hover:text-slate-400 text-sm py-2 transition-colors flex items-center justify-center"
          >
            Stop for now
          </button>
        </div>
      </div>
    </div>
  );
}