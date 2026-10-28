/**
 * Server-side environment variable validation
 * For use in API routes and server components only
 */

// Server-side required environment variables
const serverRequiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const;

// Validate server environment variables
function validateServerEnv() {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(serverRequiredEnvVars)) {
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required server environment variables:\n${missing.join('\n')}\n\n` +
      `Please check your .env.local file and ensure all required variables are set.\n` +
      `See .env.example for reference.`
    );
  }
}

// Run validation
validateServerEnv();

// Export validated environment variables
export const serverEnv = {
  ...serverRequiredEnvVars,
  // Optional server variables
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4.1-flash-1017',
  OPENROUTER_FALLBACK_MODEL: process.env.OPENROUTER_FALLBACK_MODEL || 'liquid/lfm-2.5-2.6b:free',
  OPENROUTER_SITE_URL: process.env.OPENROUTER_SITE_URL,
  OPENROUTER_APP_NAME: process.env.OPENROUTER_APP_NAME,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  RAZORPAY_PRO_PLAN_ID_MONTHLY: process.env.RAZORPAY_PRO_PLAN_ID_MONTHLY,
  RAZORPAY_PRO_PLAN_ID_YEARLY: process.env.RAZORPAY_PRO_PLAN_ID_YEARLY,
  RAZORPAY_PRO_MONTHLY_PAYMENT_LINK: process.env.RAZORPAY_PRO_MONTHLY_PAYMENT_LINK,
  RAZORPAY_PRO_YEARLY_PAYMENT_LINK: process.env.RAZORPAY_PRO_YEARLY_PAYMENT_LINK,
} as const;

export type ServerEnv = typeof serverEnv;
