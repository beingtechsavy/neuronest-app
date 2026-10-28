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

export async function GET(req: NextRequest) {
  try {
    // Check if database service is configured
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

    const userId = authUser.id;
    const client = getSupabaseClient();

    // Fetch all breakdowns for the user
    const { data: breakdowns, error } = await client
      .from('ai_breakdowns')
      .select('id, original_task_title, created_at, completion_rate, steps_count, subject')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching breakdowns:', error);
      return NextResponse.json(
        { error: 'Failed to fetch breakdowns' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      breakdowns: breakdowns || []
    });

  } catch (error) {
    console.error('Breakdown list API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch breakdown list' },
      { status: 500 }
    );
  }
}
