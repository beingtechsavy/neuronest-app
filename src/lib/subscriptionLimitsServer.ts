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
 * Helper to get current YYYY-MM-DD date string in Indian Standard Time (Asia/Kolkata, UTC+5:30)
 */
function getISTDateString(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

/**
 * Check if user can use AI breakdown (server-side with fail-closed & IST daily reset)
 */
export async function canUseAIBreakdownServer(userId: string): Promise<UsageCheckResult> {
  try {
    const supabase = getServerSupabaseClient();
    const todayIST = getISTDateString();
    
    // Get usage limits directly from database
    const { data: usageLimits, error } = await supabase
      .from('usage_limits')
      .select('breakdowns_used, breakdowns_limit, plan_type, reset_date')
      .eq('user_id', userId)
      .single();

    // FAIL CLOSED: If DB query errors out, block request by default
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching usage limits (failing closed):', error);
      return {
        allowed: false,
        used: 0,
        limit: 3,
        plan_type: 'free'
      };
    }

    if (!usageLimits) {
      // Create initial record for user with IST reset date
      const { error: insertError } = await supabase
        .from('usage_limits')
        .insert({
          user_id: userId,
          plan_type: 'free',
          breakdowns_used: 0,
          breakdowns_limit: 3,
          reset_date: todayIST,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating initial usage limits (failing closed):', insertError);
        return {
          allowed: false,
          used: 0,
          limit: 3,
          plan_type: 'free'
        };
      }

      return {
        allowed: true,
        used: 0,
        limit: 3,
        plan_type: 'free'
      };
    }

    let used = usageLimits.breakdowns_used || 0;

    // Daily reset check across day boundary in IST (Asia/Kolkata)
    if (usageLimits.reset_date !== todayIST) {
      used = 0;
      await supabase
        .from('usage_limits')
        .update({
          breakdowns_used: 0,
          reset_date: todayIST,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }

    const limit = usageLimits.breakdowns_limit || 3;
    const planType = usageLimits.plan_type || 'free';

    return {
      allowed: used < limit,
      used,
      limit,
      plan_type: planType
    };
  } catch (error) {
    console.error('Error in canUseAIBreakdownServer (failing closed):', error);
    return {
      allowed: false,
      used: 0,
      limit: 3,
      plan_type: 'free'
    };
  }
}

/**
 * Increment AI usage count (server-side with IST daily reset tracking)
 */
export async function incrementAIUsageServer(userId: string): Promise<boolean> {
  try {
    const supabase = getServerSupabaseClient();
    const todayIST = getISTDateString();
    
    // First, ensure user has a usage_limits record
    const { data: existing, error: fetchError } = await supabase
      .from('usage_limits')
      .select('breakdowns_used, user_id, reset_date')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching usage_limits in increment (failing closed):', fetchError);
      return false;
    }

    if (!existing) {
      // Create initial record
      const { error: insertError } = await supabase
        .from('usage_limits')
        .insert({
          user_id: userId,
          plan_type: 'free',
          breakdowns_used: 1,
          breakdowns_limit: 3,
          reset_date: todayIST,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error creating usage limits:', insertError);
        return false;
      }
      return true;
    }

    const isNewDay = existing.reset_date !== todayIST;
    const newUsed = isNewDay ? 1 : (existing.breakdowns_used || 0) + 1;

    // Increment or reset & increment record
    const { error: updateError } = await supabase
      .from('usage_limits')
      .update({
        breakdowns_used: newUsed,
        reset_date: todayIST,
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
