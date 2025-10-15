import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's subjects
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('subject_id, title, color, is_stressful')
      .eq('user_id', userId)
      .order('title');

    if (error) {
      console.error('Error fetching subjects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subjects' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subjects || []
    });

  } catch (error) {
    console.error('Subjects list API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}