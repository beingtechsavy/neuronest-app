'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Timer, Play, Pause, Check } from 'lucide-react';
import type { RescueAction } from '@/types/rescue';
import { Button, Card, CardInset } from '@/components/ui';

interface ActivationModeProps {
  action: RescueAction;
  canAdapt?: boolean;
  onDone: () => void;
  onStillStuck: () => void;
  onStop: () => void;
}

const TIMER_LENGTH = 120; // 2 minutes

export default function ActivationMode({
  action,
  canAdapt = true,
  onDone,
  onStillStuck,
  onStop,
}: ActivationModeProps) {
  const [showTimer, setShowTimer] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
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
        if (prev >= TIMER_LENGTH) {
          clearInterval(intervalRef.current!);
          setTimerRunning(false);
          return TIMER_LENGTH;
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
          if (prev >= TIMER_LENGTH) {
            clearInterval(intervalRef.current!);
            setTimerRunning(false);
            return TIMER_LENGTH;
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
    setShowTimer(false);
  }, []);

  const remaining = Math.max(0, TIMER_LENGTH - timerElapsed);
  const timerMinutes = Math.floor(remaining / 60);
  const timerSecs = remaining % 60;

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-[100dvh] flex-col items-center justify-between overflow-y-auto bg-[#1E1F22] px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6"
      aria-live="polite"
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-between py-4">
        <Card className="my-auto text-center">
          <p className="mb-4 inline-block rounded-lg border border-[#3F4147] bg-[#1E1F22] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#2DD4BF]">
            Your only step
          </p>
          <p className="mb-6 break-words text-2xl font-bold leading-relaxed tracking-tight text-[#F2F3F5] sm:text-3xl">
            {action.text}
          </p>

          {!showTimer ? (
            <Button variant="secondary" onClick={startTimer}>
              <Timer size={16} className="text-[#2DD4BF]" aria-hidden="true" />
              Add a 2-minute timer
            </Button>
          ) : (
            <CardInset>
              <p
                className="mb-3 text-5xl font-bold tracking-tight text-[#2DD4BF] tabular-nums"
                role="timer"
                aria-live="off"
              >
                {String(timerMinutes).padStart(2, '0')}:{String(timerSecs).padStart(2, '0')}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  onClick={toggleTimer}
                  aria-label={timerRunning ? 'Pause timer' : 'Resume timer'}
                >
                  {timerRunning ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                  {timerRunning ? 'Pause' : 'Resume'}
                </Button>
                <Button variant="ghost" onClick={resetTimer} aria-label="Remove timer">
                  Remove
                </Button>
              </div>
            </CardInset>
          )}
        </Card>

        {/* Actions sit in the bottom third for thumb reach on a phone. */}
        <div className="mt-6 w-full space-y-3">
          <Button size="lg" fullWidth onClick={onDone}>
            <Check size={20} aria-hidden="true" />
            Done
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={onStillStuck}
            disabled={!canAdapt}
          >
            {canAdapt ? 'Still stuck' : 'Adaptation limit reached'}
          </Button>
          <Button variant="ghost" fullWidth onClick={onStop}>
            Stop for now
          </Button>
        </div>
      </div>
    </div>
  );
}
