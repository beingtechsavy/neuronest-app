import { env } from './env';

// Paddle configuration and utilities
export const paddleConfig = {
  vendorId: env.NEXT_PUBLIC_PADDLE_VENDOR_ID || '',
  clientToken: env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '',
  environment: env.NODE_ENV === 'production' ? 'production' : 'sandbox',
};

// Product configurations for Paddle
export const paddleProducts = {
  master: {
    name: 'NeuroNest Master',
    price: 6.99,
    currency: 'USD',
    description: 'Unlimited AI breakdowns + premium features',
    features: [
      '15 subjects',
      '10 AI breakdowns per day',
      '20 AI flashcards per day',
      'AI study buddy',
      'Full analytics',
      'Priority support',
    ],
  },
  warrior: {
    name: 'NeuroNest Warrior',
    price: 9.99,
    currency: 'USD',
    description: 'Everything in Master + advanced analytics',
    features: [
      'Unlimited subjects',
      '25 AI breakdowns per day',
      '50 AI flashcards per day',
      'Advanced AI features',
      'Predictive analytics',
      'API access',
    ],
  },
};

// Initialize Paddle (to be called on client-side)
export function initializePaddle() {
  if (typeof window !== 'undefined' && (window as any).Paddle) {
    (window as any).Paddle.Setup({
      vendor: paddleConfig.vendorId,
      eventCallback: function(data: any) {
        console.log('Paddle event:', data);
        // Handle Paddle events here
        if (data.event === 'Checkout.Complete') {
          // Redirect to success page
          window.location.href = '/dashboard?success=true';
        }
      }
    });
  }
}

// Open Paddle checkout
export function openPaddleCheckout(productId: string, userEmail?: string) {
  if (typeof window !== 'undefined' && (window as any).Paddle) {
    (window as any).Paddle.Checkout.open({
      product: productId,
      email: userEmail,
      successCallback: function(data: any) {
        console.log('Paddle checkout success:', data);
        // Handle successful checkout
        window.location.href = '/dashboard?success=true';
      },
      closeCallback: function() {
        console.log('Paddle checkout closed');
        // Handle checkout close
      }
    });
  } else {
    console.error('Paddle not loaded');
    alert('Payment system is loading. Please try again in a moment.');
  }
}