import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { getUserPlanInfo, UserPlanInfo } from '@/lib/subscriptionLimits';

export function usePlanInfo() {
  const user = useUser();
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPlanInfo = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const info = await getUserPlanInfo(user.id);
      setPlanInfo(info);
    } catch (err) {
      console.error('Failed to load plan info:', err);
      setError(err instanceof Error ? err.message : 'Failed to load plan info');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshPlanInfo();
  }, [refreshPlanInfo]);

  return {
    planInfo,
    loading,
    error,
    refreshPlanInfo
  };
}