'use client';

import React from 'react';
import type { RescueAction } from '@/types/rescue';
import { Loader2 } from 'lucide-react';
import { Button, Card, CardInset } from '@/components/ui';

interface AdaptationPanelProps {
  reason: 'too-hard' | 'not-right';
  currentAction: RescueAction;
  newAction: RescueAction;
  adaptationDepth: number;
  maxAdaptationDepth: number;
  onAccept: () => void;
  onMakeSmaller: () => void;
  onDifferentStep: () => void;
  onStop: () => void;
  isNearLimit: boolean;
  generating: boolean;
}

export default function AdaptationPanel({
  reason,
  currentAction,
  newAction,
  adaptationDepth,
  maxAdaptationDepth,
  onAccept,
  onMakeSmaller,
  onDifferentStep,
  onStop,
  isNearLimit,
  generating,
}: AdaptationPanelProps) {
  const cannotAdapt = adaptationDepth >= maxAdaptationDepth;

  if (generating) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1E1F22] px-6"
        role="status"
        aria-live="polite"
      >
        <Loader2 size={28} className="animate-spin text-[#2DD4BF] motion-reduce:animate-none" aria-hidden="true" />
        <p className="mt-4 text-base font-medium text-[#DBDEE1]">Finding a better step…</p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-[100dvh] flex-col items-center justify-between overflow-y-auto bg-[#1E1F22] px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rescue-adaptation-title"
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-between py-4">
        <Card className="my-auto text-center">
          <h2 id="rescue-adaptation-title" className="mb-2 text-base font-medium text-[#DBDEE1]" aria-live="polite">
            That&apos;s okay. Let&apos;s try something different.
          </h2>
          <p className="mb-6 text-xs font-medium text-[#E8A33D]">
            {reason === 'too-hard'
              ? 'The previous step felt too difficult. This one is smaller.'
              : 'The previous step didn’t feel right. Here is a new approach.'}
          </p>

          <p className="mb-6 break-words text-sm text-[#949BA4] line-through">
            {currentAction.text}
          </p>

          <CardInset className="border-l-2 border-l-[#14B8A6] p-5 text-left sm:p-6">
            <p className="break-words text-xl font-bold leading-relaxed text-[#F2F3F5] sm:text-2xl">
              {newAction.text}
            </p>
            <p className="mt-3 text-xs font-semibold text-[#2DD4BF] tabular-nums">
              ~{newAction.estimatedMinutes} minute{newAction.estimatedMinutes !== 1 ? 's' : ''}
            </p>
            {newAction.why && (
              <p className="mt-3 text-sm font-normal leading-relaxed text-[#DBDEE1]">
                {newAction.why}
              </p>
            )}
          </CardInset>
        </Card>

        <div className="mt-6 w-full space-y-3">
          <Button size="lg" fullWidth onClick={onAccept}>
            OK, I can do this
          </Button>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              fullWidth
              onClick={onMakeSmaller}
              disabled={cannotAdapt}
              className="text-sm sm:text-base"
            >
              Make it smaller
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={onDifferentStep}
              disabled={cannotAdapt}
              className="text-sm sm:text-base"
            >
              Different approach
            </Button>
          </div>

          {isNearLimit && (
            <p className="mt-2 text-xs leading-relaxed text-[#949BA4]">
              {cannotAdapt
                ? 'You have reached the adaptation limit for this rescue. It is okay to take a break.'
                : 'You have one more adaptation available if this still does not feel right.'}
            </p>
          )}

          <Button variant="ghost" fullWidth onClick={onStop}>
            Stop for now
          </Button>
        </div>
      </div>
    </div>
  );
}
