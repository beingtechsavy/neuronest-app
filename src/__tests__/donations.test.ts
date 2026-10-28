import { describe, expect, it } from 'vitest';
import {
  isValidDonationAmount,
  validateDonationAmount,
  isPresetDonation,
  DONATION_PRESET_AMOUNTS,
  DONATION_MIN_CENTS,
  DONATION_MAX_CENTS,
} from '@/lib/payments/donations';

describe('donation amount validation', () => {
  it('accepts the preset chips', () => {
    for (const cents of DONATION_PRESET_AMOUNTS) {
      expect(validateDonationAmount(cents)).toEqual({ cents });
      expect(isPresetDonation(cents)).toBe(true);
    }
  });

  it('accepts custom whole dollars within range', () => {
    expect(validateDonationAmount(100)).toEqual({ cents: 100 });
    expect(validateDonationAmount(400)).toEqual({ cents: 400 });
    expect(validateDonationAmount(2500)).toEqual({ cents: 2500 });
    expect(validateDonationAmount(DONATION_MAX_CENTS)).toEqual({ cents: DONATION_MAX_CENTS });
    expect(isPresetDonation(400)).toBe(false);
  });

  it('rejects sub-dollar fractional amounts', () => {
    expect('error' in validateDonationAmount(149)).toBe(true);
    expect('error' in validateDonationAmount(1.5)).toBe(true);
  });

  it('rejects out-of-range amounts', () => {
    expect('error' in validateDonationAmount(0)).toBe(true);
    expect('error' in validateDonationAmount(-500)).toBe(true);
    expect('error' in validateDonationAmount(DONATION_MAX_CENTS + 100)).toBe(true);
    expect('error' in validateDonationAmount(DONATION_MIN_CENTS - 1)).toBe(true);
  });

  it('rejects non-numeric garbage', () => {
    expect('error' in validateDonationAmount('500' as unknown)).toBe(true);
    expect('error' in validateDonationAmount(NaN)).toBe(true);
    expect('error' in validateDonationAmount(Infinity)).toBe(true);
    expect('error' in validateDonationAmount(null as unknown)).toBe(true);
    expect('error' in validateDonationAmount(undefined as unknown)).toBe(true);
  });

  it('raw guard for direct integer checks', () => {
    expect(isValidDonationAmount(500)).toBe(true);
    expect(isValidDonationAmount(500.5)).toBe(false);
    expect(isValidDonationAmount(50)).toBe(false);
  });
});
