'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Zap, BookOpen, CreditCard, Crown, ArrowRight } from 'lucide-react';
import { getUserPlanInfo, UserPlanInfo, formatPlanName, getPlanLimits } from '@/lib/subscriptionLimits';
import { useUser } from '@supabase/auth-helpers-react';

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
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-2/3"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!planInfo) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
        <div className="text-center">
          <p className="text-slate-400">Unable to load usage information</p>
        </div>
      </div>
    );
  }

  const getUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressWidth = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const planLimits = getPlanLimits(planInfo.plan_type);

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-light text-white">Usage & Limits</h2>
            <p className="text-slate-400 text-sm">Track your plan usage</p>
          </div>
        </div>
        
        {/* Current Plan Badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-600">
          {planInfo.plan_type === 'warrior' && <Crown size={16} className="text-yellow-400" />}
          {planInfo.plan_type === 'master' && <Zap size={16} className="text-purple-400" />}
          {planInfo.plan_type === 'free' && <BookOpen size={16} className="text-blue-400" />}
          <span className="text-white font-medium">{formatPlanName(planInfo.plan_type)} Plan</span>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* AI Breakdowns */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">AI Breakdowns</h3>
                <p className="text-slate-400 text-xs">Daily usage</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-lg">
                {planInfo.breakdowns_used}/{planInfo.breakdowns_limit}
              </div>
            </div>
          </div>
          
          <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all ${getUsageColor(planInfo.breakdowns_used, planInfo.breakdowns_limit)}`}
              style={{ width: `${getProgressWidth(planInfo.breakdowns_used, planInfo.breakdowns_limit)}%` }}
            ></div>
          </div>
          
          <p className="text-slate-400 text-xs">
            {planInfo.breakdowns_limit - planInfo.breakdowns_used} remaining today
          </p>
        </div>

        {/* Subjects */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Subjects</h3>
                <p className="text-slate-400 text-xs">Total created</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-lg">
                {planInfo.subjects_count}/{planInfo.subjects_limit === 999999 ? '∞' : planInfo.subjects_limit}
              </div>
            </div>
          </div>
          
          {planInfo.subjects_limit !== 999999 && (
            <>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all ${getUsageColor(planInfo.subjects_count, planInfo.subjects_limit)}`}
                  style={{ width: `${getProgressWidth(planInfo.subjects_count, planInfo.subjects_limit)}%` }}
                ></div>
              </div>
              
              <p className="text-slate-400 text-xs">
                {planInfo.subjects_limit - planInfo.subjects_count} remaining
              </p>
            </>
          )}
          
          {planInfo.subjects_limit === 999999 && (
            <p className="text-green-400 text-xs">Unlimited subjects</p>
          )}
        </div>

        {/* Flashcards */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <CreditCard size={16} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">AI Flashcards</h3>
                <p className="text-slate-400 text-xs">Daily usage</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-lg">
                {planInfo.flashcards_used}/{planInfo.flashcards_limit}
              </div>
            </div>
          </div>
          
          {planInfo.flashcards_limit > 0 ? (
            <>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all ${getUsageColor(planInfo.flashcards_used, planInfo.flashcards_limit)}`}
                  style={{ width: `${getProgressWidth(planInfo.flashcards_used, planInfo.flashcards_limit)}%` }}
                ></div>
              </div>
              
              <p className="text-slate-400 text-xs">
                {planInfo.flashcards_limit - planInfo.flashcards_used} remaining today
              </p>
            </>
          ) : (
            <p className="text-slate-400 text-xs">Not available on {formatPlanName(planInfo.plan_type)} plan</p>
          )}
        </div>
      </div>

      {/* Plan Features */}
      <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 mb-6">
        <h3 className="text-white font-medium mb-4">Your Plan Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {planLimits.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-slate-300 text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Section */}
      {planInfo.plan_type !== 'warrior' && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium mb-2">
                {planInfo.plan_type === 'free' ? 'Ready to upgrade?' : 'Want more features?'}
              </h3>
              <p className="text-slate-300 text-sm">
                {planInfo.plan_type === 'free' 
                  ? 'Get more AI breakdowns, subjects, and premium features'
                  : 'Upgrade to Warrior for unlimited subjects and advanced features'
                }
              </p>
            </div>
            <a
              href="/pricing"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all"
            >
              <span>Upgrade</span>
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      )}

      {/* Billing Info */}
      {planInfo.plan_type !== 'free' && planInfo.current_period_end && (
        <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Next billing date:</span>
            <span className="text-white">
              {new Date(planInfo.current_period_end).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}