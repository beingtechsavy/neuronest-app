'use client';

import { useState, useEffect } from 'react';
import { Crown, Zap, Sparkles } from 'lucide-react';
import { getUserPlanInfo, UserPlanInfo } from '@/lib/subscriptionLimits';
import { useUser } from '@supabase/auth-helpers-react';

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
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-600">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
        <span className="text-slate-400 text-xs font-medium">Loading...</span>
      </div>
    );
  }

  const getPlanIcon = () => {
    switch (planInfo.plan_type) {
      case 'master':
        return <Zap size={12} className="text-purple-400" />;
      case 'warrior':
        return <Crown size={12} className="text-yellow-400" />;
      default:
        return <Sparkles size={12} className="text-blue-400" />;
    }
  };

  const getPlanColor = () => {
    switch (planInfo.plan_type) {
      case 'master':
        return 'border-purple-500/30 bg-purple-500/10';
      case 'warrior':
        return 'border-yellow-500/30 bg-yellow-500/10';
      default:
        return 'border-slate-600 bg-slate-800';
    }
  };

  const getPlanName = () => {
    switch (planInfo.plan_type) {
      case 'master':
        return 'Master';
      case 'warrior':
        return 'Warrior';
      default:
        return 'Free';
    }
  };

  const getStatusColor = () => {
    if (planInfo.plan_type === 'free') return 'bg-blue-400';
    return planInfo.status === 'active' ? 'bg-green-400' : 'bg-red-400';
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getPlanColor()}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
      {getPlanIcon()}
      <span className="text-white text-xs font-medium">{getPlanName()}</span>
    </div>
  );
}