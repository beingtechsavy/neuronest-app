'use client';

import React from 'react';
import { Save } from 'lucide-react';
import type { RescueSessionData } from '@/types/rescue';
import { setPendingRescueSession } from '@/lib/rescue/anonymousSession';
import { Button, CardInset, IconBadge, Modal, ModalActions } from '@/components/ui';

interface OptionalSaveProps {
  sessionData: RescueSessionData;
  onSave: () => void;
  onSkip: () => void;
  saving: boolean;
}

export default function OptionalSave({ sessionData, onSave, onSkip, saving }: OptionalSaveProps) {
  return (
    <Modal
      isOpen
      onClose={onSkip}
      title="Save this session?"
      description="A free account keeps your rescue history, so you can look back at what worked."
    >
      <IconBadge tone="brand" size="lg" className="mb-5">
        <Save size={22} aria-hidden="true" />
      </IconBadge>

      <CardInset className="mb-6 text-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2DD4BF]">Task</p>
        <p className="mb-3 break-words font-medium text-[#F2F3F5]">{sessionData.taskText}</p>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#949BA4]">Status</p>
        <p className="font-medium capitalize text-[#F2F3F5]">{sessionData.status}</p>
      </CardInset>

      <ModalActions>
        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
        <Button
          onClick={() => {
            setPendingRescueSession(sessionData);
            onSave();
          }}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Create a free account'}
        </Button>
      </ModalActions>
    </Modal>
  );
}
