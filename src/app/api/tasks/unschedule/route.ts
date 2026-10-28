import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/serverAuth';

// Lazy initialization of Supabase client
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing. Please check your environment variables.');
    }
    
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabase;
}

export async function POST(req: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Database service is not configured' },
        { status: 503 }
      );
    }

    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task_id } = await req.json();

    if (!task_id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // Verify task ownership
    const { data: existingTask, error: fetchErr } = await client
      .from('tasks')
      .select('user_id')
      .eq('task_id', task_id)
      .single();

    if (fetchErr || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (existingTask.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Unschedule task by removing scheduled_date, start_time, end_time
    // and setting task_status to 'inbox'
    const { data, error } = await client
      .from('tasks')
      .update({
        scheduled_date: null,
        start_time: null,
        end_time: null,
        task_status: 'inbox',
        updated_at: new Date().toISOString()
      })
      .eq('task_id', task_id)
      .select('*')
      .single();

    if (error) {
      console.error('Error unscheduling task:', error);
      return NextResponse.json(
        { error: 'Failed to unschedule task' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      task: data
    });

  } catch (error) {
    console.error('Unschedule task API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
