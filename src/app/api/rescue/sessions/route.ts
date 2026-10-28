import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { getAdminSupabase } from '@/lib/payments/entitlements';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const client = getAdminSupabase();
  if (!client) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });
  const { data, error } = await client
    .from('rescue_sessions')
    .select('id, friction_type, task_text, initial_action, final_action, adaptations, status, started_at, completed_at')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: 'Unable to load Rescue history' }, { status: 500 });
  return NextResponse.json({ sessions: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const client = getAdminSupabase();
  if (!client) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });

  try {
    const body = await request.json() as { session?: Record<string, unknown>; saveTaskText?: boolean };
    const session = body.session;
    if (!isObject(session) || !Array.isArray(session.adaptations) || !isObject(session.initialAction)) {
      return NextResponse.json({ error: 'Invalid Rescue session' }, { status: 400 });
    }
    if (typeof session.id !== 'string' || typeof session.friction !== 'string' || typeof session.status !== 'string') {
      return NextResponse.json({ error: 'Invalid Rescue session fields' }, { status: 400 });
    }

    const { data, error } = await client.from('rescue_sessions').upsert({
      user_id: user.id,
      client_session_id: session.id,
      friction_type: session.friction,
      task_text: body.saveTaskText === false ? null : typeof session.taskText === 'string' ? session.taskText.slice(0, 4000) : null,
      initial_action: session.initialAction,
      final_action: session.adaptations[session.adaptations.length - 1] || session.initialAction,
      adaptations: session.adaptations,
      status: session.status,
      started_at: session.startedAt || new Date().toISOString(),
      completed_at: session.completedAt || null,
    }, { onConflict: 'user_id,client_session_id' }).select('id').single();
    if (error) return NextResponse.json({ error: 'Unable to save Rescue session' }, { status: 500 });
    return NextResponse.json({ saved: true, id: data.id });
  } catch {
    return NextResponse.json({ error: 'Invalid Rescue session request' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Session id is required' }, { status: 400 });
  const client = getAdminSupabase();
  if (!client) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });
  const { error } = await client.from('rescue_sessions').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'Unable to delete Rescue session' }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
