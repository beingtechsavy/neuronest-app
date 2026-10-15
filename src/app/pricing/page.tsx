'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { trackEvent } from '@/lib/rescue/rescueAnalytics';

declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void }; }
}

type BillingCycle = 'monthly' | 'yearly';

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

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setMessage(null);
    trackEvent({ event: 'checkout_started', plan: 'pro', billingCycle });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = `/signup?redirect=/pricing`;
        return;
      }
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ billingCycle }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Checkout is not available yet');
      if (data.hostedPaymentLink) {
        window.location.href = data.hostedPaymentLink;
        return;
      }
      await loadRazorpay();
      if (!window.Razorpay) throw new Error('Checkout is not available');
      const options: Record<string, unknown> = {
        key: data.keyId,
        amount: data.order?.amount,
        currency: data.order?.currency,
        name: 'NeuroNest',
        description: `Pro ${billingCycle} plan`,
        order_id: data.mode === 'order' ? data.order?.id : undefined,
        subscription_id: data.mode === 'subscription' ? data.subscription?.id : undefined,
        prefill: { email: session.user.email },
        theme: { color: '#7c3aed' },
        handler: () => {
          trackEvent({ event: 'payment_completed', plan: 'pro', billingCycle });
          setMessage('Payment received. Your Pro access will activate after payment verification.');
        },
        modal: { ondismiss: () => setMessage('Checkout closed. No payment was made.') },
      };
      new window.Razorpay(options).open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/rescue" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8"><ArrowLeft size={16} /> Back to Rescue</Link>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, honest pricing</h1>
          <p className="text-slate-400 text-lg">Start with the free Rescue experience. Pay for continuity when you know it helps.</p>
          <div className="inline-flex mt-6 rounded-xl border border-slate-700 bg-slate-900 p-1">
            <button type="button" onClick={() => setBillingCycle('monthly')} className={`px-4 py-2 rounded-lg text-sm ${billingCycle === 'monthly' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>Monthly · ₹299</button>
            <button type="button" onClick={() => setBillingCycle('yearly')} className={`px-4 py-2 rounded-lg text-sm ${billingCycle === 'yearly' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>Yearly · ₹2,499</button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-2">Free</h2>
            <p className="text-3xl font-bold mb-1">₹0<span className="text-base font-normal text-slate-400"> / month</span></p>
            <p className="text-slate-400 text-sm mb-6">Start without an account.</p>
            <ul className="space-y-3 mb-8">{['Unlimited Rescue sessions', 'Local session history', 'Basic adaptation and timer', '3 AI breakdowns per day', 'Inbox task capture'].map((feature) => <li key={feature} className="flex gap-2 text-slate-300 text-sm"><Check size={16} className="text-green-400 shrink-0" />{feature}</li>)}</ul>
            <Link href="/rescue" className="block w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-center font-semibold">Use Free Rescue</Link>
          </div>
          <div className="bg-gradient-to-b from-purple-900/30 to-slate-900 border border-purple-500/30 rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><Sparkles size={12} /> PRO FOUNDING PLAN</div>
            <h2 className="text-xl font-semibold mb-2">Pro</h2>
            <p className="text-3xl font-bold mb-1">{billingCycle === 'monthly' ? '₹299' : '₹2,499'}<span className="text-base font-normal text-slate-400"> / {billingCycle === 'monthly' ? 'month' : 'year'}</span></p>
            <p className="text-slate-400 text-sm mb-6">For users who want continuity.</p>
            <ul className="space-y-3 mb-8">{['Cloud Rescue history', 'Cross-device resume', '20 AI breakdowns per day with fair-use controls', 'Personalized preferences and reminders', 'Real weekly insights', 'Priority support'].map((feature) => <li key={feature} className="flex gap-2 text-slate-300 text-sm"><Check size={16} className="text-purple-400 shrink-0" />{feature}</li>)}</ul>
            <button type="button" onClick={startCheckout} disabled={loading} className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 rounded-lg font-semibold flex items-center justify-center gap-2">{loading && <Loader2 size={18} className="animate-spin" />}{loading ? 'Opening checkout…' : 'Start Pro checkout'}</button>
          </div>
        </div>
        {message && <p role="status" className="text-center text-slate-300 mt-6">{message}</p>}
        <div className="mt-10 grid md:grid-cols-3 gap-4 text-sm text-slate-400"><p><strong className="text-slate-200">After purchase:</strong> Razorpay confirms payment, then the webhook activates Pro.</p><p><strong className="text-slate-200">Cancellation:</strong> Cancel future billing through Razorpay or contact support.</p><p><strong className="text-slate-200">Refunds:</strong> See the <Link href="/refund" className="text-purple-300 underline">refund policy</Link> or contact support@neuronest.work.</p></div>
      </div>
    </div>
  );
}
