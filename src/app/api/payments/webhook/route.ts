import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/payments/entitlements';
import { verifyRazorpayWebhookSignature } from '@/lib/payments/razorpay';
import { sendPaymentReceiptEmail, sendSubscriptionConfirmationEmail, sendDonationThankYouEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyRazorpayWebhookSignature(rawBody, request.headers.get('x-razorpay-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventId = request.headers.get('x-razorpay-event-id') || payload.id;
  const eventType = payload.event;
  if (!eventId || !eventType) return NextResponse.json({ error: 'Missing event identity' }, { status: 400 });

  const supabase = getAdminSupabase();
  if (!supabase) return NextResponse.json({ error: 'Payment storage is not configured' }, { status: 503 });

  const { data, error } = await supabase.rpc('apply_razorpay_event', { event_id: eventId, event_body: payload });
  if (error) {
    console.error('Payment event processing error:', error.code);
    return NextResponse.json({ error: 'Payment event rejected' }, { status: 400 });
  }
  const result = data as {
    user_id?: string; payment_id?: string; receipt_new?: boolean; billing_cycle?: string;
    product?: string; display_name?: string;
  } | null;
  if (result?.user_id && result.receipt_new && result.payment_id) {
    const { data: authUser } = await supabase.auth.admin.getUserById(result.user_id);
    const email = authUser.user?.email;
    const paymentEntity = payload?.payload?.payment?.entity || {};
    const subscriptionEntity = payload?.payload?.subscription?.entity || {};
    if (email) {
      // Donations: thank-you email only — never subscription copy.
      if (result.product === 'donation') {
        const displayLabel = paymentEntity.currency === 'INR'
          ? `₹${((Number(paymentEntity.amount) || 0) / 100).toFixed(0)}`
          : `$${((Number(paymentEntity.amount) || 0) / 100).toFixed(0)}`;
        await sendDonationThankYouEmail(
          email,
          result.display_name || 'friend',
          displayLabel,
          result.payment_id,
          result.display_name !== 'Anonymous',
        );
        await supabase.from('payment_receipts').update({ email_sent_at: new Date().toISOString() }).eq('payment_id', result.payment_id);
        return NextResponse.json({ received: true, donation: true, result: data });
      }
      const amount = `${((Number(paymentEntity.amount) || 0) / 100).toFixed(2)} ${paymentEntity.currency || 'INR'}`;
      const date = new Date(Number(payload.created_at || Date.now() / 1000) * 1000).toISOString();
      await sendPaymentReceiptEmail(email, authUser.user?.user_metadata?.full_name || email.split('@')[0], 'Pro', amount, result.payment_id, date);
      if (eventType === 'subscription.activated') {
        await sendSubscriptionConfirmationEmail(email, authUser.user?.user_metadata?.full_name || email.split('@')[0], 'Pro', ['Cloud Rescue history', 'Cross-device resume', 'AI breakdown fair-use allowance'], subscriptionEntity.current_end ? new Date(Number(subscriptionEntity.current_end) * 1000).toISOString() : 'Next billing period', amount);
      }
      await supabase.from('payment_receipts').update({ email_sent_at: new Date().toISOString() }).eq('payment_id', result.payment_id);
    }
  }
  return NextResponse.json({ received: true, result: data });
}
