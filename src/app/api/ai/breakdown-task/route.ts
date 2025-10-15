import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateTaskBreakdown, TaskBreakdownRequest } from '@/lib/azureOpenAI';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Check if Azure OpenAI is configured
    if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_DEPLOYMENT_NAME) {
      return NextResponse.json(
        { error: 'AI service is not configured' },
        { status: 503 }
      );
    }

    const { taskData, userId } = await req.json();

    // Validate required fields
    if (!taskData?.title || !userId) {
      return NextResponse.json(
        { error: 'Task title and user ID are required' },
        { status: 400 }
      );
    }

    // Check user's subscription and usage limits
    const usageCheck = await checkUsageLimits(userId);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Daily limit reached',
          limit: usageCheck.limit,
          used: usageCheck.used,
          resetTime: usageCheck.resetTime
        },
        { status: 429 }
      );
    }

    // Prepare the breakdown request
    const breakdownRequest: TaskBreakdownRequest = {
      title: taskData.title,
      description: taskData.description,
      deadline: taskData.deadline,
      subject: taskData.subject,
      userContext: taskData.userContext
    };

    // Generate the breakdown using Azure OpenAI
    const breakdown = await generateTaskBreakdown(breakdownRequest);

    // Track the usage
    await trackUsage(userId, 'task_breakdown', breakdown.length);

    // Return the breakdown
    return NextResponse.json({
      success: true,
      breakdown,
      usage: {
        used: usageCheck.used + 1,
        limit: usageCheck.limit,
        remaining: usageCheck.limit - usageCheck.used - 1
      }
    });

  } catch (error) {
    console.error('Task breakdown API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate task breakdown' },
      { status: 500 }
    );
  }
}

// Check if user can use AI breakdown feature
async function checkUsageLimits(userId: string) {
  try {
    // Get user's subscription info
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_type')
      .eq('user_id', userId)
      .single();

    const planType = subscription?.plan_type || 'free';

    // Get current usage
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_type', 'task_breakdown')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    const usedToday = usage?.length || 0;

    // Define limits based on plan
    const limits = {
      free: 3,
      master: 10,
      warrior: 25
    };

    const limit = limits[planType as keyof typeof limits] || 3;

    return {
      allowed: usedToday < limit,
      used: usedToday,
      limit,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    };

  } catch (error) {
    console.error('Usage check error:', error);
    // Default to free tier limits on error
    return {
      allowed: false,
      used: 999,
      limit: 3,
      resetTime: new Date()
    };
  }
}

// Track AI usage for billing and analytics
async function trackUsage(userId: string, featureType: string, tokensUsed: number) {
  try {
    await supabase.from('ai_usage').insert({
      user_id: userId,
      feature_type: featureType,
      tokens_used: tokensUsed,
      cost: tokensUsed * 0.0001, // Rough estimate
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Usage tracking error:', error);
    // Don't fail the request if tracking fails
  }
}