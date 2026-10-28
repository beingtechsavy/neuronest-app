'use client';

import { useState, useEffect } from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { getUserPlanInfo, UserPlanInfo } from '@/lib/subscriptionLimits';
import { useUser } from '@supabase/auth-helpers-react';
import { IconBadge } from '@/components/ui';

export default function PlanBadge() {
  const user = useUser();
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlanInfo = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const info = await getUserPlanInfo(user.id);
        setPlanInfo(info);
      } catch (error) {
        console.error('Failed to load plan info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlanInfo();
  }, [user?.id]);

  if (loading || !planInfo) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[#3F4147] px-2.5 py-1" role="status">
        <span className="sr-only">Loading plan</span>
        <span className="h-2 w-2 rounded-full bg-[#383A40]" aria-hidden="true" />
        <span className="text-xs font-medium text-[#949BA4]">Loading…</span>
      </div>
    );
  }

  const isPro = planInfo.plan_type === 'pro';
  const statusTone = isPro
    ? planInfo.status === 'active'
      ? 'bg-[#23A55A]'
      : 'bg-[#ED4245]'
    : 'bg-[#2DD4BF]';
  const statusLabel = isPro
    ? planInfo.status === 'active'
      ? 'Active'
      : 'Inactive'
    : 'Free';

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 ${
        isPro ? 'border-[#FEE75C]/30 bg-[#FEE75C]/10' : 'border-[#3F4147]'
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${statusTone}`} aria-hidden="true" />
      <IconBadge tone={isPro ? 'warning' : 'brand'} size="sm" className="h-5 w-5 rounded-md">
        {isPro ? <Crown size={11} /> : <Sparkles size={11} />}
      </IconBadge>
      <span className="text-xs font-medium text-[#F2F3F5]">{isPro ? 'Pro' : 'Free'}</span>
      <span className="sr-only">— {statusLabel}</span>
    </div>
  );
}
