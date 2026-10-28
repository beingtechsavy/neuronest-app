'use client';

import { useState } from 'react';
import { Crown, Zap, Sparkles, ArrowRight } from 'lucide-react';
import { UserPlanInfo, formatPlanName } from '@/lib/subscriptionLimits';
import { Button, CardInset, IconBadge, Modal, ModalActions } from '@/components/ui';

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
        return <Sparkles size={18} aria-hidden="true" />;
      case 'ai':
        return <Zap size={18} aria-hidden="true" />;
      case 'flashcards':
        return <Crown size={18} aria-hidden="true" />;
      default:
        return <Sparkles size={18} aria-hidden="true" />;
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <IconBadge tone="brand" size="sm">
            {getIcon()}
          </IconBadge>
          {getTitle()}
        </span>
      }
      description={getCurrentUsage()}
    >
      <p className="mb-6 text-sm leading-relaxed text-[#DBDEE1]">{getDescription()}</p>

      <CardInset className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#F2F3F5]">Current plan</p>
          <p className="text-sm text-[#949BA4]">{formatPlanName(planInfo.plan_type)}</p>
        </div>
        <p className="text-right text-sm font-semibold text-[#F2F3F5] tabular-nums">
          {limitType === 'subjects' && `${planInfo.subjects_limit} projects`}
          {limitType === 'ai' && `${planInfo.breakdowns_limit}/day`}
          {limitType === 'flashcards' && `${planInfo.flashcards_limit}/day`}
        </p>
      </CardInset>

      {upgradeOptions && upgradeOptions.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-[#F2F3F5]">What Pro adds</h3>
          <ul className="space-y-2">
            {upgradeOptions.map((option) => (
              <li key={option.name}>
                <button
                  type="button"
                  onClick={() => {
                    onUpgrade?.();
                    onClose();
                  }}
                  className={
                    option.popular
                      ? 'flex w-full items-center justify-between gap-4 rounded-xl border border-[#14B8A6]/50 bg-[#14B8A6]/10 p-4 text-left transition-colors hover:bg-[#14B8A6]/15'
                      : 'flex w-full items-center justify-between gap-4 rounded-xl border border-[#3F4147] p-4 text-left transition-colors hover:border-[#6E747B]'
                  }
                >
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#F2F3F5]">{option.name}</span>
                      {option.popular && (
                        <span className="rounded-md bg-[#0D9488] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#F2F3F5]">
                          Recommended
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-sm text-[#949BA4]">{option.benefits}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold text-[#F2F3F5] tabular-nums">{option.price}</span>
                    <ArrowRight size={16} className="text-[#949BA4]" aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ModalActions>
        <Button variant="secondary" onClick={onClose}>
          {limitType === 'ai' ? 'Try tomorrow' : 'Maybe later'}
        </Button>
        {upgradeOptions && upgradeOptions.length > 0 && (
          <Button
            onClick={() => {
              onUpgrade?.();
              onClose();
            }}
          >
            Upgrade now
          </Button>
        )}
      </ModalActions>

      {limitType === 'ai' && (
        <p className="mt-4 text-center text-xs text-[#949BA4]">
          Your AI breakdown limit resets daily at midnight.
        </p>
      )}
    </Modal>
  );
}
