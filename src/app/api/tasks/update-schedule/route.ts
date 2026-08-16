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

export async function PATCH(req: NextRequest) {
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

    const { task_id, start_time, end_time, is_critical } = await req.json();

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

    // Validate time format if provided (HH:MM format)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (start_time && !timeRegex.test(start_time)) {
      return NextResponse.json(
        { error: 'Invalid start_time format. Expected HH:MM' },
        { status: 400 }
      );
    }
    if (end_time && !timeRegex.test(end_time)) {
      return NextResponse.json(
        { error: 'Invalid end_time format. Expected HH:MM' },
        { status: 400 }
      );
    }

    // Validate that start_time is before end_time if both are provided
    if (start_time && end_time) {
      const [startHour, startMin] = start_time.split(':').map(Number);
      const [endHour, endMin] = end_time.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (startMinutes >= endMinutes) {
        return NextResponse.json(
          { error: 'Start time must be before end time' },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: {
      start_time?: string | null;
      end_time?: string | null;
      is_critical?: boolean;
      updated_at?: string;
    } = {
      updated_at: new Date().toISOString()
    };

    if (start_time !== undefined) {
      updateData.start_time = start_time;
    }
    if (end_time !== undefined) {
      updateData.end_time = end_time;
    }
    if (is_critical !== undefined) {
      updateData.is_critical = is_critical;
    }

    // Update task with new schedule information
    const { data, error } = await client
      .from('tasks')
      .update(updateData)
      .eq('task_id', task_id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating task schedule:', error);
      return NextResponse.json(
        { error: 'Failed to update task schedule' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task: data
    });

  } catch (error) {
    console.error('Update schedule API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
