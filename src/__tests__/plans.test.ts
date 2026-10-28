import { describe, expect, it } from 'vitest';
import { effectivePlan, PLAN_LIMITS } from '@/lib/plans';

describe('plan entitlements', () => {
  it('defaults missing and invalid subscriptions to free', () => {
    expect(effectivePlan(null)).toBe('free');
    expect(effectivePlan({ plan_type: 'pro', status: 'canceled' })).toBe('free');
    expect(effectivePlan({ plan_type: 'pro', status: 'active', current_period_end: '2020-01-01T00:00:00Z' })).toBe('free');
  });

  it('only grants Pro while an active period is valid', () => {
    expect(effectivePlan({ plan_type: 'pro', status: 'active', current_period_end: '2099-01-01T00:00:00Z' })).toBe('pro');
    expect(PLAN_LIMITS.pro.monthlyBreakdowns).toBeGreaterThan(PLAN_LIMITS.free.monthlyBreakdowns);
  });
});
