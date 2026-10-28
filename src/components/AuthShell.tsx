import React from 'react';
import NeuroNestMark from '@/components/NeuroNestMark';
import { Card } from '@/components/ui';

/**
 * Shared frame for every unauthenticated screen (login, signup, password reset).
 *
 * Four auth pages previously each duplicated their own ambient-glow pair, their
 * own card, and their own input/button classes — which is how login ended up
 * with 8px inputs while the app used 12px. The glow is a single static radial
 * now: `blur-3xl` on two 384px divs was expensive and, on low-end phones,
 * visibly shimmered while scrolling.
 */
export function AuthShell({
  children,
  width = 'sm',
}: {
  children: React.ReactNode;
  width?: 'sm' | 'md';
}) {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#1E1F22] px-4 py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-[radial-gradient(ellipse_at_center,rgba(13,148,136,0.12),transparent_70%)]"
      />

      <div
        className={`relative z-10 w-full space-y-6 text-center ${
          width === 'md' ? 'max-w-md' : 'max-w-sm'
        }`}
      >
        <NeuroNestMark size={88} className="mx-auto" />
        <Card className="text-left">{children}</Card>
      </div>
    </div>
  );
}

/** Heading + supporting line used at the top of an AuthShell card. */
export function AuthHeading({
  title,
  description,
}: {
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold tracking-tight text-[#F2F3F5] sm:text-2xl">{title}</h1>
      {description && (
        <p className="mt-1.5 text-sm leading-relaxed text-[#949BA4]">{description}</p>
      )}
    </div>
  );
}

/** The "or continue with email" hairline divider. */
export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[#383A40]" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#2B2D31] px-3 text-xs text-[#949BA4]">{label}</span>
      </div>
    </div>
  );
}

/** Inline form-level error, announced to assistive tech. */
export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-[#ED4245]/40 bg-[#ED4245]/10 px-3.5 py-2.5"
    >
      <p className="text-sm text-[#FF6B6B]">{children}</p>
    </div>
  );
}
