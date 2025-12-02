import { Resend } from 'resend';

// During build time, environment variables might not be available
// We'll validate at runtime instead
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

export const resend = new Resend(RESEND_API_KEY);

// Email sender configuration
export const EMAIL_FROM = 'NeuroNest <noreply@neuronest.work>';
export const SUPPORT_EMAIL = 'support@neuronest.work';

// Runtime validation helper
export function isEmailServiceConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
