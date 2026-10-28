import { describe, expect, it } from 'vitest';
import { isValidEmail } from '@/lib/emailValidation';

// The waitlist route normalizes guest emails to lowercase before validating.
function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

describe('waitlist email normalization + validation', () => {
  it('normalizes casing and surrounding whitespace', () => {
    expect(normalizeEmail('  Someone@Example.COM ')).toBe('someone@example.com');
  });

  it('accepts valid emails after normalization', () => {
    expect(isValidEmail(normalizeEmail('Founder+ADHD@NeuroNest.work'))).toBe(true);
    expect(isValidEmail(normalizeEmail('a.b@sub.domain.io'))).toBe(true);
  });

  it('rejects malformed or empty input', () => {
    expect(isValidEmail(normalizeEmail('not-an-email'))).toBe(false);
    expect(isValidEmail(normalizeEmail(''))).toBe(false);
    expect(isValidEmail(normalizeEmail(null))).toBe(false);
    expect(isValidEmail(normalizeEmail(undefined))).toBe(false);
    expect(isValidEmail(normalizeEmail('spaces in@local.com'))).toBe(false);
  });
});
