import crypto from 'crypto';

/**
 * Verify Buy Me a Coffee HMAC-SHA256 signature from the `x-signature-sha256` header.
 */
export function verifyBmcWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | null | undefined,
): boolean {
  if (!signature || !secret) return false;
  try {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const signatureBuffer = Buffer.from(signature.trim(), 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    if (signatureBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export interface ParsedBmcDonation {
  eventId: string;
  eventType: string;
  liveMode: boolean;
  displayName: string;
  isAnonymous: boolean;
  amountCents: number;
  message: string | null;
  currency: string;
}

/**
 * Normalize and sanitize Buy Me a Coffee webhook payload for the Supporters Wall.
 * Field names and units follow the published OpenAPI spec
 * (bmc-webhooks-openapi.json, DonationData + SupporterFields).
 * Enforces database schema limits: display_name <= 40, message <= 200, amount 100..100000.
 */
export function parseBmcDonation(body: Record<string, any>): ParsedBmcDonation {
  const data = (body.data && typeof body.data === 'object') ? body.data : body;
  const eventType = String(body.type || body.event || 'donation.created');
  const eventId = String(body.event_id || body.id || data.id || data.transaction_id || '');
  const liveMode = body.live_mode !== false;

  // Supporter identity (Spec: SupporterFields.supporter_name). Blank name = anonymous.
  const rawName = typeof data.supporter_name === 'string'
    ? data.supporter_name.trim()
    : typeof data.payer_name === 'string'
      ? data.payer_name.trim()
      : typeof data.name === 'string'
        ? data.name.trim()
        : '';

  const isAnonymous = !rawName || rawName.toLowerCase() === 'anonymous' || data.is_anonymous === true;
  const displayName = isAnonymous ? 'Anonymous' : rawName.slice(0, 40);

  // `amount` is a decimal in MAJOR units (spec example: 15.0 = $15.00), never cents.
  // Scaling it conditionally by magnitude would turn a $500 donation into 500 cents.
  let major = Number(data.amount ?? data.total_amount_charged ?? data.total_amount);
  if (!Number.isFinite(major) || major <= 0) {
    const price = Number(data.coffee_price);
    const count = Number(data.coffee_count) || 1;
    major = Number.isFinite(price) && price > 0 ? price * count : 5;
  }

  // Clamped to database constraint range [100, 100000] (i.e. 1 to 1,000 in major units).
  const cents = Math.max(100, Math.min(100000, Math.round(major * 100)));

  // `support_note` is the donor's own message. `message` is a system summary
  // ("Alex bought 3 coffees") and must never be published to the wall.
  const noteHidden = data.note_hidden === true || data.note_hidden === 'true';
  const rawMessage = !noteHidden && typeof data.support_note === 'string'
    ? data.support_note.trim()
    : '';
  const message = rawMessage ? rawMessage.slice(0, 200) : null;

  // Extract currency
  const currency = typeof data.currency === 'string'
    ? data.currency.toUpperCase().slice(0, 5)
    : typeof data.support_currency === 'string'
      ? data.support_currency.toUpperCase().slice(0, 5)
      : 'USD';

  return {
    eventId,
    eventType,
    liveMode,
    displayName,
    isAnonymous,
    amountCents: cents,
    message,
    currency,
  };
}

/**
 * Strip donor PII before the raw payload is persisted in `payment_events`.
 * Only the fields needed to reconstruct the wall entry are kept; the wall itself
 * stores no email or supporter identifier by design.
 */
export function redactBmcPayload(body: Record<string, any>): Record<string, any> {
  const source = body.data && typeof body.data === 'object' ? body.data : {};
  const data: Record<string, any> = { ...source };
  delete data.supporter_email;
  delete data.supporter_id;
  return { ...body, data };
}
