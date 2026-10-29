'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, Clock, Coffee, ExternalLink, Heart, Loader2, Sparkles, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { trackEvent } from '@/lib/rescue/rescueAnalytics';
import { MarketingShell } from '@/components/MarketingShell';
import SupportersWall from '@/components/SupportersWall';
import { Button, Card, CardInset, buttonClass, Input, fieldClass } from '@/components/ui';

const BUY_ME_A_COFFEE_URL =
  process.env.NEXT_PUBLIC_BUYMEACOFFEE_URL || 'https://buymeacoffee.com/neuronest';

declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void }; }
}

type BillingCycle = 'monthly' | 'yearly';
type DonationChips = 300 | 500 | 1000;

async function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return true;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load checkout'));
    document.body.appendChild(script);
  });
  return Boolean(window.Razorpay);
}

const freeFeatures = [
  'Unlimited Rescue sessions',
  'Local session history',
  'Basic adaptation and timer',
  '3 AI breakdowns per day',
  'Inbox task capture',
];

const proFeatures = [
  'Cloud Rescue history',
  'Cross-device resume',
  '20 AI breakdowns per day with fair-use controls',
  'Personalized preferences and reminders',
  'Real weekly insights',
  'Priority support',
];

const donationChips: { value: DonationChips; label: string }[] = [
  { value: 300, label: '$3' },
  { value: 500, label: '$5' },
  { value: 1000, label: '$10' },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistState, setWaitlistState] = useState<'idle' | 'loading' | 'joined'>('idle');
  const [waitlistMessage, setWaitlistMessage] = useState<string | null>(null);
  const [donating, setDonating] = useState(false);
  const [donationChip, setDonationChip] = useState<DonationChips>(500);
  const [customAmount, setCustomAmount] = useState('');
  const [donationName, setDonationName] = useState('');
  const [donationAnon, setDonationAnon] = useState(false);
  const [donationMessage, setDonationMessage] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSignedIn(Boolean(session)));
  }, []);

  // ── Pro waitlist ────────────────────────────────────────────────────────────
  async function joinWaitlist() {
    setWaitlistState('loading');
    setWaitlistMessage(null);
    // Guests must provide an email so we can notify them at launch; signed-in
    // users let the server attribute via their session.
    if (!signedIn && !waitlistEmail.trim()) {
      setWaitlistState('idle');
      setWaitlistMessage('Add your email so we can tell you when Pro launches.');
      return;
    }
    try {
      const response = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signedIn ? undefined : waitlistEmail || undefined, note: '' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to join the waitlist');
      trackEvent({ event: 'waitlist_joined' });
      setWaitlistState('joined');
      setWaitlistMessage(
        data.duplicate
          ? "You're already on the list — we'll email you when Pro opens."
          : "You're on the list. Founding members get first access when Pro launches.",
      );
    } catch (error) {
      setWaitlistState('idle');
      setWaitlistMessage(error instanceof Error ? error.message : 'Unable to join the waitlist');
    }
  }

  // ── Donation checkout ───────────────────────────────────────────────────────
  async function startDonation() {
    setDonating(true);
    setMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Guests are welcome to donate, but checkout needs a tracked order —
        // sign-up first, then return straight back to the donate box.
        window.location.href = `/signup?redirect=/pricing#support`;
        return;
      }
      const chips = donationChips.map((chip) => chip.value);
      const custom = Number.parseInt(customAmount, 10);
      const selected = customAmount.trim() !== '' && Number.isFinite(custom) ? custom * 100 : donationChip;
      if (!chips.includes(selected as DonationChips) && (selected < 100 || selected > 100000)) {
        throw new Error('Donations must be between $1 and $1,000');
      }
      trackEvent({ event: 'donation_started', amountCents: selected });
      const response = await fetch('/api/payments/donate/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          amount: selected,
          displayName: donationName || undefined,
          isAnonymous: donationAnon,
          message: donationMessage || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Donations are not available yet');
      await loadRazorpay();
      if (!window.Razorpay) throw new Error('Checkout is not available');
      const options: Record<string, unknown> = {
        key: data.keyId,
        amount: data.order?.amount,
        currency: data.order?.currency,
        name: 'NeuroNest',
        description: 'Support NeuroNest — one-time donation',
        order_id: data.order?.id,
        prefill: { email: session.user.email },
        theme: { color: '#0D9488' },
        handler: () => {
          trackEvent({ event: 'donation_completed', amountCents: selected });
          setMessage('Thank you! Your support will appear on the Supporters Wall after verification. 💛');
        },
        modal: { ondismiss: () => setMessage('Checkout closed. No payment was made.') },
      };
      new window.Razorpay(options).open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start checkout');
    } finally {
      setDonating(false);
    }
  }

  return (
    <MarketingShell width="wide" back={{ href: '/rescue', label: 'Back to Rescue' }}>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Simple, honest pricing</h1>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-[#949BA4]">
          Start with the free Rescue experience. Pay only when continuity becomes
          worth it — and if you like the product, chip in any amount below.
        </p>
      </header>

      {/* Segmented control rather than two loose buttons: one selected state,
          one focus target, and aria-pressed so a screen reader hears the choice. */}
      <div
        role="group"
        aria-label="Billing cycle"
        className="mb-6 inline-flex rounded-xl border border-[#3F4147] bg-[#1E1F22] p-1"
      >
        {([
          { value: 'monthly' as const, label: 'Monthly · $19 (planned)' },
          { value: 'yearly' as const, label: 'Yearly · $190 (planned)' },
        ]).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setBillingCycle(option.value)}
            aria-pressed={billingCycle === option.value}
            className={`min-h-11 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] ${
              billingCycle === option.value
                ? 'bg-[#0D9488] text-[#F2F3F5]'
                : 'text-[#949BA4] hover:text-[#F2F3F5]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col p-6 sm:p-7">
          <h2 className="text-lg font-bold tracking-tight">Free</h2>
          <p className="mt-1 text-sm text-[#949BA4]">Start without an account.</p>
          <p className="mt-5 text-3xl font-bold tracking-tight tabular-nums">
            $0
            <span className="text-base font-normal text-[#949BA4]"> / month</span>
          </p>
          <ul className="mb-6 mt-6 flex-1 space-y-3">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex gap-2.5 text-sm text-[#DBDEE1]">
                <Check size={16} className="mt-0.5 shrink-0 text-[#23A55A]" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
          <Link href="/rescue" className={buttonClass({ variant: 'secondary', fullWidth: true })}>
            Use free Rescue
          </Link>
        </Card>

        <Card className="relative flex flex-col border-[#14B8A6]/40 p-6 sm:p-7">
          <p className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#0D9488]/20 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#2DD4BF]">
            <Clock size={12} aria-hidden="true" />
            Pro · launching soon
          </p>
          <h2 className="text-lg font-bold tracking-tight">Pro</h2>
          <p className="mt-1 text-sm text-[#949BA4]">Founding members get first access when international checkout opens.</p>
          <p className="mt-5 text-3xl font-bold tracking-tight tabular-nums">
            {billingCycle === 'monthly' ? '$19' : '$190'}
            <span className="text-base font-normal text-[#949BA4]">
              {' '}/ {billingCycle === 'monthly' ? 'month' : 'year'}
            </span>
          </p>
          <ul className="mb-6 mt-6 flex-1 space-y-3">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex gap-2.5 text-sm text-[#DBDEE1]">
                <Check size={16} className="mt-0.5 shrink-0 text-[#2DD4BF]" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
          {waitlistState === 'joined' ? (
            <div className="rounded-xl border border-[#23A55A]/40 bg-[#23A55A]/10 p-3 text-center text-sm text-[#DBDEE1]">
              You&rsquo;re on the list 💛
            </div>
          ) : (
            <>
              {!signedIn && (
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-label="Email for Pro launch notification"
                  value={waitlistEmail}
                  onChange={(event) => setWaitlistEmail(event.target.value)}
                  className="mb-3"
                />
              )}
              <Button
                size="lg"
                fullWidth
                onClick={joinWaitlist}
                disabled={waitlistState === 'loading'}
              >
                {waitlistState === 'loading' && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
                {waitlistState === 'loading' ? 'Joining…' : 'Join the Pro waitlist'}
              </Button>
            </>
          )}
        </Card>
      </div>

      {waitlistMessage && (
        <p role="status" className="mt-4 text-center text-sm text-[#DBDEE1]">{waitlistMessage}</p>
      )}

      {/* ── Support box ───────────────────────────────────────────────────── */}
      <section id="support" aria-label="Support NeuroNest" className="mt-10">
        <Card className="p-6 sm:p-7">
          <header>
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <Heart size={18} className="text-[#2DD4BF]" aria-hidden="true" />
              Support NeuroNest
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#949BA4]">
              If a first action got you unstuck, you can pay that forward — any
              amount, no subscription. Your support keeps the Rescue line free for
              people who can&rsquo;t pay right now, and 100% of it goes toward hosting
              and AI costs.
            </p>
          </header>

          {/* ── Option 1: 1-Click Fast Support (Frictionless for ADHD brains) ── */}
          <div className="mt-6 rounded-xl border border-[#F59E0B]/30 bg-gradient-to-br from-[#F59E0B]/10 via-[#1E1F22] to-[#1E1F22] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#F59E0B]/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#FBBF24]">
                  <Zap size={12} aria-hidden="true" />
                  1-Click Fast Support · Zero Friction
                </div>
                <h3 className="mt-2 text-base font-bold text-[#F2F3F5] sm:text-lg">
                  Buy Us a Coffee
                </h3>
                <p className="mt-1 max-w-md text-xs sm:text-sm leading-relaxed text-[#949BA4]">
                  No typing 16-digit cards, CVVs, or signing in. 1-tap support via your phone or browser wallet.
                </p>

                {/* Badges for 1-tap payment rails */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-[#DBDEE1]">
                  <span className="rounded-md border border-[#3F4147] bg-[#2B2D31] px-2 py-0.5">
                     Apple Pay
                  </span>
                  <span className="rounded-md border border-[#3F4147] bg-[#2B2D31] px-2 py-0.5">
                    G Pay
                  </span>
                  <span className="rounded-md border border-[#3F4147] bg-[#2B2D31] px-2 py-0.5">
                    PayPal
                  </span>
                  <span className="rounded-md border border-[#3F4147] bg-[#2B2D31] px-2 py-0.5">
                    Cards worldwide
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <a
                  href={BUY_ME_A_COFFEE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent({ event: 'donation_external_clicked' })}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-3 font-semibold text-[#18191C] transition-colors hover:bg-[#FBBF24] active:bg-[#D97706] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E1F22] shadow-lg shadow-amber-950/20"
                >
                  <Coffee size={18} aria-hidden="true" />
                  <span>Support on Buy Me a Coffee</span>
                  <ExternalLink size={15} aria-hidden="true" className="opacity-75" />
                </a>
              </div>
            </div>

            <p className="mt-3 text-xs text-[#949BA4]">
              Leave a note or your name on Buy Me a Coffee — we feature BMC supporters on our Supporters Wall below too! 💛
            </p>
          </div>

          {/* ── Divider ── */}
          <div className="relative my-7 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#3F4147]" />
            </div>
            <div className="relative bg-[#2B2D31] px-3 text-xs uppercase tracking-wider text-[#949BA4]">
              Or donate directly in-app
            </div>
          </div>

          {/* ── Option 2: Direct In-App Donation (Razorpay) ── */}
          <div>
            <h3 className="text-sm font-semibold text-[#F2F3F5]">
              Direct In-App Donation (Credit / Debit Cards Worldwide)
            </h3>
            <p className="mt-1 text-xs text-[#949BA4]">
              Pick an amount and enter your display name to appear immediately on the Supporters Wall.
            </p>

            <div
              role="group"
              aria-label="Donation amount"
              className="mt-4 flex flex-wrap gap-2"
            >
              {donationChips.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => { setDonationChip(chip.value); setCustomAmount(''); }}
                  aria-pressed={!customAmount && donationChip === chip.value}
                  className={`min-h-11 rounded-xl border px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] ${
                    !customAmount && donationChip === chip.value
                      ? 'border-[#2DD4BF] bg-[#0D9488]/20 text-[#F2F3F5]'
                      : 'border-[#3F4147] bg-[#1E1F22] text-[#949BA4] hover:text-[#F2F3F5]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={1000}
                step={1}
                placeholder="Custom ($)"
                aria-label="Custom donation amount in dollars"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                className="w-36"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                type="text"
                maxLength={40}
                placeholder="Name on the wall (optional)"
                aria-label="Display name for the Supporters Wall"
                value={donationAnon ? '' : donationName}
                onChange={(event) => setDonationName(event.target.value)}
                disabled={donationAnon}
              />
              <Input
                type="text"
                maxLength={200}
                placeholder="One-line message (optional)"
                aria-label="Optional message for the Supporters Wall"
                value={donationMessage}
                onChange={(event) => setDonationMessage(event.target.value)}
              />
            </div>

            <label className="mt-3 inline-flex cursor-pointer items-start gap-2.5 text-sm text-[#949BA4]">
              <input
                type="checkbox"
                checked={donationAnon}
                onChange={(event) => setDonationAnon(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#3F4147] bg-[#1E1F22] accent-[#0D9488]"
              />
              <span>Show me as Anonymous on the Supporters Wall</span>
            </label>

            <div className="mt-5">
              <Button size="lg" onClick={startDonation} disabled={donating}>
                {donating && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
                {donating ? 'Opening checkout…' : 'Donate in-app with Card'}
              </Button>
              <p className="mt-3 text-xs text-[#6E747B]">
                One-time payment in USD via Razorpay (cards work worldwide). Donations
                are voluntary support, not a subscription — no account changes, no
                tax-deductible receipt.
              </p>
            </div>

            {message && (
              <p role="status" className="mt-4 text-sm text-[#DBDEE1]">{message}</p>
            )}
          </div>
        </Card>
      </section>

      <SupportersWall />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: 'Waitlist',
            body: 'Pro is in final setup for international payments. Founding members join first and keep founding pricing.',
          },
          {
            title: 'Donations',
            body: 'One-time support, not a subscription. Nothing renews, and no features are gated behind it.',
          },
          {
            title: 'Refunds',
            body: (
              <>
                Donations and future subscriptions share a 30-day money-back guarantee.
              </>
            ),
          },
        ].map((item) => (
          <CardInset key={item.title} className="p-4 sm:p-5">
            <h3 className="mb-1.5 text-sm font-semibold text-[#F2F3F5]">{item.title}</h3>
            <p className="text-sm leading-relaxed text-[#949BA4]">
              {item.body}
            </p>
          </CardInset>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/refund" className="text-sm text-[#5EEAD4] underline underline-offset-4">
          Read the refund policy
        </Link>
      </div>
    </MarketingShell>
  );
}
