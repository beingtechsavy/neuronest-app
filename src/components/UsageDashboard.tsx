'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, Zap, BookOpen, CreditCard, Crown, ArrowRight } from 'lucide-react';
import { getUserPlanInfo, UserPlanInfo, formatPlanName, getPlanLimits } from '@/lib/subscriptionLimits';
import { useUser } from '@supabase/auth-helpers-react';
import { Card, CardInset, IconBadge, SectionCard, buttonClass } from '@/components/ui';

type Meter = {
  label: string;
  caption: string;
  used: number;
  limit: number;
  icon: React.ReactNode;
  /** When set, the meter renders a word instead of a bar (e.g. unlimited). */
  note?: string;
};

function usageTone(used: number, limit: number) {
  const percentage = limit > 0 ? (used / limit) * 100 : 0;
  if (percentage >= 100) return { bar: 'bg-[#ED4245]', text: 'text-[#ED4245]' };
  if (percentage >= 80) return { bar: 'bg-[#E8A33D]', text: 'text-[#E8A33D]' };
  return { bar: 'bg-[#23A55A]', text: 'text-[#23A55A]' };
}

function UsageMeter({ label, caption, used, limit, icon, note }: Meter) {
  const hasBar = limit > 0 && limit !== 999999 && !note;
  const width = hasBar ? Math.min((used / limit) * 100, 100) : 0;
  const tone = usageTone(used, limit);
  const remaining = Math.max(0, limit - used);

  return (
    <CardInset>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <IconBadge tone="brand" size="sm">
            {icon}
          </IconBadge>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-[#F2F3F5]">{label}</h3>
            <p className="text-xs text-[#949BA4]">{caption}</p>
          </div>
        </div>
        <p className="shrink-0 text-base font-bold tabular-nums text-[#F2F3F5]">
          {used}/{limit === 999999 ? '∞' : limit}
        </p>
      </div>

      {hasBar ? (
        <>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-[#383A40]"
            role="progressbar"
            aria-valuenow={used}
            aria-valuemin={0}
            aria-valuemax={limit}
            aria-label={`${label} usage`}
          >
            <div className={`h-full rounded-full transition-[width] ${tone.bar}`} style={{ width: `${width}%` }} />
          </div>
          <p className={`mt-2 text-xs tabular-nums ${remaining === 0 ? tone.text : 'text-[#949BA4]'}`}>
            {remaining === 0 ? 'None left' : `${remaining} remaining`}
          </p>
        </>
      ) : (
        <p className="text-xs text-[#23A55A]">{note ?? 'Unlimited'}</p>
      )}
    </CardInset>
  );
}

export default function UsageDashboard() {
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

  if (loading) {
    return (
      <Card>
        <div role="status">
          <span className="sr-only">Loading usage information</span>
          <div className="mb-6 h-6 w-1/3 rounded-lg bg-[#383A40]" />
          <div className="space-y-4">
            <div className="h-4 w-full rounded-lg bg-[#383A40]" />
            <div className="h-4 w-2/3 rounded-lg bg-[#383A40]" />
            <div className="h-4 w-1/2 rounded-lg bg-[#383A40]" />
          </div>
        </div>
      </Card>
    );
  }

  if (!planInfo) {
    return (
      <Card className="text-center">
        <p className="text-[#949BA4]">Unable to load usage information</p>
      </Card>
    );
  }

  const planLimits = getPlanLimits(planInfo.plan_type);
  const isPro = planInfo.plan_type === 'pro';

  return (
    <div className="space-y-6">
      <SectionCard
        title="Usage &amp; limits"
        description="What you have used this period, and what is left."
        icon={<BarChart3 size={18} aria-hidden="true" />}
        actions={
          <span className="flex items-center gap-2 rounded-lg border border-[#3F4147] px-3 py-1.5 text-xs font-medium text-[#F2F3F5]">
            {isPro ? (
              <Crown size={14} className="text-[#FEE75C]" aria-hidden="true" />
            ) : (
              <BookOpen size={14} className="text-[#2DD4BF]" aria-hidden="true" />
            )}
            {formatPlanName(planInfo.plan_type)} plan
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <UsageMeter
            label="AI breakdowns"
            caption="Daily usage"
            used={planInfo.breakdowns_used}
            limit={planInfo.breakdowns_limit}
            icon={<Zap size={16} />}
          />
          <UsageMeter
            label="Projects"
            caption="Total created"
            used={planInfo.subjects_count}
            limit={planInfo.subjects_limit}
            icon={<BookOpen size={16} />}
            note={planInfo.subjects_limit === 999999 ? 'Unlimited projects' : undefined}
          />
          <UsageMeter
            label="AI flashcards"
            caption="Daily usage"
            used={planInfo.flashcards_used}
            limit={planInfo.flashcards_limit}
            icon={<CreditCard size={16} />}
            note={planInfo.flashcards_limit > 0 ? undefined : `Not available on ${formatPlanName(planInfo.plan_type)} plan`}
          />
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#949BA4]">
            What your plan includes
          </h3>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {planLimits.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-[#DBDEE1]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#23A55A]" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {!isPro && (
          <CardInset className="mt-6 flex flex-col gap-4 border-l-2 border-l-[#14B8A6] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="mb-1 text-sm font-semibold text-[#F2F3F5]">
                {planInfo.plan_type === 'free' ? 'Ready to upgrade?' : 'Want more features?'}
              </h3>
              <p className="text-sm leading-relaxed text-[#DBDEE1]">
                Get cloud history, cross-device resume, and more AI breakdowns with Pro.
              </p>
            </div>
            <Link href="/pricing" className={buttonClass({ size: 'md', className: 'shrink-0' })}>
              Upgrade
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </CardInset>
        )}

        {!isPro && planInfo.current_period_end && (
          <p className="mt-4 flex items-center justify-between gap-3 text-sm">
            <span className="text-[#949BA4]">Next billing date</span>
            <span className="tabular-nums text-[#F2F3F5]">
              {new Date(planInfo.current_period_end).toLocaleDateString()}
            </span>
          </p>
        )}
      </SectionCard>
    </div>
  );
}
