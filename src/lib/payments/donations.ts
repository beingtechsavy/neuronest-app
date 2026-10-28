/**
 * Donation validation — shared between the donate route and tests.
 *
 * The client's amount input is only a hint; the server recomputes the charge
 * from a validated integer, so a tampered request can never post an abusive
 * amount. Presets are cents; custom amounts must be whole dollars.
 */

export const DONATION_PRESET_AMOUNTS = [300, 500, 1000] as const; // $3, $5, $10 in cents
export const DONATION_MIN_CENTS = 100; // $1
export const DONATION_MAX_CENTS = 100_000; // $1,000 cap
export const DONATION_CURRENCY = 'USD';

export type DonationAmount = { readonly cents: number } | { readonly error: string };

export function isValidDonationAmount(cents: unknown): boolean {
  if (typeof cents !== 'number' || !Number.isFinite(cents) || !Number.isInteger(cents)) return false;
  if (cents < DONATION_MIN_CENTS || cents > DONATION_MAX_CENTS) return false;
  return true;
}

/**
 * Validate a donation amount coming from an untrusted request body.
 * Accepts preset cents or whole-dollar custom amounts within the range.
 */
export function validateDonationAmount(input: unknown): DonationAmount {
  if (typeof input !== 'number' || !Number.isFinite(input)) {
    return { error: 'Choose a donation amount of $1 or more' };
  }
  const cents = Math.round(input);
  // Whole dollars only: $5.00 is fine, $5.49 is not (custom custom keeps admin simple).
  if (cents % 100 !== 0) {
    return { error: 'Custom donations must be whole dollars' };
  }
  if (!isValidDonationAmount(cents)) {
    return { error: 'Donations must be between $1 and $1,000' };
  }
  return { cents };
}

/** True when the cents value is one of the preset chips. */
export function isPresetDonation(cents: number): boolean {
  return (DONATION_PRESET_AMOUNTS as readonly number[]).includes(cents);
}
