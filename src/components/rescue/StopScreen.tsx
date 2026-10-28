'use client';

import React from 'react';
import { PauseCircle } from 'lucide-react';
import type { RescueAction } from '@/types/rescue';
import { Button, Card, CardInset, IconBadge } from '@/components/ui';

interface StopScreenProps {
  action: RescueAction;
  onSave: () => void;
  onReturn: () => void;
  onFinish: () => void;
}

export default function StopScreen({ action, onSave, onReturn, onFinish }: StopScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Card className="mx-auto w-full max-w-md text-center">
        <IconBadge tone="neutral" size="lg" className="mx-auto mb-5">
          <PauseCircle size={22} aria-hidden="true" />
        </IconBadge>

        <h2 className="mb-2 text-2xl font-bold tracking-tight text-[#F2F3F5] sm:text-3xl">
          Stopping is allowed.
        </h2>
        <p className="mb-6 text-base leading-relaxed text-[#949BA4]">
          You can return when you&apos;re ready. No guilt, no broken streak.
        </p>

        <CardInset className="my-6 text-left">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2DD4BF]">
            Your last step was
          </p>
          <p className="break-words font-medium text-[#F2F3F5]">
            {action.text}
          </p>
        </CardInset>

        <div className="w-full space-y-3">
          <Button size="lg" fullWidth onClick={onReturn}>
            Start a new rescue
          </Button>
          <Button variant="secondary" fullWidth onClick={onSave}>
            Save this session
          </Button>
          <Button variant="ghost" fullWidth onClick={onFinish}>
            I&apos;m done for now
          </Button>
        </div>
      </Card>
    </div>
  );
}