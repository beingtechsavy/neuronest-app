import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/payments/entitlements';
import { parseBmcDonation, verifyBmcWebhookSignature } from '@/lib/payments/buymeacoffee';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature-sha256');
  const secret = process.env.BUYMEACOFFEE_WEBHOOK_SECRET;

  // Signature verification: if secret is configured, require valid signature.
  if (secret) {
    if (!verifyBmcWebhookSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  let body: Record<string, any>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { eventId, eventType, liveMode, displayName, isAnonymous, amountCents, message, currency } =
    parseBmcDonation(body);

  // Acknowledge dashboard test deliveries immediately without creating test entries
  if (!liveMode) {
    return NextResponse.json({ received: true, test: true });
  }

  // Only sync supported donation creation events to the Supporters Wall
  const isDonation = eventType === 'donation.created' || eventType === 'one_time_support';
  if (!isDonation) {
    return NextResponse.json({ received: true, ignored: true, eventType });
  }

  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database storage not configured' }, { status: 503 });
  }

  const providerEventId = eventId ? `bmc_${eventId}` : `bmc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Deduplication check via payment_events
  const { data: existing } = await supabase
    .from('payment_events')
    .select('id, processed_at')
    .eq('provider', 'buymeacoffee')
    .eq('provider_event_id', providerEventId)
    .maybeSingle();

  if (existing?.processed_at) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await supabase.from('payment_events').upsert(
    {
      provider: 'buymeacoffee',
      provider_event_id: providerEventId,
      event_type: eventType,
      payload: body,
    },
    { onConflict: 'provider_event_id' },
  );

  // Record supporter onto the public wall
  const { error: insertError } = await supabase.from('supporters').insert({
    display_name: displayName,
    is_anonymous: isAnonymous,
    amount: amountCents,
    currency,
    message,
  });

  if (insertError) {
    console.error('Failed to insert BMC supporter:', insertError.message);
    return NextResponse.json({ error: 'Failed to record supporter' }, { status: 500 });
  }

  await supabase
    .from('payment_events')
    .update({ processed_at: new Date().toISOString() })
    .eq('provider_event_id', providerEventId);

  return NextResponse.json({ received: true, supporter: displayName });
}
