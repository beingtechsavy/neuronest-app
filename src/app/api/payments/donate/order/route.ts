import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { checkRateLimit } from '@/lib/serverRateLimit';
import { getAdminSupabase } from '@/lib/payments/entitlements';
import { createDonationOrder } from '@/lib/payments/razorpay';
import { validateDonationAmount, DONATION_CURRENCY } from '@/lib/payments/donations';

/**
 * Support NeuroNest (donation) checkout. One-time Razorpay order — mirrors
 * /api/payments/create-order, but records mode='order' + billing_cycle='one_time'
 * and never touches subscriptions or entitlements.
 */
export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, 'payment-create', 10, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: 'Too many checkout attempts' }, { status: 429 });

  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as {
      amount?: number;
      displayName?: string;
      isAnonymous?: boolean;
      message?: string;
    };

    const amountCents = validateDonationAmount(body.amount);
    if ('error' in amountCents) {
      return NextResponse.json({ error: amountCents.error }, { status: 400 });
    }

    // Wall display fields — sanitized here; the supporters table enforces lengths too.
    const isAnonymous = body.isAnonymous === true;
    const requestedName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    const displayName = isAnonymous
      ? 'Anonymous'
      : requestedName.slice(0, 40) || user.user_metadata?.full_name?.slice(0, 40) || 'Anonymous';
    const message = typeof body.message === 'string'
      ? body.message.trim().slice(0, 200)
      : '';

    const admin = getAdminSupabase();
    if (!admin) return NextResponse.json({ error: 'Payment storage is not configured' }, { status: 503 });

    // Display prefs ride on the Razorpay order notes so the webhook (the only
    // writer to `supporters`) can read them without a second fetch.
    const order = await createDonationOrder(
      user.id,
      amountCents.cents,
      DONATION_CURRENCY,
      displayName,
      message,
    );
    const { error } = await admin.from('checkout_sessions').insert({
      user_id: user.id,
      provider_id: order.id,
      mode: 'order',
      billing_cycle: 'one_time',
      amount: amountCents.cents,
      currency: DONATION_CURRENCY,
    });
    if (error) throw new Error('Unable to record checkout');

    return NextResponse.json({
      mode: 'order',
      order,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create donation error:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Donations are not available yet' }, { status: 503 });
  }
}
