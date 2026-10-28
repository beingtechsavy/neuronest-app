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

    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskIds } = await req.json();

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: 'Task IDs are required' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const userId = authUser.id;

    // Verify task ownership for all provided task IDs
    const { data: targetTasks, error: checkErr } = await client
      .from('tasks')
      .select('task_id, user_id')
      .in('task_id', taskIds);

    if (checkErr || !targetTasks || targetTasks.length === 0) {
      return NextResponse.json({ error: 'Tasks not found' }, { status: 404 });
    }

    const hasUnauthorizedTask = targetTasks.some((t) => t.user_id !== userId);
    if (hasUnauthorizedTask) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update tasks from 'breakdown' status to 'inbox' status
    const { data, error } = await client
      .from('tasks')
      .update({ task_status: 'inbox' })
      .eq('user_id', userId)
      .in('task_id', taskIds)
      .eq('task_status', 'breakdown')
      .select('task_id, title');

    if (error) {
      console.error('Error moving tasks to inbox:', error);
      return NextResponse.json(
        { error: 'Failed to move tasks to inbox' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      movedCount: data?.length || 0,
      tasks: data || []
    });

  } catch (error) {
    console.error('Move to inbox API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}