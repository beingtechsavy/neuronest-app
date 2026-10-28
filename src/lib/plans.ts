export type PlanType = 'free' | 'pro';
export const PLAN_LIMITS = {
  free: {
    subjects: 3, aiBreakdowns: 3, monthlyBreakdowns: 60, flashcards: 0,
    features: ['Unlimited Rescue sessions', 'Local Rescue history', 'Basic focus timer', '3 AI breakdowns/day, 60/month', 'Inbox task capture'],
  },
  pro: {
    subjects: 999999, aiBreakdowns: 20, monthlyBreakdowns: 300, flashcards: 0,
    features: ['Everything in Free', 'Cloud Rescue history and resume', '20 AI breakdowns/day, 300/month', 'Rescue preferences and reminders', 'Real weekly insights', 'Priority support'],
  },
} as const;

export function effectivePlan(subscription: { plan_type?: string; status?: string; current_period_end?: string | null } | null, now = Date.now()): PlanType {
  if (subscription?.plan_type !== 'pro' || !['active', 'trialing'].includes(subscription.status || '')) return 'free';
  if (!subscription.current_period_end || new Date(subscription.current_period_end).getTime() <= now) return 'free';
  return 'pro';
}
