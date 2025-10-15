'use client';

import { useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';

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
    paddleProductId: null,
  },
  {
    name: 'Master',
    price: 6.99,
    annualPrice: 69,
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
    paddleProductId: process.env.NEXT_PUBLIC_PADDLE_MASTER_PRODUCT_ID,
  },
  {
    name: 'Warrior',
    price: 9.99,
    annualPrice: 99,
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
    paddleProductId: process.env.NEXT_PUBLIC_PADDLE_WARRIOR_PRODUCT_ID,
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

    if (!productId) {
      alert('This plan is not available yet. Please try again later.');
      return;
    }

    setLoading(planName);

    try {
      // Paddle checkout will be implemented here
      // For now, show a message that Paddle is being set up
      alert('Paddle checkout is being set up. Please check back soon!');
      
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

function PricingCard({ plan, billingInterval, loading, onSubscribe, user }: any) {
  const price = billingInterval === 'monthly' ? plan.price : plan.annualPrice;
  const isPopular = plan.popular;
  const isLoading = loading === plan.name;

  return (
    <div
      className={`bg-slate-800 rounded-2xl p-8 relative ${
        isPopular ? 'ring-2 ring-purple-500 scale-105' : ''
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
            <Crown size={16} />
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          {plan.name === 'Master' && <Sparkles className="text-purple-400" size={24} />}
          {plan.name === 'Warrior' && <Zap className="text-yellow-400" size={24} />}
          {plan.name}
        </h3>
        <p className="text-slate-400 text-sm">{plan.description}</p>
      </div>

      <div className="text-center mb-8">
        {plan.price === 0 ? (
          <div className="text-4xl font-bold text-white">Free</div>
        ) : (
          <>
            <div className="text-4xl font-bold text-white">
              ${price}
            </div>
            <div className="text-slate-400">
              {billingInterval === 'monthly' ? '/month' : '/year'}
            </div>
            {billingInterval === 'annual' && (
              <div className="text-green-400 text-sm mt-1">
                Save ${(plan.price * 12 - plan.annualPrice).toFixed(0)}/year
              </div>
            )}
          </>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature: string) => (
          <li key={feature} className="flex items-start gap-3 text-slate-300">
            <Check size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {plan.paddleProductId ? (
        <button
          onClick={() => onSubscribe(plan.paddleProductId, plan.name)}
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 ${
            isPopular
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? 'Processing...' : plan.cta}
        </button>
      ) : (
        <button
          disabled
          className="w-full py-4 bg-slate-600 text-slate-400 rounded-xl font-semibold cursor-not-allowed"
        >
          {plan.cta}
        </button>
      )}
    </div>
  );
}