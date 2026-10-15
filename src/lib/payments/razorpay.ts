import crypto from 'node:crypto';

export type BillingCycle = 'monthly' | 'yearly';

export const PRO_PRICES = {
  monthly: { amount: 29900, currency: 'INR', label: '₹299/month' },
  yearly: { amount: 249900, currency: 'INR', label: '₹2,499/year' },
} as const;

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function createRazorpaySignature(orderId: string, paymentId: string): string | null {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return null;
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

export function getRazorpayAuthHeader(): string | null {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
}

export async function createRazorpayOrder(userId: string, billingCycle: BillingCycle) {
  const auth = getRazorpayAuthHeader();
  if (!auth) throw new Error('Razorpay is not configured');
  const price = PRO_PRICES[billingCycle];
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: price.amount,
      currency: price.currency,
      receipt: `nn_${userId.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: userId, plan_type: 'pro', billing_cycle: billingCycle },
    }),
  });
  if (!response.ok) {
    console.error('Razorpay order creation failed:', response.status);
    throw new Error('Unable to start checkout');
  }
  return response.json() as Promise<{ id: string; amount: number; currency: string; receipt: string }>;
}

export async function createRazorpaySubscription(userId: string, billingCycle: BillingCycle) {
  const auth = getRazorpayAuthHeader();
  const planId = billingCycle === 'monthly'
    ? process.env.RAZORPAY_PRO_PLAN_ID_MONTHLY
    : process.env.RAZORPAY_PRO_PLAN_ID_YEARLY;
  if (!auth || !planId || planId.includes('placeholder')) return null;

  const response = await fetch('https://api.razorpay.com/v1/subscriptions', {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan_id: planId,
      total_count: 120,
      customer_notify: 1,
      notes: { user_id: userId, plan_type: 'pro', billing_cycle: billingCycle },
    }),
  });
  if (!response.ok) {
    console.error('Razorpay subscription creation failed:', response.status);
    throw new Error('Unable to start subscription checkout');
  }
  return response.json() as Promise<{ id: string; short_url?: string; status: string }>;
}

export function getHostedPaymentLink(billingCycle: BillingCycle): string | null {
  const link = billingCycle === 'monthly'
    ? process.env.RAZORPAY_PRO_MONTHLY_PAYMENT_LINK
    : process.env.RAZORPAY_PRO_YEARLY_PAYMENT_LINK;
  return link && !link.includes('placeholder') ? link : null;
}
