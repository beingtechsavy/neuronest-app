'use client';

import React from 'react';
import { PauseCircle } from 'lucide-react';
import type { RescueAction } from '@/types/rescue';

interface StopScreenProps {
  action: RescueAction;
  onSave: () => void;
  onReturn: () => void;
  onFinish: () => void;
}

export default function StopScreen({ action, onSave, onReturn, onFinish }: StopScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <PauseCircle size={32} className="text-slate-400" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
          Stopping is allowed.
        </h2>
        <p className="text-slate-400 text-base sm:text-lg mb-2">
          You can return when you&apos;re ready. No guilt, no broken streak.
        </p>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 my-6">
          <p className="text-sm text-slate-400 mb-1">Your last step was:</p>
          <p className="text-white font-medium break-words">{action.text}</p>
        </div>

        <div className="space-y-3 w-full">
          <button
            onClick={onReturn}
            className="w-full min-h-[48px] py-4 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center"
          >
            Start a new rescue
          </button>

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