import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import NeuroNestMark from '@/components/NeuroNestMark';
import { Card } from '@/components/ui';

/**
 * Frame for every public, non-app page (features, pricing, contact, legal).
 *
 * Each of these previously hand-rolled its own `min-h-screen bg-[#1E1F22] p-16`
 * plus its own container width, heading size, and back link — which is how the
 * legal pages ended up with an unbordered card and the features page with a
 * centred two-column grid that reflowed badly at 375px. One frame keeps the
 * public surface internally consistent and separate from the app shell.
 */
export function MarketingShell({
  children,
  width = 'default',
  back = { href: '/', label: 'Back to home' },
}: {
  children: React.ReactNode;
  width?: 'narrow' | 'default' | 'wide';
  back?: { href: string; label: string } | null;
}) {
  const widths = {
    narrow: 'max-w-2xl',
    default: 'max-w-4xl',
    wide: 'max-w-5xl',
  } as const;

  return (
    <div className="min-h-[100dvh] bg-[#1E1F22] text-[#F2F3F5]">
      <header className="border-b border-[#383A40]">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex min-h-[44px] items-center gap-2.5 rounded-lg text-sm font-bold tracking-tight transition-colors hover:text-[#2DD4BF]"
          >
            <NeuroNestMark size={28} />
            NeuroNest
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-1">
            <Link
              href="/features"
              className="flex min-h-[44px] items-center rounded-lg px-3 text-sm text-[#949BA4] transition-colors hover:bg-[#2B2D31] hover:text-[#F2F3F5]"
            >
              How it works
            </Link>
            <Link
              href="/pricing"
              className="flex min-h-[44px] items-center rounded-lg px-3 text-sm text-[#949BA4] transition-colors hover:bg-[#2B2D31] hover:text-[#F2F3F5]"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="flex min-h-[44px] items-center rounded-lg px-3 text-sm text-[#949BA4] transition-colors hover:bg-[#2B2D31] hover:text-[#F2F3F5]"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <main className={`mx-auto w-full px-4 py-10 sm:px-6 sm:py-14 ${widths[width]}`}>
        {back && (
          <Link
            href={back.href}
            className="mb-8 inline-flex min-h-[44px] items-center gap-2 text-sm text-[#949BA4] transition-colors hover:text-[#F2F3F5]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {back.label}
          </Link>
        )}
        {children}
      </main>

      <footer className="border-t border-[#383A40]">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-[#6E747B] sm:px-6">
          <p>NeuroNest — one small next action.</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/privacy" className="transition-colors hover:text-[#DBDEE1]">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-[#DBDEE1]">Terms</Link>
            <Link href="/refund" className="transition-colors hover:text-[#DBDEE1]">Refunds</Link>
            <Link href="/contact" className="transition-colors hover:text-[#DBDEE1]">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/**
 * Long-form legal document.
 *
 * Constrained to a 65-character measure with 1.65 line-height: the previous
 * `prose prose-invert` block ran the full 896px card width, giving ~110
 * characters per line at desktop. That is well past the point where readers
 * lose their place returning to the next line — the exact failure dyslexic and
 * ADHD readers report most often on policy pages.
 */
export function LegalArticle({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <Card as="article">
      <h1 className="text-2xl font-bold tracking-tight text-[#F2F3F5] sm:text-3xl">{title}</h1>
      {updated && <p className="mt-2 text-sm text-[#949BA4]">Last updated: {updated}</p>}
      <div className="mt-8 max-w-[68ch] text-[0.95rem] leading-[1.7] text-[#DBDEE1]">{children}</div>
    </Card>
  );
}
