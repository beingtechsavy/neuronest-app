'use client';

import { useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';

interface RazorpayCheckoutProps {
  planName: string;
  planId: string;
  amount: number;
  currency?: string;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: any) => void;
  children: React.ReactNode;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayCheckout({
  planName,
  planId,
  amount,
  currency = 'INR',
  onSuccess,
  onError,
  children
}: RazorpayCheckoutProps) {
  const user = useUser();
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscription = async () => {
    if (!user) {
      window.location.href = '/login?redirect=/pricing';
      return;
    }

    setLoading(true);

    try {
      // Create subscription
      const subscriptionResponse = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: user.id,
          userEmail: user.email,
          userName: user.user_metadata?.full_name || user.email?.split('@')[0],
        }),
      });

      const subscriptionData = await subscriptionResponse.json();

      if (!subscriptionData.success) {
        throw new Error(subscriptionData.error || 'Failed to create subscription');
      }

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      // Configure Razorpay options for subscription
      const options = {
        key: subscriptionData.keyId,
        subscription_id: subscriptionData.subscriptionId,
        name: 'NeuroNest',
        description: `${planName} Plan Subscription`,
        image: '/favicon.ico',
        handler: async function (response: any) {
          try {
            // Handle successful subscription
            console.log('Subscription successful:', response);
            
            // Update subscription status in database
            const updateResponse = await fetch('/api/razorpay/update-subscription', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                subscriptionId: subscriptionData.subscriptionId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planName,
                userId: user.id,
              }),
            });

            const updateData = await updateResponse.json();

            if (updateData.success) {
              onSuccess?.(updateData);
              // Redirect to dashboard with success message
              window.location.href = '/dashboard?subscription=success';
            } else {
              throw new Error(updateData.error || 'Failed to update subscription');
            }
          } catch (error) {
            console.error('Subscription update error:', error);
            onError?.(error);
            alert('Subscription activation failed. Please contact support.');
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          email: user.email || '',
        },
        notes: {
          plan: planName,
          user_id: user.id,
        },
        theme: {
          color: '#8b5cf6', // Purple theme matching your app
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      // Open Razorpay checkout for subscription
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Subscription initiation error:', error);
      onError?.(error);
      alert('Failed to initiate subscription. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div 
      onClick={handleSubscription} 
      style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
      className="w-full"
    >
      {children}
    </div>
  );
}