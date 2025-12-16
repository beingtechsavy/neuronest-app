import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateTaskBreakdown, TaskBreakdownRequest } from '@/lib/azureOpenAI';
import { canUseAIBreakdown, incrementAIUsage } from '@/lib/subscriptionLimits';



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

    // Check user's subscription and usage limits with proper validation
    const usageCheck = await canUseAIBreakdown(userId);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Daily limit reached or subscription expired',
          limit: usageCheck.limit,
          used: usageCheck.used,
          plan_type: usageCheck.plan_type
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

    // Track the usage with subscription validation
    const usageIncremented = await incrementAIUsage(userId);
    if (!usageIncremented) {
      console.error('Failed to increment AI usage for user:', userId);
      return NextResponse.json(
        { error: 'Failed to track usage - subscription may have expired' },
        { status: 403 }
      );
    }

    // Track detailed usage for analytics
    await trackDetailedUsage(userId, 'task_breakdown', breakdown.length);

    // Return the breakdown with updated usage data
    const safeUsed = typeof usageCheck.used === 'number' ? usageCheck.used : 0;
    const safeLimit = typeof usageCheck.limit === 'number' ? usageCheck.limit : 3;
    
    return NextResponse.json({
      success: true,
      breakdown,
      usage: {
        used: safeUsed + 1,
        limit: safeLimit,
        remaining: Math.max(0, safeLimit - safeUsed - 1),
        plan_type: usageCheck.plan_type
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

// Additional usage tracking for analytics (optional)
async function trackDetailedUsage(userId: string, featureType: string, tokensUsed: number) {
  try {
    const client = getSupabaseClient();
    
    // Insert into ai_usage for detailed tracking (if table exists)
    try {
      await client.from('ai_usage').insert({
        user_id: userId,
        feature_type: featureType,
        tokens_used: tokensUsed,
        cost: tokensUsed * 0.0001, // Rough estimate
        created_at: new Date().toISOString()
      });
    } catch (aiUsageError) {
      // ai_usage table might not exist, continue silently
      console.log('ai_usage table not available, skipping detailed tracking');
    }
  } catch (error) {
    console.error('Detailed usage tracking error:', error);
    // Don't fail the request if tracking fails
  }
}