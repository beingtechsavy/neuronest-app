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

    if (typeof window !== 'undefined') {
      const payload = stripSensitiveData(event);
      void fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => undefined);
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
  if (event.sessionId) safe.session_id = event.sessionId;
  if (event.utmSource) safe.utm_source = event.utmSource;
  if (event.utmMedium) safe.utm_medium = event.utmMedium;
  if (event.utmCampaign) safe.utm_campaign = event.utmCampaign;
  if (event.referralCode) safe.referral_code = event.referralCode;
  if ('plan' in event && event.plan) safe.plan = event.plan;
  if ('billingCycle' in event && event.billingCycle) safe.billing_cycle = event.billingCycle;

  return safe;
}
