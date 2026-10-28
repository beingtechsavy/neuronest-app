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

    // Fetch the most recent breakdown for the user
    const { data: breakdowns, error } = await client
      .from('ai_breakdowns')
      .select('id, original_task_title, created_at, completion_rate, steps_count')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching recent breakdown:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recent breakdown' },
        { status: 500 }
      );
    }

    // Return null if no breakdowns exist
    const recentBreakdown = breakdowns && breakdowns.length > 0 ? breakdowns[0] : null;

    return NextResponse.json({
      success: true,
      breakdown: recentBreakdown
    });

  } catch (error) {
    console.error('Recent breakdown API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch recent breakdown' },
      { status: 500 }
    );
  }
}
