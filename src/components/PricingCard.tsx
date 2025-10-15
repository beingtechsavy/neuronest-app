'use client';

import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { useUser } from '@supabase/auth-helpers-react';
import RazorpayCheckout from './RazorpayCheckout';

interface Plan {
  name: string;
  price: number;
  annualPrice?: number;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  paddleProductId: string | null | undefined;
}

interface PricingCardProps {
  plan: Plan;
  billingInterval: 'monthly' | 'annual';
  loading: string | null;
  onSubscribe: (productId: string, planName: string) => void;
  user: any;
}

export default function PricingCard({ 
  plan, 
  billingInterval, 
  loading, 
  onSubscribe, 
  user 
}: PricingCardProps) {
  const getIcon = (planName: string) => {
    switch (planName) {
      case 'Master':
        return <Zap className="w-8 h-8 text-purple-400" />;
      case 'Warrior':
        return <Crown className="w-8 h-8 text-yellow-400" />;
      default:
        return <Sparkles className="w-8 h-8 text-blue-400" />;
    }
  };

  const getPrice = () => {
    if (plan.name === 'Free') return 0;
    return billingInterval === 'annual' ? plan.annualPrice : plan.price;
  };

  const getDisplayPrice = () => {
    const price = getPrice();
    if (plan.name === 'Free') return 'Free';
    if (billingInterval === 'annual') {
      return `$${price}/year`;
    }
    return `$${price}/month`;
  };

  const getSavings = () => {
    if (billingInterval === 'annual' && plan.annualPrice && plan.price) {
      const monthlyCost = plan.price * 12;
      const savings = monthlyCost - plan.annualPrice;
      return Math.round((savings / monthlyCost) * 100);
    }
    return 0;
  };

  const handleClick = () => {
    if (plan.name === 'Free') {
      if (!user) {
        window.location.href = '/signup';
      } else {
        window.location.href = '/dashboard';
      }
    }
    // For paid plans, the RazorpayCheckout component will handle the click
  };

  const renderButton = () => {
    const baseClasses = `w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
      loading === plan.name ? 'opacity-50 cursor-not-allowed' : ''
    }`;

    if (plan.name === 'Free') {
      return (
        <button
          onClick={handleClick}
          disabled={loading === plan.name}
          className={`${baseClasses} bg-slate-700 text-white hover:bg-slate-600`}
        >
          {loading === plan.name ? 'Processing...' : plan.cta}
        </button>
      );
    }

    // For paid plans, wrap with RazorpayCheckout
    return (
      <RazorpayCheckout
        planName={plan.name}
        amount={getPrice() || 0}
        currency="USD"
        onSuccess={(data) => {
          console.log('Payment successful:', data);
        }}
        onError={(error) => {
          console.error('Payment error:', error);
        }}
      >
        <button
          disabled={loading === plan.name}
          className={`${baseClasses} ${
            plan.popular
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
              : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          {loading === plan.name ? 'Processing...' : plan.cta}
        </button>
      </RazorpayCheckout>
    );
  };

  return (
    <div
      className={`relative bg-slate-800 rounded-2xl p-8 ${
        plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          {getIcon(plan.name)}
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
        <p className="text-slate-400 mb-4">{plan.description}</p>
        
        <div className="mb-4">
          <span className="text-4xl font-bold text-white">{getDisplayPrice()}</span>
          {billingInterval === 'annual' && getSavings() > 0 && (
            <div className="text-green-400 text-sm mt-1">
              Save {getSavings()}% annually
            </div>
          )}
        </div>
      </div>

      <ul className="space-y-4 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center text-slate-300">
            <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {renderButton()}
    </div>
  );
}