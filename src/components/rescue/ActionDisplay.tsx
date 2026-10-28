'use client';

import React from 'react';
import { Sparkles, ArrowRight, ZoomIn, Shuffle, Loader2 } from 'lucide-react';
import type { RescueAction } from '@/types/rescue';
import { Button, Card, CardInset } from '@/components/ui';

interface ActionDisplayProps {
  action: RescueAction;
  isContinuation: boolean;
  adaptationDepth: number;
  maxAdaptationDepth: number;
  onStart: () => void;
  onMakeSmaller: () => void;
  onDifferentStep: () => void;
  generating: boolean;
}

export default function ActionDisplay({
  action,
  isContinuation,
  adaptationDepth,
  maxAdaptationDepth,
  onStart,
  onMakeSmaller,
  onDifferentStep,
  generating,
}: ActionDisplayProps) {
  const isNearLimit = adaptationDepth >= maxAdaptationDepth - 1;
  const cannotAdapt = adaptationDepth >= maxAdaptationDepth;

  if (generating) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4" aria-live="polite" role="status">
        <div className="text-center">
          {/* The old spinner was a Sparkles icon with an infinite rotation, plus
              an animate-pulse wrapper — two independent motions for one state. */}
          <Loader2 size={28} className="mx-auto mb-4 animate-spin text-[#2DD4BF] motion-reduce:animate-none" aria-hidden="true" />
          <p className="text-base font-medium text-[#DBDEE1]">Finding the right first step…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4" aria-live="polite">
      <Card className="mx-auto w-full max-w-md text-center">
        <p className="mb-6 inline-flex items-center gap-2 rounded-lg bg-[#14B8A6]/10 px-3 py-1 text-xs font-medium text-[#2DD4BF]">
          <Sparkles size={12} aria-hidden="true" />
          {isContinuation ? 'AI-guided next step' : 'AI-guided first step'}
        </p>

        {isContinuation && (
          <p className="mb-5 text-sm text-[#949BA4]">Building on the progress you just made.</p>
        )}

        {/* The action is the one thing on this screen that must be read at a
            glance, so it gets the only 2xl type and an accent-ruled panel. */}
        <CardInset className="mb-6 border-l-2 border-l-[#14B8A6] p-5 text-left sm:p-6">
          <p className="break-words text-xl font-bold leading-relaxed text-[#F2F3F5] sm:text-2xl">
            {action.text}
          </p>
          <p className="mt-3 text-xs font-semibold tracking-wide text-[#2DD4BF] tabular-nums">
            ~{action.estimatedMinutes} minute{action.estimatedMinutes !== 1 ? 's' : ''}
          </p>
          {action.why && (
            <p className="mt-3 text-sm font-normal leading-relaxed text-[#DBDEE1]">
              {action.why}
            </p>
          )}
        </CardInset>

        <div className="flex w-full flex-col gap-3">
          <Button size="lg" fullWidth onClick={onStart}>
            <ArrowRight size={20} aria-hidden="true" />
            Start
          </Button>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              fullWidth
              onClick={onMakeSmaller}
              disabled={cannotAdapt}
              className="text-sm sm:text-base"
            >
              <ZoomIn size={16} aria-hidden="true" />
              Make it smaller
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={onDifferentStep}
              disabled={cannotAdapt}
              className="text-sm sm:text-base"
            >
              <Shuffle size={16} aria-hidden="true" />
              A different step
            </Button>
          </div>
        </div>

        {isNearLimit && (
          <p className="mt-4 text-xs leading-relaxed text-[#949BA4]">
            {cannotAdapt
              ? 'You have reached the adaptation limit for this rescue. A short break or a fresh rescue may help.'
              : 'You have one more adaptation available if this still doesn’t feel right.'}
          </p>
        )}
      </Card>
    </div>
  );
}
