'use client';

import React, { useState } from 'react';
import { ArrowRight, Save, X } from 'lucide-react';
import type { RescueSessionData } from '@/types/rescue';

interface ResumePromptProps {
  sessionData: RescueSessionData;
  onContinue: () => void;
  onSave: (saveTaskText: boolean) => Promise<void>;
  onSkip: () => void;
}

export default function ResumePrompt({ sessionData, onContinue, onSave, onSkip }: ResumePromptProps) {
  const [saving, setSaving] = useState(false);
  const [saveTaskText, setSaveTaskText] = useState(true);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(saveTaskText);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="resume-rescue-title">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8">
        <h2 id="resume-rescue-title" className="text-2xl font-bold text-white mb-2">Keep your Rescue context?</h2>
        <p className="text-slate-400 text-sm mb-6">You finished a Rescue session before creating your account. Choose what you want to do with it.</p>
        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <p className="text-xs text-slate-500 mb-1">Last action</p>
          <p className="text-white font-medium">{sessionData.adaptations[sessionData.adaptations.length - 1]?.text || sessionData.initialAction.text}</p>
        </div>
        <label className="flex items-start gap-3 text-sm text-slate-300 mb-5 cursor-pointer">
          <input type="checkbox" checked={saveTaskText} onChange={(event) => setSaveTaskText(event.target.checked)} className="mt-1" />
          <span>Save the task text with this Rescue history. Uncheck to save only the outcome and actions.</span>
        </label>
        <div className="space-y-3">
          <button type="button" onClick={onContinue} className="w-full min-h-[48px] rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center justify-center gap-2">
            <ArrowRight size={18} /> Start another step from this task
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="w-full min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium flex items-center justify-center gap-2 disabled:opacity-60">
            <Save size={17} /> {saving ? 'Saving…' : 'Save Rescue history'}
          </button>
          <button type="button" onClick={onSkip} className="w-full min-h-[44px] text-slate-500 hover:text-slate-300 text-sm flex items-center justify-center gap-2">
            <X size={16} /> Skip and clear this context
          </button>
        </div>
      </div>
    </div>
  );
}
