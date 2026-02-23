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
  subscription_active: boolean;
  subscription_expired: boolean;
}

export interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  plan_type: string;
}

/**
 * Check if subscription is active and not expired
 */
function isSubscriptionValid(status: string, currentPeriodEnd: string | null): boolean {
  // If no subscription exists, treat as free plan (valid)
  if (!status || !currentPeriodEnd) {
    return status !== 'canceled' && status !== 'past_due' && status !== 'incomplete';
  }

  // Check if subscription is in valid status
  const validStatuses = ['active', 'trialing'];
  if (!validStatuses.includes(status)) {
    return false;
  }

  // Check if subscription hasn't expired
  const now = new Date();
  const periodEnd = new Date(currentPeriodEnd);
  return periodEnd > now;
}

/**
 * Get effective plan type based on subscription status and expiration
 */
function getEffectivePlanType(
  subscriptionPlan: string | null, 
  usageLimitsPlan: string | null, 
  subscriptionValid: boolean
): 'free' | 'master' | 'warrior' {
  // If subscription is invalid or expired, downgrade to free
  if (!subscriptionValid) {
    return 'free';
  }

  // Use subscription plan if valid, otherwise fallback to usage limits plan
  const planType = subscriptionPlan || usageLimitsPlan || 'free';
  
  // Ensure it's a valid plan type
  if (['master', 'warrior'].includes(planType)) {
    return planType as 'master' | 'warrior';
  }
  
  return 'free';
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
      
      // Enhanced fallback: direct query with subscription validation
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

      // Get subscription info separately
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('plan_type, status, current_period_end')
        .eq('user_id', userId)
        .single();

      // Get subject count separately
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('subject_id')
        .eq('user_id', userId);

      const subjectCount = subjectsData?.length || 0;
      
      // Validate subscription status and expiration
      const subscriptionValid = isSubscriptionValid(
        subscriptionData?.status || 'active',
        subscriptionData?.current_period_end || null
      );
      
      const effectivePlanType = getEffectivePlanType(
        subscriptionData?.plan_type,
        directData.plan_type,
        subscriptionValid
      );

      // Get limits based on effective plan type
      const planLimits = getPlanLimits(effectivePlanType);

      return {
        plan_type: effectivePlanType,
        status: subscriptionData?.status || 'active',
        breakdowns_used: directData.breakdowns_used || 0,
        breakdowns_limit: planLimits.aiBreakdowns,
        subjects_count: subjectCount,
        subjects_limit: planLimits.subjects,
        flashcards_used: directData.flashcards_used || 0,
        flashcards_limit: planLimits.flashcards,
        current_period_end: subscriptionData?.current_period_end || null,
        subscription_active: subscriptionValid,
        subscription_expired: !subscriptionValid && !!subscriptionData?.current_period_end,
        can_create_subjects: subjectCount < planLimits.subjects,
        can_use_ai: (directData.breakdowns_used || 0) < planLimits.aiBreakdowns
      };
    }

    // If RPC function succeeded, validate the returned data
    const planInfo = data?.[0];
    if (!planInfo) return null;

    // Validate subscription status from RPC result
    const subscriptionValid = isSubscriptionValid(
      planInfo.status,
      planInfo.current_period_end
    );

    const effectivePlanType = getEffectivePlanType(
      planInfo.plan_type,
      planInfo.plan_type,
      subscriptionValid
    );

    // Update limits based on effective plan type if subscription is invalid
    if (!subscriptionValid && effectivePlanType === 'free') {
      const freeLimits = getPlanLimits('free');
      return {
        ...planInfo,
        plan_type: 'free',
        breakdowns_limit: freeLimits.aiBreakdowns,
        subjects_limit: freeLimits.subjects,
        flashcards_limit: freeLimits.flashcards,
        subscription_active: false,
        subscription_expired: !!planInfo.current_period_end,
        can_create_subjects: planInfo.subjects_count < freeLimits.subjects,
        can_use_ai: planInfo.breakdowns_used < freeLimits.aiBreakdowns
      };
    }

    return {
      ...planInfo,
      subscription_active: subscriptionValid,
      subscription_expired: !subscriptionValid && !!planInfo.current_period_end
    };
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

    // If subscription is expired/canceled, enforce free plan limits
    if (!planInfo.subscription_active) {
      const freeLimits = getPlanLimits('free');
      return planInfo.subjects_count < freeLimits.subjects;
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
    // First get plan info to validate subscription status
    const planInfo = await getUserPlanInfo(userId);
    if (!planInfo) {
      return {
        allowed: false,
        used: 0,
        limit: 3,
        plan_type: 'free'
      };
    }

    // If subscription is expired/canceled, enforce free plan limits
    const effectivePlanType = planInfo.subscription_active ? planInfo.plan_type : 'free';
    const effectiveLimits = getPlanLimits(effectivePlanType);

    // Use plan info directly instead of RPC call (more reliable)
    const used = planInfo.breakdowns_used || 0;
    const limit = effectiveLimits.aiBreakdowns;
    const allowed = used < limit;

    console.log('AI Breakdown Check:', { used, limit, allowed, effectivePlanType });

    return {
      allowed,
      used,
      limit,
      plan_type: effectivePlanType
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
    // First validate subscription status before allowing usage increment
    const planInfo = await getUserPlanInfo(userId);
    if (!planInfo) {
      console.error('Cannot increment AI usage: Unable to get plan info');
      return false;
    }

    // If subscription is expired/canceled, don't allow usage beyond free limits
    if (!planInfo.subscription_active) {
      const freeLimits = getPlanLimits('free');
      if (planInfo.breakdowns_used >= freeLimits.aiBreakdowns) {
        console.error('Cannot increment AI usage: Subscription expired and free limit reached');
        return false;
      }
    }

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
      
      // Validate against effective limits before incrementing
      const effectiveLimits = planInfo.subscription_active ? 
        getPlanLimits(planInfo.plan_type) : 
        getPlanLimits('free');
      
      if (currentUsed >= effectiveLimits.aiBreakdowns) {
        console.error('Cannot increment AI usage: Limit reached');
        return false;
      }
      
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

/**
 * Check if user's subscription has expired and needs renewal
 */
export async function checkSubscriptionExpiration(userId: string): Promise<{
  expired: boolean;
  daysUntilExpiry: number | null;
  gracePeriodActive: boolean;
}> {
  try {
    const planInfo = await getUserPlanInfo(userId);
    if (!planInfo || !planInfo.current_period_end) {
      return {
        expired: false,
        daysUntilExpiry: null,
        gracePeriodActive: false
      };
    }

    const now = new Date();
    const periodEnd = new Date(planInfo.current_period_end);
    const timeDiff = periodEnd.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Grace period: 3 days after expiration
    const gracePeriodEnd = new Date(periodEnd.getTime() + (3 * 24 * 60 * 60 * 1000));
    const gracePeriodActive = now > periodEnd && now <= gracePeriodEnd;

    return {
      expired: daysUntilExpiry < 0 && !gracePeriodActive,
      daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : null,
      gracePeriodActive
    };
  } catch (error) {
    console.error('Error checking subscription expiration:', error);
    return {
      expired: false,
      daysUntilExpiry: null,
      gracePeriodActive: false
    };
  }
}

/**
 * Get subscription status message for UI display
 */
export function getSubscriptionStatusMessage(planInfo: UserPlanInfo): string {
  if (!planInfo.subscription_active && planInfo.subscription_expired) {
    return 'Your subscription has expired. Please renew to continue using premium features.';
  }
  
  if (!planInfo.subscription_active && planInfo.status === 'canceled') {
    return 'Your subscription has been canceled. You now have access to free plan features only.';
  }
  
  if (planInfo.status === 'past_due') {
    return 'Your payment is past due. Please update your payment method to avoid service interruption.';
  }
  
  if (planInfo.status === 'trialing') {
    return 'You are currently on a free trial. Enjoy your premium features!';
  }
  
  return 'Your subscription is active.';
}