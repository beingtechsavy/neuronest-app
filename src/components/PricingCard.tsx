'use client';

import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { useUser } from '@supabase/auth-helpers-react';

interface Plan {
  name: string;
  price: number;
  annualPrice?: number;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  razorpayPlanId: string | null | undefined;
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

  const handlePaidPlanClick = async () => {
    if (!user) {
      window.location.href = '/login?redirect=/pricing';
      return;
    }

    if (!plan.razorpayPlanId) {
      alert('Plan configuration error. Please contact support.');
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = async () => {
      try {
        // Create subscription
        const subscriptionResponse = await fetch('/api/razorpay/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.razorpayPlanId,
            userId: user.id,
            userEmail: user.email,
            userName: user.user_metadata?.full_name || user.email?.split('@')[0],
          }),
        });

        const subscriptionData = await subscriptionResponse.json();
        if (!subscriptionData.success) throw new Error(subscriptionData.error);

        // Configure Razorpay options for subscription
        const options = {
          key: subscriptionData.keyId,
          subscription_id: subscriptionData.subscriptionId,
          name: 'NeuroNest',
          description: `${plan.name} Plan Subscription`,
          handler: async function (response: any) {
            try {
              // Update subscription status
              const updateResponse = await fetch('/api/razorpay/update-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  subscriptionId: subscriptionData.subscriptionId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  planName: plan.name,
                  userId: user.id,
                }),
              });

              const updateData = await updateResponse.json();
              if (updateData.success) {
                window.location.href = '/dashboard?subscription=success';
              } else {
                alert('Subscription activation failed. Please contact support.');
              }
            } catch (error) {
              console.error('Subscription update error:', error);
              alert('Subscription activation failed. Please contact support.');
            }
          },
          prefill: {
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            email: user.email || '',
          },
          theme: { color: '#8b5cf6' },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } catch (error) {
        console.error('Subscription error:', error);
        alert('Failed to initiate subscription. Please try again.');
      }
    };
    document.body.appendChild(script);
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

    // For paid plans, handle click directly
    return (
      <button
        onClick={handlePaidPlanClick}
        disabled={loading === plan.name}
        className={`${baseClasses} ${
          plan.popular
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
            : 'bg-slate-700 text-white hover:bg-slate-600'
        }`}
      >
        {loading === plan.name ? 'Processing...' : plan.cta}
      </button>
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