import React from 'react';
import { cn } from '@/lib/cn';

const tones = {
  brand: 'text-[#2DD4BF]',
  success: 'text-[#23A55A]',
  warning: 'text-[#E8A33D]',
  danger: 'text-[#ED4245]',
  neutral: 'text-[#949BA4]',
} as const;

/**
 * A single metric tile.
 *
 * The analytics directory previously had ~20 hand-written copies of
 * `bg-[#2B2D31]/50 p-6 rounded-lg border border-[#3F4147]` — translucent fill,
 * inner-border token used on an outer card, and the wrong radius. This is the
 * only metric shape in the app now.
 */
export function StatCard({
  label,
  value,
  detail,
  icon,
  tone = 'brand',
  className,
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#383A40] bg-[#2B2D31] p-5 shadow-xl shadow-black/20',
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2.5">
        {icon && (
          <span className={cn('shrink-0', tones[tone])} aria-hidden="true">
            {icon}
          </span>
        )}
        <h3 className="text-sm font-medium text-[#DBDEE1]">{label}</h3>
      </div>
      <p className="text-2xl font-bold tracking-tight text-[#F2F3F5] tabular-nums">{value}</p>
      {detail && <p className="mt-0.5 text-sm text-[#949BA4]">{detail}</p>}
    </div>
  );
}
