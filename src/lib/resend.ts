import { Resend } from 'resend';

// During build time, environment variables might not be available
// Use a dummy key for build, validate at runtime
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_placeholder_for_build';

export const resend = new Resend(RESEND_API_KEY);

// Email sender configuration
export const EMAIL_FROM = 'NeuroNest <noreply@neuronest.work>';
export const SUPPORT_EMAIL = 'support@neuronest.work';

// Runtime validation helper
export function isEmailServiceConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_placeholder_for_build';
}
