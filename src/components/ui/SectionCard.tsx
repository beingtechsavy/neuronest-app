import React from 'react';
import { cn } from '@/lib/cn';

/**
 * A Card with a consistent header row. Use for any titled content block so the
 * heading scale and divider placement do not drift per page.
 */
export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  icon,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  icon?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'bg-[#2B2D31] border border-[#383A40] rounded-2xl shadow-xl shadow-black/20 overflow-hidden',
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-6 sm:px-8 sm:py-6 border-b border-[#383A40]">
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-[#1E1F22] text-[#2DD4BF]">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-[#F2F3F5] tracking-tight">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-[#949BA4] leading-relaxed">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
      <div className={cn('p-6 sm:p-8', contentClassName)}>{children}</div>
    </section>
  );
}
