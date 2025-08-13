/**
 * Get the appropriate redirect URL based on environment
 * Uses Vercel's VERCEL_URL or NEXT_PUBLIC_SITE_URL for production, falls back to location.origin for development
 */
export const getRedirectUrl = (): string => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Use custom site URL, Vercel URL, or fall back to current origin
    return process.env.NEXT_PUBLIC_SITE_URL || 
           (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : window.location.origin);
  }
  
  // Server-side fallback
  return process.env.NEXT_PUBLIC_SITE_URL || 
         (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
};