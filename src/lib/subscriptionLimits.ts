import { supabase } from './supabaseClient';
import { effectivePlan } from './plans';

export type PlanType = 'free' | 'pro';
export type LimitFeature = 'subjects' | 'ai' | 'flashcards';

export interface UserPlanInfo {
  plan_type: PlanType;
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
  plan_type: PlanType;
}

const PLAN_LIMITS: Record<PlanType, {
  subjects: number;
  aiBreakdowns: number;
  flashcards: number;
  features: string[];
}> = {
  free: {
    subjects: 3,
    aiBreakdowns: 3,
    flashcards: 0,
    features: [
      'Unlimited Rescue sessions',
      'Local Rescue history',
      'Basic adaptation and focus timer',
      '3 AI breakdowns per day',
      'Inbox task capture',
    ],
  },
  pro: {
    subjects: 999999,
    aiBreakdowns: 20,
    flashcards: 0,
    features: [
      'Everything in Free',
      'Cloud Rescue history',
      'Cross-device resume',
      '20 AI breakdowns per day with fair-use limits',
      'Personalized preferences and reminders',
      'Real weekly insights and priority support',
    ],
  },
};

function getPlanType(value: unknown): PlanType {
  return value === 'pro' ? 'pro' : 'free';
}

function isSubscriptionValid(status: string | null | undefined, currentPeriodEnd: string | null | undefined): boolean {
  if (!status || status === 'free') return false;
  if (!['active', 'trialing'].includes(status)) return false;
  if (!currentPeriodEnd) return true;
  return new Date(currentPeriodEnd).getTime() > Date.now();
}

export function getPlanLimits(planType: PlanType | string) {
  return PLAN_LIMITS[getPlanType(planType)];
}

export function formatPlanName(planType: string): string {
  return getPlanType(planType) === 'pro' ? 'Pro' : 'Free';
}

export function getUpgradeMessage(planType: string, feature: LimitFeature): string {
  if (getPlanType(planType) === 'pro') return 'You are on Pro with fair-use access to this feature.';
  if (feature === 'ai') return 'Upgrade to Pro for more AI breakdowns and cloud continuity.';
  if (feature === 'subjects') return 'Upgrade to Pro for unlimited projects.';
  return 'This feature is not currently available on the Free plan.';
}

function emptyPlanInfo(): UserPlanInfo {
  const limits = PLAN_LIMITS.free;
  return {
    plan_type: 'free',
    status: 'free',
    breakdowns_used: 0,
    breakdowns_limit: limits.aiBreakdowns,
    subjects_count: 0,
    subjects_limit: limits.subjects,
    flashcards_used: 0,
    flashcards_limit: limits.flashcards,
    current_period_end: null,
    can_create_subjects: true,
    can_use_ai: true,
    subscription_active: false,
    subscription_expired: false,
  };
}

/**
 * Read-only client display data. Server routes use the server-side entitlement
 * helper and never trust this value for authorization.
 */
export async function getUserPlanInfo(userId: string): Promise<UserPlanInfo | null> {
  try {
    const [{ data: usage }, { data: subscription }, { data: subjects }] = await Promise.all([
      supabase
        .from('usage_limits')
        .select('breakdowns_used, flashcards_used, reset_date')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('subscriptions')
        .select('plan_type, status, current_period_end, cancel_at_period_end')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase.from('subjects').select('subject_id').eq('user_id', userId),
    ]);

    const planType = effectivePlan(subscription);
    const active = planType === 'pro';
    const limits = PLAN_LIMITS[planType];
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const used = usage?.reset_date === today ? Number(usage?.breakdowns_used || 0) : 0;
    const subjectCount = subjects?.length || 0;

    return {
      plan_type: planType,
      status: subscription?.status || 'free',
      breakdowns_used: used,
      breakdowns_limit: limits.aiBreakdowns,
      subjects_count: subjectCount,
      subjects_limit: limits.subjects,
      flashcards_used: Number(usage?.flashcards_used || 0),
      flashcards_limit: limits.flashcards,
      current_period_end: subscription?.current_period_end || null,
      can_create_subjects: subjectCount < limits.subjects,
      can_use_ai: used < limits.aiBreakdowns,
      subscription_active: active,
      subscription_expired: planType === 'pro' && !active,
    };
  } catch (error) {
    console.error('Error fetching user plan info:', error);
    return null;
  }
}

export async function canCreateSubject(userId: string): Promise<boolean> {
  const planInfo = await getUserPlanInfo(userId);
  return Boolean(planInfo?.can_create_subjects);
}

export async function canUseAIBreakdown(userId: string): Promise<UsageCheckResult> {
  const planInfo = await getUserPlanInfo(userId);
  if (!planInfo) return { allowed: false, used: 0, limit: PLAN_LIMITS.free.aiBreakdowns, plan_type: 'free' };
  return {
    allowed: planInfo.can_use_ai,
    used: planInfo.breakdowns_used,
    limit: planInfo.breakdowns_limit,
    plan_type: planInfo.plan_type,
  };
}

/** Kept for older client callers; authoritative usage is reserved server-side. */
export async function incrementAIUsage(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('increment_ai_usage', { user_uuid: userId });
    return !error && data === true;
  } catch {
    return false;
  }
}

export function needsUpgrade(planInfo: UserPlanInfo, feature: LimitFeature): boolean {
  if (feature === 'subjects') return !planInfo.can_create_subjects;
  if (feature === 'ai') return !planInfo.can_use_ai;
  return planInfo.flashcards_limit === 0;
}

export async function checkSubscriptionExpiration(userId: string): Promise<{
  expired: boolean;
  daysUntilExpiry: number | null;
  gracePeriodActive: boolean;
}> {
  const info = await getUserPlanInfo(userId);
  if (!info?.current_period_end || info.plan_type === 'free') {
    return { expired: false, daysUntilExpiry: null, gracePeriodActive: false };
  }

  const periodEnd = new Date(info.current_period_end).getTime();
  const now = Date.now();
  const days = Math.ceil((periodEnd - now) / 86_400_000);
  const gracePeriodActive = now > periodEnd && now <= periodEnd + 3 * 86_400_000;
  return {
    expired: days < 0 && !gracePeriodActive,
    daysUntilExpiry: days > 0 ? days : null,
    gracePeriodActive,
  };
}

export function getSubscriptionStatusMessage(planInfo: UserPlanInfo): string {
  if (planInfo.subscription_expired) return 'Your Pro subscription has expired. You now have Free plan access.';
  if (planInfo.status === 'past_due') return 'Your payment is past due. Please update your payment method.';
  if (planInfo.status === 'canceled') return 'Your Pro subscription is canceled and will end at the current period end.';
  if (planInfo.plan_type === 'pro') return 'Your Pro subscription is active.';
  return 'You are using the Free plan.';
}
