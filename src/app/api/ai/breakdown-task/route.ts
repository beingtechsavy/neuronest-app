import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateTaskBreakdown, TaskBreakdownRequest } from '@/lib/azureOpenAI';

interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  resetTime: Date;
}

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
    // Check if required services are configured
    if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_DEPLOYMENT_NAME) {
      return NextResponse.json(
        { error: 'AI service is not configured' },
        { status: 503 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Database service is not configured' },
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

    // Return the breakdown with safe number conversion
    const safeUsed = typeof usageCheck.used === 'number' ? usageCheck.used : 0;
    const safeLimit = typeof usageCheck.limit === 'number' ? usageCheck.limit : 3;
    
    return NextResponse.json({
      success: true,
      breakdown,
      usage: {
        used: safeUsed + 1,
        limit: safeLimit,
        remaining: Math.max(0, safeLimit - safeUsed - 1)
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
async function checkUsageLimits(userId: string): Promise<UsageCheckResult> {
  try {
    const client = getSupabaseClient();
    
    // Get user's usage limits (includes plan info)
    const { data: limits } = await client
      .from('usage_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!limits) {
      // Create default limits if they don't exist
      await client.from('usage_limits').insert({
        user_id: userId,
        plan_type: 'free',
        breakdowns_used: 0,
        breakdowns_limit: 3,
        subjects_limit: 3
      });
      
      return {
        allowed: true,
        used: 0,
        limit: 3,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
    }

    const usedToday = typeof limits.breakdowns_used === 'number' ? limits.breakdowns_used : 0;
    const limit = typeof limits.breakdowns_limit === 'number' ? limits.breakdowns_limit : 3;

    return {
      allowed: usedToday < limit,
      used: usedToday,
      limit,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    };

  } catch (error) {
    console.error('Usage check error:', error);
    // Default to safe values on error
    return {
      allowed: true, // Allow on error to not block users
      used: 0,
      limit: 3,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }
}

// Track AI usage for billing and analytics
async function trackUsage(userId: string, featureType: string, tokensUsed: number) {
  try {
    const client = getSupabaseClient();
    
    // Insert into ai_usage for detailed tracking
    await client.from('ai_usage').insert({
      user_id: userId,
      feature_type: featureType,
      tokens_used: tokensUsed,
      cost: tokensUsed * 0.0001, // Rough estimate
      created_at: new Date().toISOString()
    });

    // Update usage_limits table for UI display
    const { data: currentLimits } = await client
      .from('usage_limits')
      .select('breakdowns_used')
      .eq('user_id', userId)
      .single();

    if (currentLimits) {
      // Safely convert to number before arithmetic
      const currentUsage = typeof currentLimits.breakdowns_used === 'number' ? currentLimits.breakdowns_used : 0;
      
      await client
        .from('usage_limits')
        .update({ 
          breakdowns_used: currentUsage + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Usage tracking error:', error);
    // Don't fail the request if tracking fails
  }
}