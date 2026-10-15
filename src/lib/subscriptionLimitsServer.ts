import { getAdminSupabase } from './payments/entitlements';

export interface UsageCheckResult {
  allowed: boolean; used: number; limit: number; plan_type: string;
  monthly_used?: number; monthly_limit?: number;
}

/** Database transaction reserves usage before any paid model call; fail closed if migration is missing. */
export async function consumeAIBreakdownServer(userId: string): Promise<UsageCheckResult> {
  const client = getAdminSupabase();
  if (!client) throw new Error('Usage service unavailable');
  const { data, error } = await client.rpc('consume_ai_breakdown', { user_uuid: userId });
  if (error || !data?.[0]) throw new Error('Usage service unavailable; apply the launch migration');
  const row = data[0];
  return { allowed: row.allowed, used: row.used, limit: row.usage_limit, plan_type: row.plan_type,
    monthly_used: row.monthly_used, monthly_limit: row.monthly_limit };
}

export async function canUseAIBreakdownServer(userId: string): Promise<UsageCheckResult> {
  const client = getAdminSupabase();
  if (!client) throw new Error('Usage service unavailable');
  const { data, error } = await client.rpc('read_ai_allowance', { user_uuid: userId });
  if (error || !data?.[0]) throw new Error('Usage service unavailable');
  const row = data[0];
  return { allowed: row.allowed, used: row.used, limit: row.usage_limit, plan_type: row.plan_type,
    monthly_used: row.monthly_used, monthly_limit: row.monthly_limit };
}
