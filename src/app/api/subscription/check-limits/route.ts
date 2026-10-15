import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { getServerPlanInfo } from '@/lib/serverPlan';
import { canUseAIBreakdownServer } from '@/lib/subscriptionLimitsServer';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { limitType } = await request.json();
    if (!['subjects', 'ai', 'flashcards'].includes(limitType)) return NextResponse.json({ error: 'Invalid limit type' }, { status: 400 });
    const info = await getServerPlanInfo(user.id);
    const allowance = await canUseAIBreakdownServer(user.id);
    const planInfo = {
      plan_type: info.plan, status: info.subscription?.status || 'free',
      breakdowns_used: allowance.used, breakdowns_limit: allowance.limit,
      monthly_used: allowance.monthly_used, monthly_limit: allowance.monthly_limit,
      subjects_count: info.subjectsCount, subjects_limit: info.limits.subjects,
      flashcards_used: 0, flashcards_limit: 0,
      current_period_end: info.subscription?.current_period_end || null,
      can_create_subjects: info.subjectsCount < info.limits.subjects, can_use_ai: allowance.allowed,
      subscription_active: info.plan === 'pro', subscription_expired: info.subscription?.plan_type === 'pro' && info.plan !== 'pro',
    };
    return NextResponse.json({ success: true, planInfo, planType: info.plan,
      canUse: limitType === 'ai' ? allowance.allowed : limitType === 'subjects' ? planInfo.can_create_subjects : false,
      used: limitType === 'ai' ? allowance.used : info.subjectsCount,
      limit: limitType === 'ai' ? allowance.limit : info.limits.subjects });
  } catch { return NextResponse.json({ error: 'Unable to load allowance' }, { status: 503 }); }
}
