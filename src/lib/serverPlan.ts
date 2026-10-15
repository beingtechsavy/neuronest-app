import { getAdminSupabase } from './payments/entitlements';
import { effectivePlan, PLAN_LIMITS } from './plans';

export async function getServerPlanInfo(userId: string) {
  const client = getAdminSupabase();
  if (!client) throw new Error('Database not configured');
  const { data: subscription, error } = await client.from('subscriptions')
    .select('plan_type,status,current_period_end,cancel_at_period_end,provider_subscription_id').eq('user_id', userId).maybeSingle();
  if (error) throw new Error('Unable to verify subscription');
  const plan = effectivePlan(subscription);
  const limits = PLAN_LIMITS[plan];
  const { count, error: countError } = await client.from('subjects').select('subject_id', { count: 'exact', head: true }).eq('user_id', userId);
  if (countError) throw new Error('Unable to load project usage');
  return { plan, limits, subscription, subjectsCount: count || 0 };
}
