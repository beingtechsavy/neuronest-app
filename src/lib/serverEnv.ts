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
  AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_DEPLOYMENT_NAME: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
} as const;

export type ServerEnv = typeof serverEnv;
