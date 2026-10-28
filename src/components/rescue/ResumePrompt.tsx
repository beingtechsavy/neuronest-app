'use client';

import React, { useState } from 'react';
import { ArrowRight, Save, X } from 'lucide-react';
import type { RescueSessionData } from '@/types/rescue';
import { Button, CardInset, Checkbox, Modal } from '@/components/ui';

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
    <Modal
      isOpen
      onClose={onSkip}
      title="Keep your Rescue context?"
      description="You finished a Rescue session before creating your account. Choose what to do with it."
    >
      <CardInset className="mb-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2DD4BF]">Last action</p>
        <p className="font-medium text-[#F2F3F5]">
          {sessionData.adaptations[sessionData.adaptations.length - 1]?.text || sessionData.initialAction.text}
        </p>
      </CardInset>

      <Checkbox
        label="Save the task text with this Rescue history. Uncheck to save only the outcome and actions."
        checked={saveTaskText}
        onChange={setSaveTaskText}
      />

      <div className="mt-5 space-y-3">
        <Button size="lg" fullWidth onClick={onContinue}>
          <ArrowRight size={18} aria-hidden="true" />
          Start another step from this task
        </Button>
        <Button variant="secondary" fullWidth onClick={handleSave} disabled={saving}>
          <Save size={17} aria-hidden="true" />
          {saving ? 'Saving…' : 'Save Rescue history'}
        </Button>
        <Button variant="ghost" fullWidth onClick={onSkip}>
          <X size={16} aria-hidden="true" />
          Skip and clear this context
        </Button>
      </div>
    </Modal>
  );
}
