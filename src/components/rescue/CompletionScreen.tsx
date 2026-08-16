'use client';

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { RescueAction } from '@/types/rescue';

interface CompletionScreenProps {
  action: RescueAction;
  completedAction: boolean;
  onSave: () => void;
  onNextStep: () => void;
  onFinish: () => void;
}

export default function CompletionScreen({
  action,
  completedAction,
  onSave,
  onNextStep,
  onFinish,
}: CompletionScreenProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md mx-auto text-center">
        <motion.div
          initial={shouldReduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.25, ease: 'easeOut' }}
          className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Sparkles size={32} className="text-green-400" />
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
          {completedAction ? 'Starting counts.' : 'You created some movement.'}
        </h2>
        <p className="text-slate-400 text-base sm:text-lg mb-2">
          {completedAction
            ? 'You did it. Momentum is on your side now.'
            : 'You showed up. That is the hardest part.'}
        </p>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 my-6">
          <p className="text-sm text-slate-400 mb-1">Your step was:</p>
          <p className="text-white font-medium break-words">{action.text}</p>
        </div>

        <div className="space-y-3 w-full">
          {completedAction && (
            <button
              onClick={onNextStep}
              className="w-full min-h-[48px] py-4 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowRight size={22} />
              What&apos;s the next step?
            </button>
          )}

          <button
            onClick={onSave}
            className="w-full min-h-[44px] py-3 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium rounded-xl transition-all flex items-center justify-center"
          >
            Save this session
          </button>

          <button
            onClick={onFinish}
            className="w-full min-h-[44px] text-slate-500 hover:text-slate-400 text-sm py-2 transition-colors flex items-center justify-center"
          >
            I&apos;m done for now
          </button>
        </div>
      </div>
    </div>
  );
}