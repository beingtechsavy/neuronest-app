import React from 'react';
import { cn } from '@/lib/cn';

/**
 * One page title treatment for the whole app.
 *
 * The legacy set had four competing ones: `text-4xl font-light` (settings),
 * `text-4xl font-bold` with an emoji wave (dashboard), `text-3xl font-bold`
 * with no tracking (tasks), and a `rounded-3xl` gradient hero (ai-breakdown).
 * `font-light` at display size inverts the weight of every other heading and
 * reads as decorative rather than instructive, so it is gone.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('mb-8', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#14B8A6]">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F2F3F5] tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#949BA4] leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}

/** Consistent shell for authenticated pages. */
export function PageShell({
  children,
  className,
  width = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  width?: 'narrow' | 'default' | 'wide';
}) {
  const widths = {
    narrow: 'max-w-2xl',
    default: 'max-w-4xl',
    wide: 'max-w-6xl',
  } as const;

  return (
    <main
      className={cn(
        'mx-auto w-full px-4 sm:px-6 py-8',
        widths[width],
        className,
      )}
    >
      {children}
    </main>
  );
}
