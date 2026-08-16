'use client';

import React from 'react';
import { Sparkles, ArrowRight, ZoomIn } from 'lucide-react';
import type { RescueAction } from '@/types/rescue';

interface ActionDisplayProps {
  action: RescueAction;
  adaptationDepth: number;
  maxAdaptationDepth: number;
  onStart: () => void;
  onMakeSmaller: () => void;
  onDifferentStep: () => void;
  generating: boolean;
}

export default function ActionDisplay({
  action,
  adaptationDepth,
  maxAdaptationDepth,
  onStart,
  onMakeSmaller,
  onDifferentStep,
  generating,
}: ActionDisplayProps) {
  const isNearLimit = adaptationDepth >= maxAdaptationDepth - 1;

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="animate-pulse text-center">
          <Sparkles size={40} className="text-purple-400 mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Finding the right first step…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-xs font-medium mb-6">
          <Sparkles size={12} />
          Your first step
        </div>

        <div className="bg-slate-800 border-2 border-purple-500/30 rounded-2xl p-6 sm:p-8 mb-6">
          <p className="text-2xl sm:text-3xl font-bold text-white leading-relaxed font-heading break-words">
            {action.text}
          </p>
          <p className="text-slate-400 text-sm mt-4">
            ~{action.estimatedMinutes} minute{action.estimatedMinutes !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Buttons stack full-width on mobile with 12px gaps */}
        <div className="flex flex-col gap-3 w-full">
          {/* Primary action */}
          <button
            onClick={onStart}
            className="w-full min-h-[48px] py-4 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <ArrowRight size={22} />
            Start
          </button>

          {/* Secondary adaptation options */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={onMakeSmaller}
              disabled={isNearLimit}
              className="flex-1 w-full min-h-[44px] py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:text-slate-600 border border-slate-700 disabled:border-slate-800 text-slate-300 disabled:text-slate-600 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <ZoomIn size={16} />
              Make it smaller
            </button>
            <button
              onClick={onDifferentStep}
              className="flex-1 w-full min-h-[44px] py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              Give me a different step
            </button>
          </div>
        </div>

        {isNearLimit && (
          <p className="text-slate-500 text-xs mt-4">
            If this still doesn&apos;t feel right, maybe take a short break and come back.
          </p>
        )}
      </div>
    </div>
  );
}