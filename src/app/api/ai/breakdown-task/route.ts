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
    
    // First try to use the database function
    let usageData;
    try {
      const { data, error } = await client.rpc('can_use_ai_breakdown', {
        user_uuid: userId
      });

      if (error) {
        console.error('Database function error:', error);
        throw error;
      }
      usageData = Array.isArray(data) ? data[0] : data;
    } catch (dbError) {
      console.error('Database function failed, using direct query:', dbError);
      
      // Fallback to direct query if function doesn't exist
      const { data: limitsData, error: limitsError } = await client
        .from('usage_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (limitsError && limitsError.code !== 'PGRST116') {
        console.error('Direct query also failed:', limitsError);
        return {
          allowed: false,
          used: 0,
          limit: 3,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
      }

      if (!limitsData) {
        // Create default limits
        await client.from('usage_limits').insert({
          user_id: userId,
          plan_type: 'free',
          breakdowns_used: 0,
          breakdowns_limit: 3,
          subjects_limit: 3,
          reset_date: new Date().toISOString().split('T')[0]
        });
        
        return {
          allowed: true,
          used: 0,
          limit: 3,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
      }

      // Check if reset is needed
      const today = new Date().toISOString().split('T')[0];
      if ((limitsData as any)?.reset_date < today) {
        await client
          .from('usage_limits')
          .update({
            breakdowns_used: 0,
            flashcards_used: 0,
            reset_date: today,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        (limitsData as any).breakdowns_used = 0;
      }

      usageData = {
        allowed: (limitsData as any).breakdowns_used < (limitsData as any).breakdowns_limit,
        used: (limitsData as any).breakdowns_used,
        limit_val: (limitsData as any).breakdowns_limit,
        plan_type: (limitsData as any).plan_type
      };
    }

    if (!usageData) {
      return {
        allowed: false,
        used: 0,
        limit: 3,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
    }

    return {
      allowed: usageData.allowed || false,
      used: usageData.used || 0,
      limit: usageData.limit_val || 3,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    };

  } catch (error) {
    console.error('Usage check error:', error);
    // Default to safe values on error - don't allow to prevent abuse
    return {
      allowed: false,
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
      // ai_usage table might not exist, continue with usage limits update
      console.log('ai_usage table not available, skipping detailed tracking');
    }

    // Try to use the database function first, fallback to direct update
    try {
      const { error } = await client.rpc('increment_ai_usage', {
        user_uuid: userId
      });

      if (error) {
        throw error;
      }
    } catch (dbError) {
      console.error('Database function failed, using direct update:', dbError);
      
      // Get current usage first
      const { data: currentLimits } = await client
        .from('usage_limits')
        .select('breakdowns_used')
        .eq('user_id', userId)
        .single();
      
      const currentUsed = (currentLimits as any)?.breakdowns_used || 0;
      
      // Fallback to direct update
      const { error: updateError } = await client
        .from('usage_limits')
        .update({ 
          breakdowns_used: currentUsed + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Direct update also failed:', updateError);
      }
    }
  } catch (error) {
    console.error('Usage tracking error:', error);
    // Don't fail the request if tracking fails
  }
}