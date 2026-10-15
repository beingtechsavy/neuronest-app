'use client';

import { useState } from 'react';
import { X, Crown, Zap, Sparkles, ArrowRight } from 'lucide-react';
import { UserPlanInfo, formatPlanName } from '@/lib/subscriptionLimits';

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  planInfo: UserPlanInfo;
  limitType: 'subjects' | 'ai' | 'flashcards'; // internal key stays 'subjects' for DB compat
  onUpgrade?: () => void;
}

export default function UsageLimitModal({
  isOpen,
  onClose,
  planInfo,
  limitType,
  onUpgrade
}: UsageLimitModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (limitType) {
      case 'subjects':
        return <Sparkles className="w-12 h-12 text-blue-400" />;
      case 'ai':
        return <Zap className="w-12 h-12 text-purple-400" />;
      case 'flashcards':
        return <Crown className="w-12 h-12 text-yellow-400" />;
      default:
        return <Sparkles className="w-12 h-12 text-blue-400" />;
    }
  };

  const getTitle = () => {
    switch (limitType) {
      case 'subjects':
        return 'Project Limit Reached';
      case 'ai':
        return 'AI Breakdown Limit Reached';
      case 'flashcards':
        return 'Flashcards Not Available';
      default:
        return 'Limit Reached';
    }
  };

  const getCurrentUsage = () => {
    switch (limitType) {
      case 'subjects':
        return `${planInfo.subjects_count}/${planInfo.subjects_limit} projects used`;
      case 'ai':
        return `${planInfo.breakdowns_used}/${planInfo.breakdowns_limit} AI breakdowns used today`;
      case 'flashcards':
        return `${planInfo.flashcards_used}/${planInfo.flashcards_limit} flashcards used today`;
      default:
        return '';
    }
  };

  const getDescription = () => {
    switch (limitType) {
      case 'subjects':
        return `You've reached your ${formatPlanName(planInfo.plan_type)} plan limit of ${planInfo.subjects_limit} projects. Upgrade to create more projects and organize your work better.`;
      case 'ai':
        return `You've used all ${planInfo.breakdowns_limit} AI breakdowns for today on your ${formatPlanName(planInfo.plan_type)} plan. Your limit will reset tomorrow, or upgrade for more daily breakdowns.`;
      case 'flashcards':
        return `AI flashcard generation is not currently available on the ${formatPlanName(planInfo.plan_type)} plan.`;
      default:
        return '';
    }
  };

  const getUpgradeOptions = () => {
    const currentPlan = planInfo.plan_type;
    
    if (currentPlan === 'pro') {
      return null; // Already on highest plan
    }

    const options = [];
    
    options.push({
      name: 'Pro',
      price: '₹299/month',
      benefits: limitType === 'subjects' ? 'Unlimited projects' :
               limitType === 'ai' ? '20 AI breakdowns/day' :
               'Cloud Rescue history',
      popular: true
    });

    return options;
  };

  const upgradeOptions = getUpgradeOptions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 p-5 sm:p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {getIcon()}
            <div>
              <h2 className="text-2xl font-bold text-white">{getTitle()}</h2>
              <p className="text-slate-400 text-sm">{getCurrentUsage()}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            aria-label="Close usage limit dialog"
          >
            <X size={24} />
          </button>
        </div>

        {/* Description */}
        <div className="mb-8">
          <p className="text-slate-300 leading-relaxed">
            {getDescription()}
          </p>
        </div>

        {/* Current Plan Status */}
        <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white font-semibold">Current Plan</p>
              <p className="text-slate-400 text-sm">{formatPlanName(planInfo.plan_type)}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">
                {limitType === 'subjects' && `${planInfo.subjects_limit} projects`}
                {limitType === 'ai' && `${planInfo.breakdowns_limit}/day AI breakdowns`}
                {limitType === 'flashcards' && `${planInfo.flashcards_limit}/day flashcards`}
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade Options */}
        {upgradeOptions && upgradeOptions.length > 0 && (
          <div className="space-y-3 mb-6">
            <h3 className="text-white font-semibold">Upgrade Options</h3>
            {upgradeOptions.map((option) => (
              <div
                key={option.name}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  option.popular
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
                onClick={() => {
                  onUpgrade?.();
                  onClose();
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold">{option.name}</p>
                      {option.popular && (
                        <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{option.benefits}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{option.price}</p>
                    <ArrowRight size={16} className="text-slate-400 ml-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onClose}
            className="min-h-11 flex-1 rounded-lg bg-slate-700 px-4 py-3 text-white transition-colors hover:bg-slate-600"
          >
            {limitType === 'ai' ? 'Try Tomorrow' : 'Maybe Later'}
          </button>
          {upgradeOptions && upgradeOptions.length > 0 && (
            <button
              onClick={() => {
                onUpgrade?.();
                onClose();
              }}
              className="min-h-11 flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 font-semibold text-white transition-all hover:from-purple-700 hover:to-blue-700"
            >
              Upgrade Now
            </button>
          )}
        </div>

        {/* Reset Info for AI */}
        {limitType === 'ai' && (
          <div className="mt-4 text-center">
            <p className="text-slate-400 text-xs">
              Your AI breakdown limit resets daily at midnight
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
