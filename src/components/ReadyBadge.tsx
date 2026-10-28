'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ReadyBadgeProps {
  count: number;
  type?: 'breakdown' | 'ready';
  size?: 'sm' | 'md';
}

/**
 * A small count chip that marks a chapter as having planned steps.
 *
 * The old version mounted a framer-motion element that scaled in and then
 * pulsed forever (`repeat: Infinity`). A badge that never stops moving draws
 * attention away from the task text at every glance, and it kept two
 * animation loops alive per chapter for the whole session. Static dot now.
 */
export default function ReadyBadge({ count, type = 'breakdown', size = 'sm' }: ReadyBadgeProps) {
  if (count === 0) return null;

  const isReady = type === 'ready';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium',
        size === 'sm' ? 'text-xs' : 'text-sm',
        isReady
          ? 'border-[#E8A33D]/30 bg-[#E8A33D]/10 text-[#E8A33D]'
          : 'border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#5EEAD4]',
      )}
    >
      {isReady ? (
        <span className="h-1.5 w-1.5 rounded-full bg-[#E8A33D]" aria-hidden="true" />
      ) : (
        <Sparkles size={11} aria-hidden="true" />
      )}
      <span>
        {count} {isReady ? 'ready' : 'planned'}
      </span>
    </span>
  );
}
