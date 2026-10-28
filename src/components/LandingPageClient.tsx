'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { ArrowRight, Sparkles, ShieldCheck, Timer, PlayCircle } from 'lucide-react';
import NeuroNestMark from '@/components/NeuroNestMark';
import { buttonClass, Card } from '@/components/ui';

/**
 * Landing page.
 *
 * The previous version was a single centred column of centred text with no
 * hierarchy between the promise, the proof, and the action — a reader scanning
 * for "what does this do" hit six equal-weight blocks. This keeps one primary
 * action above the fold and pushes everything explanatory below it, left-aligned
 * at a measured line length (the reading rhythm dyslexic users rely on).
 */
export default function LandingPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.replace('/rescue');
      else setLoading(false);
    };
    void checkAuthStatus();
  }, [router]);

  if (loading) {
    return (
      <div
        className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#1E1F22] text-[#F2F3F5]"
        aria-live="polite"
      >
        <NeuroNestMark size={64} className="mb-4" />
        <span className="text-sm text-[#949BA4]">Loading NeuroNest…</span>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#1E1F22] text-[#F2F3F5]">
      <div className="mx-auto w-full max-w-5xl px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))] sm:px-6">

        {/* ---- Hero ---- */}
        <header className="py-10 sm:py-16">
          <div className="mb-8 flex items-center gap-3">
            <NeuroNestMark size={44} />
            <span className="text-base font-bold tracking-tight">NeuroNest</span>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <h1 className="max-w-xl text-[clamp(1.9rem,5.5vw,3rem)] font-bold leading-[1.12] tracking-tight">
                Can&apos;t start the task?
                <span className="mt-2 block text-[#2DD4BF]">
                  Get one small next action and begin.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-[#DBDEE1] sm:text-lg">
                Describe what you&apos;re trying to start and what&apos;s making it hard.
                NeuroNest gives you a realistic first step — sized for the energy you
                actually have right now.
              </p>

              <div className="mt-8 flex max-w-sm flex-col gap-3">
                <Link href="/rescue" className={buttonClass({ size: 'lg', fullWidth: true })}>
                  <Sparkles size={20} aria-hidden="true" />
                  Give me my first step
                </Link>
                <Link
                  href="/features"
                  className={buttonClass({ variant: 'secondary', size: 'md', fullWidth: true })}
                >
                  See how it works
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>

              <p className="mt-4 flex items-center gap-2 text-sm text-[#949BA4]">
                <ShieldCheck size={16} className="shrink-0" aria-hidden="true" />
                No account required to start.
              </p>
            </div>

            {/* What a first step looks like — concrete beats abstract for
                initiation, so one real example does more than a feature list. */}
            <Card className="p-5 sm:p-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#949BA4]">
                Example
              </p>
              <p className="mb-4 text-sm text-[#DBDEE1]">
                &ldquo;Write my history essay&rdquo; — I keep putting it off
              </p>
              <div className="rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 p-4">
                <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2DD4BF]">
                  <Timer size={14} aria-hidden="true" />
                  Next action · 7 minutes
                </p>
                <p className="text-sm leading-relaxed text-[#F2F3F5]">
                  Open the document and write the one sentence you already know
                  belongs in it. That&apos;s the whole task.
                </p>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-[#949BA4]">
                You choose the difficulty. Every step is something you can finish.
              </p>
            </Card>
          </div>
        </header>

        {/* ---- How it works ---- */}
        <section aria-labelledby="how-heading" className="border-t border-[#383A40] py-10 sm:py-14">
          <h2 id="how-heading" className="mb-8 text-lg font-bold tracking-tight sm:text-xl">
            How a rescue runs
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Say what you are stuck on',
                body: 'One line is enough. No project setup, no scheduling.',
              },
              {
                step: '2',
                title: 'Name the friction',
                body: 'Too big, too vague, too boring, or no energy today.',
              },
              {
                step: '3',
                title: 'Do the first action',
                body: 'A timer starts only when you decide to start it.',
              },
            ].map((item) => (
              <Card as="li" key={item.step} className="p-5">
                <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-sm font-bold text-[#2DD4BF]">
                  {item.step}
                </span>
                <h3 className="mb-1.5 text-sm font-semibold text-[#F2F3F5]">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[#949BA4]">{item.body}</p>
              </Card>
            ))}
          </ol>
        </section>

        {/* ---- Account ---- */}
        <section aria-labelledby="account-heading" className="border-t border-[#383A40] py-10 sm:py-14">
          <div className="max-w-md">
            <h2 id="account-heading" className="mb-2 text-lg font-bold tracking-tight sm:text-xl">
              Want it to remember you?
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-[#949BA4]">
              An account keeps your projects, your schedule, and what actually worked
              for you. Nothing is required to try a rescue.
            </p>

            <GoogleSignInButton mode="signup" />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#383A40]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#1E1F22] px-3 text-xs text-[#949BA4]">
                  or use email
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className={buttonClass({ variant: 'secondary', fullWidth: true })}
              >
                <PlayCircle size={18} aria-hidden="true" />
                Create an account
              </Link>
              <Link
                href="/login"
                className={buttonClass({ variant: 'ghost', fullWidth: true })}
              >
                Log in
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-[#383A40] pt-6 text-sm text-[#6E747B]">
          <p>For the moment when you know what to do but cannot begin.</p>
          <nav aria-label="Footer" className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/features" className="transition-colors hover:text-[#DBDEE1]">How it works</Link>
            <Link href="/pricing" className="transition-colors hover:text-[#DBDEE1]">Pricing</Link>
            <Link href="/pricing#support" className="transition-colors hover:text-[#DBDEE1]">Support us</Link>
            <Link href="/privacy" className="transition-colors hover:text-[#DBDEE1]">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-[#DBDEE1]">Terms</Link>
            <Link href="/contact" className="transition-colors hover:text-[#DBDEE1]">Contact</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
