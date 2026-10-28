import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyRazorpayWebhookSignature } from '@/lib/payments/razorpay';

describe('Razorpay webhook verification', () => {
  const previous = process.env.RAZORPAY_WEBHOOK_SECRET;

  beforeEach(() => { process.env.RAZORPAY_WEBHOOK_SECRET = 'test-secret'; });
  afterEach(() => {
    if (previous === undefined) delete process.env.RAZORPAY_WEBHOOK_SECRET;
    else process.env.RAZORPAY_WEBHOOK_SECRET = previous;
  });

  it('accepts a valid HMAC and rejects tampered payloads', () => {
    const body = '{"event":"payment.captured"}';
    const signature = createHmac('sha256', 'test-secret').update(body).digest('hex');
    expect(verifyRazorpayWebhookSignature(body, signature)).toBe(true);
    expect(verifyRazorpayWebhookSignature(`${body}x`, signature)).toBe(false);
  });
});
