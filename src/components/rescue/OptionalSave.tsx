'use client';

import React from 'react';
import { Save, X } from 'lucide-react';
import type { RescueSessionData } from '@/types/rescue';

interface OptionalSaveProps {
  sessionData: RescueSessionData;
  onSave: () => void;
  onSkip: () => void;
  saving: boolean;
}

export default function OptionalSave({ sessionData, onSave, onSkip, saving }: OptionalSaveProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 py-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Save size={24} className="text-purple-400" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Save this session?</h2>
        <p className="text-slate-400 text-sm mb-6">
          Create a free account to keep your rescue history. You&apos;ll be able to
          look back at what worked and pick up where you left off.
        </p>

        <div className="bg-slate-800/50 rounded-lg p-3 mb-6 text-left text-sm">
          <p className="text-slate-400 text-xs">Task:</p>
          <p className="text-white font-medium break-words mb-2">{sessionData.taskText}</p>
          <p className="text-slate-400 text-xs">Status:</p>
          <p className="text-white font-medium capitalize">{sessionData.status}</p>
        </div>

        <div className="space-y-3 w-full">
          <button
            onClick={onSave}
            disabled={saving}
            className="w-full min-h-[48px] py-3.5 px-6 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center"
          >
            {saving ? 'Saving…' : 'Create a free account'}
          </button>
          <button
            onClick={onSkip}
            className="flex items-center justify-center gap-2 w-full min-h-[44px] py-3 px-6 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <X size={16} />
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}