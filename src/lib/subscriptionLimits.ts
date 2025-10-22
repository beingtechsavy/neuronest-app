import { supabase } from './supabaseClient';

export interface UserPlanInfo {
  plan_type: 'free' | 'master' | 'warrior';
  status: string;
  breakdowns_used: number;
  breakdowns_limit: number;
  subjects_count: number;
  subjects_limit: number;
  flashcards_used: number;
  flashcards_limit: number;
  current_period_end: string | null;
  can_create_subjects: boolean;
  can_use_ai: boolean;
}

export interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  plan_type: string;
}

/**
 * Get complete user plan information including usage and limits
 */
export async function getUserPlanInfo(userId: string): Promise<UserPlanInfo | null> {
  try {
    // Try the new function name first
    let data, error;
    
    try {
      const result = await supabase.rpc('get_user_subscription_info', {
        user_uuid: userId
      });
      data = result.data;
      error = result.error;
    } catch (newFunctionError) {
      console.log('New function not available, trying old function name');
      // Fallback to old function name if it exists
      const result = await supabase.rpc('get_user_plan_info', {
        user_uuid: userId
      });
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error fetching user plan info:', error);
      
      // Final fallback: direct query
      const { data: directData, error: directError } = await supabase
        .from('usage_limits')
        .select(`
          plan_type,
          breakdowns_used,
          breakdowns_limit,
          subjects_limit,
          flashcards_used,
          flashcards_limit
        `)
        .eq('user_id', userId)
        .single();

      if (directError) {
        console.error('Direct query also failed:', directError);
        return null;
      }

      // Get subject count separately
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('subject_id')
        .eq('user_id', userId);

      const subjectCount = subjectsData?.length || 0;

      return {
        plan_type: directData.plan_type || 'free',
        status: 'active',
        breakdowns_used: directData.breakdowns_used || 0,
        breakdowns_limit: directData.breakdowns_limit || 3,
        subjects_count: subjectCount,
        subjects_limit: directData.subjects_limit || 3,
        flashcards_used: directData.flashcards_used || 0,
        flashcards_limit: directData.flashcards_limit || 0,
        current_period_end: null,
        can_create_subjects: subjectCount < (directData.subjects_limit || 3),
        can_use_ai: (directData.breakdowns_used || 0) < (directData.breakdowns_limit || 3)
      };
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in getUserPlanInfo:', error);
    return null;
  }
}

/**
 * Check if user can create more subjects
 */
export async function canCreateSubject(userId: string): Promise<boolean> {
  try {
    // Get user's plan info which includes subject count and limits
    const planInfo = await getUserPlanInfo(userId);
    if (!planInfo) {
      return false; // Fail safe - don't allow if error
    }

    return planInfo.can_create_subjects;
  } catch (error) {
    console.error('Error in canCreateSubject:', error);
    return false;
  }
}

/**
 * Check if user can use AI breakdown feature
 */
export async function canUseAIBreakdown(userId: string): Promise<UsageCheckResult> {
  try {
    const { data, error } = await supabase.rpc('can_use_ai_breakdown', {
      user_uuid: userId
    });

    if (error) {
      console.error('Error checking AI breakdown usage:', error);
      return {
        allowed: false,
        used: 0,
        limit: 3,
        plan_type: 'free'
      };
    }

    const result = data?.[0];
    return {
      allowed: result?.allowed || false,
      used: result?.used || 0,
      limit: result?.limit_val || 3,
      plan_type: result?.plan_type || 'free'
    };
  } catch (error) {
    console.error('Error in canUseAIBreakdown:', error);
    return {
      allowed: false,
      used: 0,
      limit: 3,
      plan_type: 'free'
    };
  }
}

/**
 * Increment AI breakdown usage count
 */
export async function incrementAIUsage(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('increment_ai_usage', {
      user_uuid: userId
    });

    if (error) {
      console.error('Error incrementing AI usage:', error);
      // Get current usage first
      const { data: currentLimits } = await supabase
        .from('usage_limits')
        .select('breakdowns_used')
        .eq('user_id', userId)
        .single();
      
      const currentUsed = (currentLimits as any)?.breakdowns_used || 0;
      
      // Try direct update as fallback
      const { error: updateError } = await supabase
        .from('usage_limits')
        .update({ 
          breakdowns_used: currentUsed + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Fallback update also failed:', updateError);
        return false;
      }
      return true;
    }

    return data === true;
  } catch (error) {
    console.error('Error in incrementAIUsage:', error);
    return false;
  }
}

/**
 * Get plan limits for display purposes
 */
export function getPlanLimits(planType: 'free' | 'master' | 'warrior') {
  const limits = {
    free: {
      subjects: 3,
      aiBreakdowns: 3,
      flashcards: 0,
      features: [
        '3 subjects',
        '3 AI breakdowns per day',
        'Basic focus timer',
        'Basic analytics'
      ]
    },
    master: {
      subjects: 15,
      aiBreakdowns: 10,
      flashcards: 20,
      features: [
        '15 subjects',
        '10 AI breakdowns per day',
        '20 AI flashcards per day',
        'AI study buddy',
        'Full analytics',
        'Priority support'
      ]
    },
    warrior: {
      subjects: 999999, // Unlimited
      aiBreakdowns: 25,
      flashcards: 50,
      features: [
        'Unlimited subjects',
        '25 AI breakdowns per day',
        '50 AI flashcards per day',
        'Advanced AI features',
        'Predictive analytics',
        'API access'
      ]
    }
  };

  return limits[planType];
}

/**
 * Format plan type for display
 */
export function formatPlanName(planType: string): string {
  switch (planType) {
    case 'free':
      return 'Free';
    case 'master':
      return 'Master';
    case 'warrior':
      return 'Warrior';
    default:
      return 'Free';
  }
}

/**
 * Get upgrade message based on current plan
 */
export function getUpgradeMessage(planType: string, feature: 'subjects' | 'ai' | 'flashcards'): string {
  const messages = {
    subjects: {
      free: 'Upgrade to Master for 15 subjects or Warrior for unlimited subjects',
      master: 'Upgrade to Warrior for unlimited subjects',
      warrior: 'You have unlimited subjects!'
    },
    ai: {
      free: 'Upgrade to Master for 10 AI breakdowns per day or Warrior for 25 per day',
      master: 'Upgrade to Warrior for 25 AI breakdowns per day',
      warrior: 'You have the maximum AI breakdowns!'
    },
    flashcards: {
      free: 'Upgrade to Master for 20 AI flashcards per day or Warrior for 50 per day',
      master: 'Upgrade to Warrior for 50 AI flashcards per day',
      warrior: 'You have the maximum AI flashcards!'
    }
  };

  return messages[feature][planType as keyof typeof messages[typeof feature]] || messages[feature].free;
}

/**
 * Check if user needs to upgrade for a specific feature
 */
export function needsUpgrade(planInfo: UserPlanInfo, feature: 'subjects' | 'ai' | 'flashcards'): boolean {
  switch (feature) {
    case 'subjects':
      return !planInfo.can_create_subjects;
    case 'ai':
      return !planInfo.can_use_ai;
    case 'flashcards':
      return planInfo.flashcards_limit === 0;
    default:
      return false;
  }
}