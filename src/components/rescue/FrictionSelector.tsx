'use client';

import React from 'react';
import type { FrictionType } from '@/types/rescue';
import { FRICTION_LABELS } from '@/types/rescue';
import {
  HelpCircle,
  ArrowUpDown,
  Heart,
  Meh,
  BatteryLow,
  Layers,
  Frown,
} from 'lucide-react';
import { Card, CardInset } from '@/components/ui';

interface FrictionSelectorProps {
  taskText: string;
  onSelect: (friction: FrictionType) => void;
  onBack: () => void;
}

const FRICTION_ICONS: Record<FrictionType, React.ReactNode> = {
  'dont-know-where-to-start': <HelpCircle size={22} />,
  'feels-too-big': <ArrowUpDown size={22} />,
  'anxious-about-doing-it-badly': <Heart size={22} />,
  'feels-boring': <Meh size={22} />,
  'low-energy': <BatteryLow size={22} />,
  'too-many-competing-tasks': <Layers size={22} />,
  'not-sure': <Frown size={22} />,
};

export default function FrictionSelector({ taskText, onSelect, onBack }: FrictionSelectorProps) {
  const frictionTypes = Object.keys(FRICTION_LABELS) as FrictionType[];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Card className="mx-auto w-full max-w-md">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 mb-4 flex min-h-[44px] items-center gap-1.5 rounded-lg px-1 text-sm text-[#949BA4] transition-colors hover:text-[#F2F3F5]"
          aria-label="Go back and change the task">
          &larr; Change task
        </button>

        <h2 className="mb-2 text-center text-2xl font-bold tracking-tight text-[#F2F3F5] sm:text-3xl">
          What&apos;s making it difficult?
        </h2>
        <p className="mb-6 text-center text-sm leading-relaxed text-[#949BA4]">
          Pick the closest reason. The AI will shape the next step around it.
        </p>

        {/* Task summary */}
        <CardInset className="mb-6 text-center">
          <p className="break-words text-sm italic text-[#DBDEE1]">
            &ldquo;{taskText.length > 80 ? taskText.slice(0, 80) + '…' : taskText}&rdquo;
          </p>
        </CardInset>

        {/* Friction options */}
        <div className="space-y-2.5 w-full">
          {frictionTypes.map((friction) => (
            <button
              type="button"
              key={friction}
              onClick={() => onSelect(friction)}
              className="group flex min-h-[52px] w-full items-center gap-3.5 rounded-xl border border-[#3F4147] bg-[#1E1F22] px-4 py-3.5 text-left text-[#F2F3F5] transition-colors hover:border-[#14B8A6] hover:bg-[#2B2D31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
            >
              <span className="shrink-0 text-[#2DD4BF] transition-colors group-hover:text-[#5EEAD4]">
                {FRICTION_ICONS[friction]}
              </span>
              <span className="text-sm font-medium leading-snug sm:text-base">{FRICTION_LABELS[friction]}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
