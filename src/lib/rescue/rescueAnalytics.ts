// ────────────────────────────────────────────────────
// NeuroNest Rescue — Privacy-Safe Analytics
// No raw task text, action text, email, or secrets.
// Uses Vercel Analytics when available, no-op otherwise.
// ────────────────────────────────────────────────────

import type { RescueAnalyticsEvent } from '@/types/rescue';

/** Track a rescue analytics event. */
export function trackEvent(event: RescueAnalyticsEvent): void {
  try {
    // Send to Vercel Analytics if available
    if (typeof window !== 'undefined' && (window as any).va) {
      (window as any).va('track', event.event, stripSensitiveData(event));
    }
  } catch {
    // Silently fail — analytics should never break the app
  }
}

/**
 * Strip any potentially sensitive data from the event.
 * Ensures no raw task text, action text, emails, or secrets are sent.
 */
function stripSensitiveData(event: RescueAnalyticsEvent): Record<string, unknown> {
  const safe: Record<string, unknown> = {};

  // Only include explicitly safe fields
  safe.event = event.event;

  if ('friction' in event && event.friction) {
    safe.friction = event.friction;
  }
  if ('adaptationDepth' in event && event.adaptationDepth !== undefined) {
    safe.adaptationDepth = event.adaptationDepth;
  }
  if ('adaptationsUsed' in event && event.adaptationsUsed !== undefined) {
    safe.adaptationsUsed = event.adaptationsUsed;
  }
  if ('daysSinceLastSession' in event && event.daysSinceLastSession !== undefined) {
    safe.daysSinceLastSession = event.daysSinceLastSession;
  }

  return safe;
}