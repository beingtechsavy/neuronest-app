'use client';

import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * The single dialog shell.
 *
 * Six modals previously carried their own `styles.overlay` / `styles.modal`
 * objects with `backdropFilter: 'blur(4px)'`, radii of 8/12/16px, and body text
 * laid out at inconsistent paddings. One shell means the dialog a user meets in
 * the task list looks like the one in the calendar.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  // The accessible name comes from the rendered heading, not from a string
  // prop: several dialogs pass an icon alongside the title, and `aria-label`
  // only worked when the title happened to be a plain string. `useId` rather
  // than a constant, because nested dialogs (edit → confirm unschedule) are
  // both mounted and would otherwise share an id.
  const titleId = useId();

  // Escape closes, the page behind does not scroll while the dialog is up, and
  // focus returns to whatever opened the dialog. Without that last part a
  // keyboard user who closes a dialog is dumped at the top of the document and
  // has to tab back to where they were.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  } as const;


  return (
    <div
      className="fixed inset-0 z-[3000] flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full rounded-2xl border border-[#383A40] bg-[#2B2D31] p-6 shadow-xl shadow-black/40 sm:p-8',
          'my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto',
          sizes[size],
          className,
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-bold tracking-tight text-[#F2F3F5]">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-[#949BA4] leading-relaxed">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#949BA4] transition-colors hover:bg-[#383A40] hover:text-[#F2F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Right-aligned action row used at the foot of a Modal's form. */
export function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>;
}

/** Labelled checkbox with the product's single checkbox treatment. */
export function Checkbox({
  label,
  checked,
  onChange,
  id: providedId,
}: {
  label: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}) {
  const autoId = React.useId();
  const id = providedId ?? autoId;
  return (
    <label htmlFor={id} className="flex min-h-[44px] cursor-pointer items-center gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 cursor-pointer rounded border-[#3F4147] bg-[#1E1F22] accent-[#14B8A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2B2D31]"
      />
      <span className="text-sm text-[#DBDEE1]">{label}</span>
    </label>
  );
}
