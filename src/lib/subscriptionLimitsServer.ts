import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client
function getServerSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase configuration is missing');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  plan_type: string;
}

/**
 * Get plan limits based on plan type
 */
function getPlanLimits(planType: 'free' | 'master' | 'warrior') {
  const limits = {
    free: { aiBreakdowns: 3 },
    master: { aiBreakdowns: 10 },
    warrior: { aiBreakdowns: 25 }
  };
  return limits[planType];
}

/**
 * Check if user can use AI breakdown (server-side)
 */
export async function canUseAIBreakdownServer(userId: string): Promise<UsageCheckResult> {
  try {
    const supabase = getServerSupabaseClient();
    
    // Get usage limits directly from database
    const { data: usageLimits, error } = await supabase
      .from('usage_limits')
      .select('breakdowns_used, breakdowns_limit, plan_type')
      .eq('user_id', userId)
      .single();

    if (error || !usageLimits) {
      console.error('Error fetching usage limits:', error);
      // Default to free plan if no record exists
      return {
        allowed: true, // Allow first use
        used: 0,
        limit: 3,
        plan_type: 'free'
      };
    }

    const used = usageLimits.breakdowns_used || 0;
    const limit = usageLimits.breakdowns_limit || 3;
    const planType = usageLimits.plan_type || 'free';

    return {
      allowed: used < limit,
      used,
      limit,
      plan_type: planType
    };
  } catch (error) {
    console.error('Error in canUseAIBreakdownServer:', error);
    return {
      allowed: false,
      used: 0,
      limit: 3,
      plan_type: 'free'
    };
  }
}

/**
 * Increment AI usage count (server-side)
 */
export async function incrementAIUsageServer(userId: string): Promise<boolean> {
  try {
    const supabase = getServerSupabaseClient();
    
    // First, ensure user has a usage_limits record
    const { data: existing } = await supabase
      .from('usage_limits')
      .select('breakdowns_used, user_id')
      .eq('user_id', userId)
      .single();

    if (!existing) {
      // Create initial record
      const { error: insertError } = await supabase
        .from('usage_limits')
        .insert({
          user_id: userId,
          plan_type: 'free',
          breakdowns_used: 1,
          breakdowns_limit: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error creating usage limits:', insertError);
        return false;
      }
      return true;
    }

    // Increment existing record
    const { error: updateError } = await supabase
      .from('usage_limits')
      .update({
        breakdowns_used: (existing.breakdowns_used || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error incrementing usage:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in incrementAIUsageServer:', error);
    return false;
  }
}
