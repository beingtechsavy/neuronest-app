import React from 'react';
import { cn } from '@/lib/cn';

/**
 * The single card surface used across the product.
 *
 * Previously every page invented its own container: glass panels with
 * backdrop-blur, 3-stop no-op gradients, rounded-3xl, or bare divs. This is the
 * shape the Rescue flow settled on — opaque, one border, one radius, and a soft
 * black shadow rather than a coloured glow (coloured glows read as "loading" or
 * "alert" to anxious users and fight the content).
 */
export function Card({
  as: Tag = 'div',
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article' | 'aside' | 'li';
}) {
  return (
    <Tag
      className={cn(
        'bg-[#2B2D31] border border-[#383A40] rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/20',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** A quieter inset panel for content nested inside a Card. */
export function CardInset({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-[#1E1F22] border border-[#3F4147] rounded-xl p-4 sm:p-5', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
