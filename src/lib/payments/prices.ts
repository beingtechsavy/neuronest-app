export type BillingCycle = 'monthly' | 'yearly';

/**
 * What Pro costs, in minor units. Single source of truth for both the marketing
 * page and the checkout route so a displayed price can never drift from the
 * charged one.
 *
 * Client-safe: no node built-ins here. `lib/payments/razorpay.ts` re-exports it.
 */
export const PRO_PRICES = {
  monthly: { amount: 1900, currency: 'USD', display: '$19', label: '$19/month' },
  yearly: { amount: 14900, currency: 'USD', display: '$149', label: '$149/year' },
} as const;
