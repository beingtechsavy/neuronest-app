import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/payments/entitlements';
import { checkRateLimit } from '@/lib/serverRateLimit';

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, 'feedback', 5, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  try {
    const body = await request.json() as { helpful?: unknown; comment?: unknown };
    if (typeof body.helpful !== 'boolean') return NextResponse.json({ error: 'Helpful response is required' }, { status: 400 });
    const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 1000) : null;
    const client = getAdminSupabase();
    if (client) {
      const { error } = await client.from('product_feedback').insert({ helpful: body.helpful, comment });
      if (error) return NextResponse.json({ error: 'Unable to save feedback' }, { status: 500 });
    }
    return NextResponse.json({ saved: true });
  } catch { return NextResponse.json({ error: 'Invalid feedback request' }, { status: 400 }); }
}
