import { describe, expect, it } from 'vitest';
import crypto from 'crypto';
import { parseBmcDonation, verifyBmcWebhookSignature } from '@/lib/payments/buymeacoffee';

describe('Buy Me a Coffee Webhook verification', () => {
  const secret = 'test_bmc_secret_xyz123';
  const rawBody = JSON.stringify({
    event_id: 42,
    type: 'donation.created',
    data: {
      supporter_name: 'Alex Rivera',
      amount: '5.00',
      support_note: 'You got me through my report today!',
      support_currency: 'USD',
    },
  });

  it('validates a correct HMAC-SHA256 signature', () => {
    const validSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    expect(verifyBmcWebhookSignature(rawBody, validSignature, secret)).toBe(true);
  });

  it('rejects an invalid signature', () => {
    expect(verifyBmcWebhookSignature(rawBody, 'invalid_signature_hex', secret)).toBe(false);
  });

  it('rejects when signature or secret is missing', () => {
    expect(verifyBmcWebhookSignature(rawBody, null, secret)).toBe(false);
    expect(verifyBmcWebhookSignature(rawBody, undefined, secret)).toBe(false);
    expect(verifyBmcWebhookSignature(rawBody, 'sig', null)).toBe(false);
    expect(verifyBmcWebhookSignature(rawBody, 'sig', '')).toBe(false);
  });
});

describe('Buy Me a Coffee payload parser', () => {
  it('parses standard donation payload with all fields', () => {
    const payload = {
      event_id: 101,
      type: 'donation.created',
      live_mode: true,
      data: {
        supporter_name: 'Sam Taylor',
        amount: '10.00',
        support_note: 'Awesome work for ADHD focus!',
        support_currency: 'USD',
      },
    };

    const parsed = parseBmcDonation(payload);
    expect(parsed.eventId).toBe('101');
    expect(parsed.eventType).toBe('donation.created');
    expect(parsed.liveMode).toBe(true);
    expect(parsed.displayName).toBe('Sam Taylor');
    expect(parsed.isAnonymous).toBe(false);
    expect(parsed.amountCents).toBe(1000);
    expect(parsed.message).toBe('Awesome work for ADHD focus!');
    expect(parsed.currency).toBe('USD');
  });

  it('handles anonymous donations or missing supporter names', () => {
    const payload = {
      event_id: 102,
      type: 'donation.created',
      data: {
        supporter_name: '',
        amount: 5,
      },
    };

    const parsed = parseBmcDonation(payload);
    expect(parsed.displayName).toBe('Anonymous');
    expect(parsed.isAnonymous).toBe(true);
    expect(parsed.amountCents).toBe(500);
    expect(parsed.message).toBeNull();
  });

  it('calculates amount from coffee price and count if direct amount is absent', () => {
    const payload = {
      id: 'sub_999',
      event: 'donation.created',
      data: {
        payer_name: 'Jordan',
        support_coffee_price: '3.00',
        support_coffees: 3,
        support_currency: 'eur',
      },
    };

    const parsed = parseBmcDonation(payload);
    expect(parsed.displayName).toBe('Jordan');
    expect(parsed.amountCents).toBe(900); // 3 * 3 = $9 = 900 cents
    expect(parsed.currency).toBe('EUR');
  });

  it('clamps display name to 40 characters and message to 200 characters', () => {
    const payload = {
      data: {
        supporter_name: 'A'.repeat(60),
        support_note: 'B'.repeat(300),
        amount: 25,
      },
    };

    const parsed = parseBmcDonation(payload);
    expect(parsed.displayName.length).toBe(40);
    expect(parsed.message?.length).toBe(200);
  });

  it('detects test mode deliveries', () => {
    const payload = {
      event_id: 1,
      type: 'donation.created',
      live_mode: false,
      data: { supporter_name: 'Test Supporter' },
    };

    const parsed = parseBmcDonation(payload);
    expect(parsed.liveMode).toBe(false);
  });
});
