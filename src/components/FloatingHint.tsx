'use client';

import { Lightbulb, X } from 'lucide-react';

interface FloatingHintProps {
  message: string;
  show: boolean;
  onDismiss: () => void;
  position?: 'top' | 'bottom';
}

/**
 * One-off onboarding nudge.
 *
 * Two things changed from the animated version: the framer-motion
 * `AnimatePresence` fade is gone (a plain conditional render — the content is
 * informational and does not need an exit animation to be understood), and the
 * 8-second auto-dismiss is gone. A hint that vanishes while someone is still
 * reading it is the same failure as a timeout in a form; it now waits for the
 * user to close it.
 */
export default function FloatingHint({
  message,
  show,
  onDismiss,
  position = 'bottom'
}: FloatingHintProps) {
  if (!show) return null;

  return (
    <div
      role="status"
      className={`fixed left-1/2 z-50 -translate-x-1/2 ${position === 'bottom' ? 'bottom-6' : 'top-6'}`}
    >
      <div className="mx-4 flex max-w-sm items-center gap-3 rounded-2xl border border-[#383A40] bg-[#2B2D31] px-4 py-3 text-[#DBDEE1] shadow-xl shadow-black/40">
        <Lightbulb size={16} className="shrink-0 text-[#FEE75C]" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss hint"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#949BA4] transition-colors hover:bg-[#383A40] hover:text-[#F2F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
