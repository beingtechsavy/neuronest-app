import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { createRazorpayOrder, createRazorpaySubscription, getHostedPaymentLink, type BillingCycle } from '@/lib/payments/razorpay';
import { checkRateLimit } from '@/lib/serverRateLimit';
import { getAdminSupabase } from '@/lib/payments/entitlements';
import { PRO_PRICES } from '@/lib/payments/razorpay';

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, 'payment-create', 10, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: 'Too many checkout attempts' }, { status: 429 });

  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as { billingCycle?: BillingCycle };
    const billingCycle = body.billingCycle === 'yearly' ? 'yearly' : 'monthly';
    const subscription = await createRazorpaySubscription(user.id, billingCycle);
    const admin = getAdminSupabase();
    if (!admin) return NextResponse.json({ error: 'Payment storage is not configured' }, { status: 503 });
    if (subscription) {
      const { error } = await admin.from('checkout_sessions').insert({
        user_id: user.id, provider_id: subscription.id, mode: 'subscription', billing_cycle: billingCycle,
        amount: PRO_PRICES[billingCycle].amount, currency: PRO_PRICES[billingCycle].currency,
      });
      if (error) throw new Error('Unable to record checkout');
      return NextResponse.json({ mode: 'subscription', subscription });
    }

    const order = await createRazorpayOrder(user.id, billingCycle);
    const { error } = await admin.from('checkout_sessions').insert({
      user_id: user.id, provider_id: order.id, mode: 'order', billing_cycle: billingCycle,
      amount: PRO_PRICES[billingCycle].amount, currency: PRO_PRICES[billingCycle].currency,
    });
    if (error) throw new Error('Unable to record checkout');
    return NextResponse.json({
      mode: 'order',
      order,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      hostedPaymentLink: getHostedPaymentLink(billingCycle),
    });
  } catch (error) {
    console.error('Create checkout error:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Checkout is not configured yet' }, { status: 503 });
  }
}
