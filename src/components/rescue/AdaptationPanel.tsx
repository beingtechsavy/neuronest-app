'use client';

import React from 'react';
import type { RescueAction } from '@/types/rescue';

interface AdaptationPanelProps {
  reason: 'too-hard' | 'not-right';
  currentAction: RescueAction;
  newAction: RescueAction;
  adaptationDepth: number;
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
  onAccept,
  onMakeSmaller,
  onDifferentStep,
  onStop,
  isNearLimit,
  generating,
}: AdaptationPanelProps) {
  if (generating) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center px-6">
        <div className="animate-pulse text-center">
          <p className="text-slate-300 text-lg">Finding a better step…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between min-h-[100dvh] px-4 sm:px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto">
      <div className="w-full max-w-md mx-auto text-center flex-1 flex flex-col justify-between py-4">
        {/* Content area */}
        <div className="my-auto py-6">
          <p className="text-sm text-slate-400 mb-2">
            That&apos;s okay. Let&apos;s try something different.
          </p>
          {reason === 'too-hard' && (
            <p className="text-xs text-amber-400 mb-6">
              The previous step felt too difficult. This one is smaller.
            </p>
          )}
          {reason === 'not-right' && (
            <p className="text-xs text-amber-400 mb-6">
              The previous step didn&apos;t feel right. Let&apos;s try a new approach.
            </p>
          )}

          {/* Previous action (struck through) */}
          <p className="text-sm text-slate-600 line-through mb-6 break-words">
            {currentAction.text}
          </p>

          {/* New action */}
          <div className="bg-slate-800 border-2 border-purple-500/30 rounded-2xl p-6 sm:p-8 mb-6">
            <p className="text-xl sm:text-2xl font-bold text-white leading-relaxed font-heading break-words">
              {newAction.text}
            </p>
            <p className="text-slate-400 text-sm mt-3">
              ~{newAction.estimatedMinutes} minute{newAction.estimatedMinutes !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Buttons in bottom third */}
        <div className="space-y-3 w-full mt-4">
          <button
            onClick={onAccept}
            className="w-full min-h-[48px] py-4 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center"
          >
            OK, I can do this
          </button>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={onMakeSmaller}
              disabled={isNearLimit}
              className="flex-1 w-full min-h-[44px] py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:text-slate-600 border border-slate-700 disabled:border-slate-800 text-slate-300 disabled:text-slate-600 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              Make it smaller
            </button>
            <button
              onClick={onDifferentStep}
              className="flex-1 w-full min-h-[44px] py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              Try a different approach
            </button>
          </div>

          {isNearLimit && (
            <p className="text-slate-500 text-xs mt-2">
              If this still doesn&apos;t feel right, it&apos;s okay to take a break.
            </p>
          )}

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