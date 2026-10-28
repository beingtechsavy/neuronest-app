import React from 'react';
import { cn } from '@/lib/cn';

const tones = {
  brand: 'bg-[#14B8A6]/15 text-[#2DD4BF]',
  neutral: 'bg-[#383A40] text-[#DBDEE1]',
  success: 'bg-[#23A55A]/15 text-[#23A55A]',
  warning: 'bg-[#E8A33D]/15 text-[#E8A33D]',
  danger: 'bg-[#ED4245]/15 text-[#ED4245]',
} as const;

/**
 * Small rounded-square icon holder.
 *
 * Replaces the oversized circular heroes (`w-20 h-20 rounded-full shadow-2xl`)
 * and gradient tiles (`bg-gradient-to-r from-[#E8A33D] to-[#ED4245]`) that gave
 * settings/error/empty screens a "wellness app" look. A flat tinted square at a
 * single size keeps the icon subordinate to the heading.
 */
export function IconBadge({
  children,
  tone = 'brand',
  size = 'md',
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-xl',
  } as const;

  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center justify-center', sizes[size], tones[tone], className)}
    >
      {children}
    </span>
  );
}
