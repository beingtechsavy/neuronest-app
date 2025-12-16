import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserPlanInfo, canCreateSubject, canUseAIBreakdown } from '@/lib/subscriptionLimits';

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

    // Get user's plan info with proper subscription validation
    const planInfo = await getUserPlanInfo(userId);
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
        canUse = await canCreateSubject(userId);
        used = planInfo.subjects_count;
        limit = planInfo.subjects_limit;
        message = canUse ? 'Can create more subjects' : 
          planInfo.subscription_active ? 'Subject limit reached' : 'Subscription expired - upgrade to create more subjects';
        break;
      
      case 'ai':
        const aiCheck = await canUseAIBreakdown(userId);
        canUse = aiCheck.allowed;
        used = aiCheck.used;
        limit = aiCheck.limit;
        message = canUse ? 'Can use AI breakdown' : 
          planInfo.subscription_active ? 'AI breakdown limit reached for today' : 'Subscription expired - upgrade to use AI features';
        break;
      
      case 'flashcards':
        canUse = planInfo.subscription_active && planInfo.flashcards_limit > 0 && planInfo.flashcards_used < planInfo.flashcards_limit;
        used = planInfo.flashcards_used;
        limit = planInfo.flashcards_limit;
        message = canUse ? 'Can use AI flashcards' : 
          !planInfo.subscription_active ? 'Subscription expired - upgrade to use AI flashcards' :
          planInfo.flashcards_limit === 0 ? 'AI flashcards not available in your plan' : 'AI flashcards limit reached';
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
      subscriptionActive: planInfo.subscription_active,
      subscriptionExpired: planInfo.subscription_expired,
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