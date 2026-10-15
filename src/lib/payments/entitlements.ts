import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type PaymentEventStatus = 'active' | 'past_due' | 'canceled' | 'expired';

export function getAdminSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function upsertProEntitlement(
  supabase: SupabaseClient,
  values: {
    userId: string;
    providerPaymentId?: string | null;
    providerOrderId?: string | null;
    providerSubscriptionId?: string | null;
    status: PaymentEventStatus;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  },
) {
  const isPro = values.status === 'active' || values.status === 'past_due';
  const { error } = await supabase.from('subscriptions').upsert({
    user_id: values.userId,
    provider: 'razorpay',
    provider_customer_id: null,
    provider_subscription_id: values.providerSubscriptionId || null,
    provider_payment_id: values.providerPaymentId || null,
    provider_order_id: values.providerOrderId || null,
    plan_type: isPro ? 'pro' : 'free',
    status: values.status,
    current_period_end: values.currentPeriodEnd || null,
    cancel_at_period_end: Boolean(values.cancelAtPeriodEnd),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw error;

  const limits = isPro
    ? { plan_type: 'pro', breakdowns_limit: 20, subjects_limit: 999999 }
    : { plan_type: 'free', breakdowns_limit: 3, subjects_limit: 3 };
  await supabase.from('usage_limits').upsert({
    user_id: values.userId,
    ...limits,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}
