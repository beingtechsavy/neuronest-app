import React from 'react';
import { cn } from '@/lib/cn';

// No 'use client' here on purpose: this module is imported by server
// components too (not-found.tsx, start pages), and a directive would turn
// `buttonClass` into a client-reference proxy that throws
// "is not a function" the moment a server component calls it.

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold ' +
  'transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E1F22]';

// Hover states always change *value*, never scale or glow. Scaling on hover is
// a vestibular trigger and was previously applied to 13 buttons across the app.
const variants: Record<Variant, string> = {
  primary:
    'bg-[#0D9488] text-[#F2F3F5] hover:bg-[#14B8A6] active:bg-[#0F766E] shadow-lg shadow-teal-950/30',
  secondary:
    'bg-transparent text-[#DBDEE1] border border-[#3F4147] hover:border-[#14B8A6] hover:text-[#F2F3F5] active:bg-[#2B2D31]',
  ghost:
    'bg-transparent text-[#949BA4] hover:bg-[#2B2D31] hover:text-[#F2F3F5] active:bg-[#383A40]',
  danger:
    'bg-transparent text-[#ED4245] border border-[#ED4245]/40 hover:bg-[#ED4245]/10 hover:border-[#ED4245] active:bg-[#ED4245]/20',
};

// 48px is the comfortable-target size for a primary action; 44px is the WCAG
// 2.5.5 minimum, kept for secondary/dense contexts.
const sizes: Record<Size, string> = {
  md: 'min-h-[44px] px-4 py-2.5 text-sm sm:text-base',
  lg: 'min-h-[48px] px-6 py-3.5 text-base sm:text-lg',
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Same visual language as Button, for next/link navigation. */
export const buttonClass = ({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
} = {}) => cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className);
