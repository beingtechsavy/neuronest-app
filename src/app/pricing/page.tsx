'use client';

import { useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import RazorpayCheckout from '@/components/RazorpayCheckout';
import PricingCard from '@/components/PricingCard';

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out NeuroNest',
    features: [
      '3 subjects',
      '3 AI breakdowns per day',
      'Basic focus timer',
      'Basic analytics',
    ],
    cta: 'Current Plan',
    popular: false,
    razorpayPlanId: null,
  },
  {
    name: 'Master',
    price: 599, // INR
    annualPrice: 5990, // INR (save ~17%)
    description: 'Perfect for regular students',
    features: [
      '15 subjects',
      '10 AI breakdowns per day',
      '20 AI flashcards per day',
      'AI study buddy',
      'Full analytics',
      'Priority support',
    ],
    cta: 'Upgrade to Master',
    popular: true,
    razorpayPlanId: 'plan_RWeRVyGgnaoYsF', // LIVE Master plan ID
  },
  {
    name: 'Warrior',
    price: 899, // INR
    annualPrice: 8990, // INR (save ~17%)
    description: 'For power users and heavy studiers',
    features: [
      'Unlimited subjects',
      '25 AI breakdowns per day',
      '50 AI flashcards per day',
      'Advanced AI features',
      'Predictive analytics',
      'API access',
    ],
    cta: 'Upgrade to Warrior',
    popular: false,
    razorpayPlanId: 'plan_RWeRWemFi6XeES', // LIVE Warrior plan ID
  },
];

export default function PricingPage() {
  const user = useUser();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (productId: string, planName: string) => {
    if (!user) {
      window.location.href = '/login?redirect=/pricing';
      return;
    }

    // For free plan, just redirect to dashboard
    if (planName === 'Free') {
      window.location.href = '/dashboard';
      return;
    }

    setLoading(planName);

    try {
      // Get plan details
      const plan = plans.find(p => p.name === planName);
      if (!plan) {
        throw new Error('Plan not found');
      }

      const amount = billingInterval === 'annual' ? plan.annualPrice : plan.price;
      
      // Razorpay checkout will be handled by the RazorpayCheckout component
      // This is just a fallback
      console.log('Initiating payment for:', planName, amount);
      
      // TODO: Implement Paddle checkout
      // const response = await fetch('/api/paddle/create-checkout', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     productId,
      //     userId: user.id,
      //     userEmail: user.email,
      //   }),
      // });
      
    } catch (error) {
      console.error('Subscription error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Start free, upgrade when you're ready
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-slate-800 p-2 rounded-lg">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-md transition ${
                billingInterval === 'monthly'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('annual')}
              className={`px-6 py-2 rounded-md transition ${
                billingInterval === 'annual'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-300'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              billingInterval={billingInterval}
              loading={loading}
              onSubscribe={(productId: string, planName: string) => handleSubscribe(productId, planName)}
              user={user}
            />
          ))}
        </div>

        {/* Footer with legal links */}
        <div className="mt-16 pt-8 border-t border-slate-700">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <a href="/terms" className="hover:text-white transition">
              Terms of Service
            </a>
            <a href="/privacy" className="hover:text-white transition">
              Privacy Policy
            </a>
            <a href="/refund" className="hover:text-white transition">
              Refund Policy
            </a>
            <a href="/contact" className="hover:text-white transition">
              Contact Us
            </a>
          </div>
          <div className="text-center mt-4 text-xs text-slate-500">
            © 2025 NeuroNest. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

