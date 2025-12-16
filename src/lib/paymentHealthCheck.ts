/**
 * Payment System Health Check
 * Ensures payment database consistency and prevents crashes
 */

import { supabase } from './supabaseClient';
import type { UsageLimits, Subscription, PlanType } from '@/types/payment';

// ============================================================================
// HEALTH CHECK FUNCTIONS
// ============================================================================

export interface HealthCheckResult {
  isHealthy: boolean;
  issues: string[];
  fixes: string[];
}

/**
 * Check if user has all required payment-related records
 */
export async function checkUserPaymentHealth(userId: string): Promise<HealthCheckResult> {
  const issues: string[] = [];
  const fixes: string[] = [];

  try {
    // Check usage_limits record
    const { data: usageLimits, error: usageError } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (usageError || !usageLimits) {
      issues.push('Missing usage_limits record');
      fixes.push('Creating default usage_limits record');

      await supabase.from('usage_limits').upsert({
        user_id: userId,
        plan_type: 'free',
        breakdowns_used: 0,
        breakdowns_limit: 3,
        flashcards_used: 0,
        flashcards_limit: 0,
        subjects_limit: 3,
        reset_date: new Date().toISOString().split('T')[0],
      });
    }

    // Check subscription record (optional, but create if missing for paid users)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If user has paid plan but no subscription record, create one
    if (usageLimits?.plan_type !== 'free' && !subscription) {
      issues.push('Paid plan without subscription record');
      fixes.push('Creating subscription record');

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        plan_type: usageLimits.plan_type,
        status: 'active',
        currency: 'INR',
        cancel_at_period_end: false,
      });
    }

    // Check user_preferences record
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefError || !preferences) {
      issues.push('Missing user_preferences record');
      fixes.push('Creating default user_preferences record');

      await supabase.from('user_preferences').upsert({
        user_id: userId,
        sleep_start: '23:00',
        sleep_end: '07:00',
        meal_start_times: ['08:00', '13:00', '19:00'],
        meal_duration: 60,
        session_length: 50,
        buffer_length: 10,
      });
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      fixes,
    };

  } catch (error) {
    console.error('Payment health check failed:', error);
    return {
      isHealthy: false,
      issues: ['Health check failed'],
      fixes: ['Manual intervention required'],
    };
  }
}

/**
 * Validate plan limits and usage
 */
export function validatePlanLimits(planType: PlanType): Partial<UsageLimits> {
  const limits: Record<PlanType, Partial<UsageLimits>> = {
    free: {
      breakdowns_limit: 3,
      flashcards_limit: 0,
      subjects_limit: 3,
    },
    master: {
      breakdowns_limit: 10,
      flashcards_limit: 20,
      subjects_limit: 15,
    },
    warrior: {
      breakdowns_limit: 25,
      flashcards_limit: 50,
      subjects_limit: 999,
    },
  };

  return limits[planType] || limits.free;
}

/**
 * Check if user can perform an action based on their plan limits
 */
export async function checkUsageLimit(
  userId: string,
  action: 'breakdown' | 'flashcard' | 'subject'
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  try {
    const { data: usage } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!usage) {
      // Create default limits if missing
      await checkUserPaymentHealth(userId);
      return { allowed: false, remaining: 0, limit: 0 };
    }

    let used: number;
    let limit: number;

    switch (action) {
      case 'breakdown':
        used = usage.breakdowns_used || 0;
        limit = usage.breakdowns_limit || 0;
        break;
      case 'flashcard':
        used = usage.flashcards_used || 0;
        limit = usage.flashcards_limit || 0;
        break;
      case 'subject':
        // For subjects, we need to count existing subjects
        const { count } = await supabase
          .from('subjects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        used = count || 0;
        limit = usage.subjects_limit || 0;
        break;
      default:
        return { allowed: false, remaining: 0, limit: 0 };
    }

    const remaining = Math.max(0, limit - used);
    const allowed = remaining > 0;

    return { allowed, remaining, limit };

  } catch (error) {
    console.error('Usage limit check failed:', error);
    return { allowed: false, remaining: 0, limit: 0 };
  }
}

/**
 * Increment usage counter for an action
 */
export async function incrementUsage(
  userId: string,
  action: 'breakdown' | 'flashcard'
): Promise<boolean> {
  try {
    const field = action === 'breakdown' ? 'breakdowns_used' : 'flashcards_used';

    const { error } = await supabase.rpc('increment_usage', {
      user_id: userId,
      usage_field: field,
    });

    if (error) {
      // Fallback to manual increment
      const { data: current } = await supabase
        .from('usage_limits')
        .select(field)
        .eq('user_id', userId)
        .single();

      if (current) {
        await supabase
          .from('usage_limits')
          .update({ [field]: ((current as any)[field] || 0) + 1 })
          .eq('user_id', userId);
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to increment usage:', error);
    return false;
  }
}

/**
 * Reset monthly usage counters (called by cron job)
 */
export async function resetMonthlyUsage(): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    await supabase
      .from('usage_limits')
      .update({
        breakdowns_used: 0,
        flashcards_used: 0,
        reset_date: today,
      })
      .lt('reset_date', today);

  } catch (error) {
    console.error('Failed to reset monthly usage:', error);
  }
}

/**
 * Check if yearly subscription is still valid
 */
export async function checkYearlySubscription(userId: string): Promise<{
  isValid: boolean;
  expiresAt?: string;
  daysRemaining?: number;
}> {
  try {
    const { data: usage } = await supabase
      .from('usage_limits')
      .select('yearly_expires_at, yearly_payment_id')
      .eq('user_id', userId)
      .single();

    if (!usage?.yearly_expires_at || !usage.yearly_payment_id) {
      return { isValid: false };
    }

    const expiresAt = new Date(usage.yearly_expires_at);
    const now = new Date();
    const isValid = expiresAt > now;
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isValid,
      expiresAt: usage.yearly_expires_at,
      daysRemaining: Math.max(0, daysRemaining),
    };

  } catch (error) {
    console.error('Failed to check yearly subscription:', error);
    return { isValid: false };
  }
}

/**
 * Comprehensive system health check
 */
export async function runSystemHealthCheck(): Promise<{
  database: boolean;
  payment: boolean;
  auth: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  let database = true;
  let payment = true;
  let auth = true;

  try {
    // Test database connection
    const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
    if (dbError) {
      database = false;
      issues.push('Database connection failed');
    }

    // Test auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      auth = false;
      issues.push('Auth service unavailable');
    }

    // Test payment tables
    const { error: paymentError } = await supabase.from('usage_limits').select('user_id').limit(1);
    if (paymentError) {
      payment = false;
      issues.push('Payment system unavailable');
    }

  } catch (error) {
    issues.push('System health check failed');
    database = false;
    payment = false;
    auth = false;
  }

  return { database, payment, auth, issues };
}