import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/payments/entitlements';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, db: 'unconfigured' }, { status: 503 });
  }

  const { error } = await supabase
    .from('supporters')
    .select('id', { count: 'exact', head: true })
    .limit(1);

  return NextResponse.json(
    { ok: !error, db: error ? 'error' : 'ok' },
    { status: error ? 503 : 200 },
  );
}
