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
 * Enforces database schema limits: display_name <= 40, message <= 200, amount 100..100000.
 */
export function parseBmcDonation(body: Record<string, any>): ParsedBmcDonation {
  const data = (body.data && typeof body.data === 'object') ? body.data : body;
  const eventType = String(body.type || body.event || 'donation.created');
  const eventId = String(body.event_id || body.id || data.support_id || data.transaction_id || '');
  const liveMode = body.live_mode !== false;

  // Extract supporter name (support both webhook v1 and v2 shapes)
  const rawName = typeof data.supporter_name === 'string'
    ? data.supporter_name.trim()
    : typeof data.payer_name === 'string'
      ? data.payer_name.trim()
      : typeof data.name === 'string'
        ? data.name.trim()
        : '';

  const isAnonymous = !rawName || rawName.toLowerCase() === 'anonymous' || data.is_anonymous === true;
  const displayName = isAnonymous ? 'Anonymous' : rawName.slice(0, 40);

  // Extract amount in cents
  let cents = 500;
  const rawAmount = data.amount ?? data.total_amount ?? data.support_amount;
  if (rawAmount !== undefined && rawAmount !== null) {
    const num = Number(rawAmount);
    if (!Number.isNaN(num) && num > 0) {
      cents = num < 500 ? Math.round(num * 100) : Math.round(num);
    }
  } else if (data.support_coffee_price) {
    const price = Number(data.support_coffee_price) || 5;
    const count = Number(data.support_coffees) || 1;
    cents = Math.round(price * count * 100);
  }

  // Clamped to database constraint range [100, 100000] (i.e. $1 to $1,000)
  cents = Math.max(100, Math.min(100000, cents));

  // Extract message note
  const rawMessage = typeof data.support_note === 'string'
    ? data.support_note.trim()
    : typeof data.message === 'string'
      ? data.message.trim()
      : typeof data.note === 'string'
        ? data.note.trim()
        : '';
  const message = rawMessage ? rawMessage.slice(0, 200) : null;

  // Extract currency
  const currency = typeof data.support_currency === 'string'
    ? data.support_currency.toUpperCase().slice(0, 5)
    : typeof data.currency === 'string'
      ? data.currency.toUpperCase().slice(0, 5)
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
