import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender configuration
export const EMAIL_FROM = 'NeuroNest <noreply@neuronest.work>';
export const SUPPORT_EMAIL = 'support@neuronest.work';
