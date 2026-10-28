import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { checkRateLimit } from '@/lib/serverRateLimit';
import { getAdminSupabase } from '@/lib/payments/entitlements';
import { isValidEmail } from '@/lib/emailValidation';

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/**
 * Pro waitlist capture while the international checkout route is being decided.
 * Mirrors the product_feedback posture: anyone can join (guest-friendly),
 * rows are only readable server-side; position count is returned publicly.
 */
export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, 'waitlist-join', 5, 300_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in a few minutes.' },
      { status: 429 },
    );
  }

  try {
    const body = await request.json() as { email?: string; note?: string };
    const admin = getAdminSupabase();
    if (!admin) return NextResponse.json({ error: 'Waitlist is not available yet' }, { status: 503 });

    // Signed-in users can join without typing anything — fall back to their
    // account email. Guests must provide one so they can be notified at launch.
    const user = await getAuthenticatedUser(request);
    const normalized = normalizeEmail(body.email || user?.email || '');
    if (!normalized || !isValidEmail(normalized)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';
    const { error } = await admin.from('pro_waitlist').insert({
      email: normalized,
      user_id: user?.id ?? null,
      note,
    });
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ joined: true, duplicate: true });
      }
      throw new Error('Unable to record waitlist signup');
    }
    return NextResponse.json({ joined: true });
  } catch (error) {
    console.error('Waitlist join error:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to join the waitlist right now' }, { status: 500 });
  }
}

/** Public position indicator — counts without exposing other people's emails. */
export async function GET() {
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ count: null });
  const { count, error } = await admin.from('pro_waitlist').select('*', { count: 'exact', head: true });
  if (error) return NextResponse.json({ count: null });
  return NextResponse.json({ count });
}
