import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/serverRateLimit';

const EVENT_NAMES = new Set([
  'rescue_viewed',
  'rescue_started',
  'task_submitted',
  'friction_selected',
  'action_generated',
  'action_started',
  'action_completed',
  'still_stuck_selected',
  'adaptation_accepted',
  'session_stopped',
  'save_offered',
  'account_created_after_rescue',
  'return_rescue_started',
  'pricing_viewed',
  'checkout_started',
  'payment_completed',
]);

const FRICTIONS = new Set([
  'dont-know-where-to-start',
  'feels-too-big',
  'anxious-about-doing-it-badly',
  'feels-boring',
  'low-energy',
  'too-many-competing-tasks',
  'not-sure',
]);

const ALLOWED_KEYS = new Set([
  'event',
  'session_id',
  'friction',
  'adaptationDepth',
  'adaptationsUsed',
  'daysSinceLastSession',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'referral_code',
  'plan',
  'billing_cycle',
]);

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function isSafeString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, 'analytics-events', 120, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many analytics events' }, {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSeconds) },
    });
  }

  try {
    const payload = await request.json() as Record<string, unknown>;
    for (const key of Object.keys(payload)) {
      if (!ALLOWED_KEYS.has(key)) {
        return NextResponse.json({ error: 'Invalid analytics payload' }, { status: 400 });
      }
    }

    if (!isSafeString(payload.event, 64) || !EVENT_NAMES.has(payload.event)) {
      return NextResponse.json({ error: 'Invalid analytics event' }, { status: 400 });
    }

    if (payload.session_id !== undefined && !isSafeString(payload.session_id, 120)) {
      return NextResponse.json({ error: 'Invalid session identifier' }, { status: 400 });
    }
    if (payload.friction !== undefined && (!isSafeString(payload.friction, 64) || !FRICTIONS.has(payload.friction as string))) {
      return NextResponse.json({ error: 'Invalid friction type' }, { status: 400 });
    }
    for (const key of ['adaptationDepth', 'adaptationsUsed', 'daysSinceLastSession']) {
      if (payload[key] !== undefined && (!Number.isInteger(payload[key]) || Number(payload[key]) < 0 || Number(payload[key]) > 3650)) {
        return NextResponse.json({ error: 'Invalid analytics number' }, { status: 400 });
      }
    }
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'referral_code']) {
      if (payload[key] !== undefined && !isSafeString(payload[key], 120)) {
        return NextResponse.json({ error: 'Invalid campaign value' }, { status: 400 });
      }
    }

    const client = getAdminClient();
    if (!client) {
      // Analytics must never block the product when optional persistence is not configured.
      return NextResponse.json({ accepted: true, persisted: false });
    }

    const { error } = await client.from('rescue_events').insert({
      event_name: payload.event,
      session_id: payload.session_id || null,
      properties: payload,
    });

    if (error) {
      console.error('Analytics persistence error:', error.code);
      return NextResponse.json({ accepted: true, persisted: false });
    }

    return NextResponse.json({ accepted: true, persisted: true });
  } catch {
    return NextResponse.json({ error: 'Invalid analytics request' }, { status: 400 });
  }
}
