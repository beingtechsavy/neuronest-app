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
      <div className="w-full max-w-md mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white text-sm mb-6 transition-colors min-h-[44px] flex items-center gap-1"
          aria-label="Go back and change the task"
        >
          &larr; Change task
        </button>

        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2 tracking-tight">
          What&apos;s making it difficult?
        </h2>
        <p className="text-slate-400 text-center mb-8 text-sm">
          Pick the closest reason. There&apos;s no wrong answer.
        </p>

        {/* Task summary */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 mb-6 text-center">
          <p className="text-slate-300 text-sm italic break-words">
            &ldquo;{taskText.length > 80 ? taskText.slice(0, 80) + '…' : taskText}&rdquo;
          </p>
        </div>

        {/* Friction options */}
        <div className="space-y-2.5 w-full">
          {frictionTypes.map((friction) => (
            <button
              key={friction}
              onClick={() => onSelect(friction)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 min-h-[48px] bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500/50 rounded-xl text-white text-left transition-all active:scale-[0.99]"
            >
              <span className="text-purple-400 flex-shrink-0">
                {FRICTION_ICONS[friction]}
              </span>
              <span className="font-medium text-sm sm:text-base leading-snug">{FRICTION_LABELS[friction]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}