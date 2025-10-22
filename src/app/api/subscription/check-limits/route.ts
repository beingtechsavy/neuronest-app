import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization of Supabase client
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
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
    const { userId, limitType } = await req.json();

    if (!userId || !limitType) {
      return NextResponse.json(
        { error: 'User ID and limit type are required' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // Get user's plan info
    const { data: planData, error: planError } = await client.rpc('get_user_plan_info', {
      user_uuid: userId
    });

    if (planError) {
      console.error('Error fetching plan info:', planError);
      return NextResponse.json(
        { error: 'Failed to fetch plan information' },
        { status: 500 }
      );
    }

    const planInfo = Array.isArray(planData) ? planData[0] : planData;
    if (!planInfo) {
      return NextResponse.json(
        { error: 'Plan information not found' },
        { status: 404 }
      );
    }

    let canUse = false;
    let used = 0;
    let limit = 0;
    let message = '';

    switch (limitType) {
      case 'subjects':
        canUse = planInfo.can_create_subjects;
        used = planInfo.subjects_count;
        limit = planInfo.subjects_limit;
        message = canUse ? 'Can create more subjects' : 'Subject limit reached';
        break;
      
      case 'ai':
        canUse = planInfo.can_use_ai;
        used = planInfo.breakdowns_used;
        limit = planInfo.breakdowns_limit;
        message = canUse ? 'Can use AI breakdown' : 'AI breakdown limit reached for today';
        break;
      
      case 'flashcards':
        canUse = planInfo.flashcards_limit > 0 && planInfo.flashcards_used < planInfo.flashcards_limit;
        used = planInfo.flashcards_used;
        limit = planInfo.flashcards_limit;
        message = canUse ? 'Can use AI flashcards' : 'AI flashcards not available or limit reached';
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid limit type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      canUse,
      used,
      limit,
      message,
      planType: planInfo.plan_type,
      planInfo
    });

  } catch (error) {
    console.error('Check limits API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}