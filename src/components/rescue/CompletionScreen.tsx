'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { RescueAction } from '@/types/rescue';
import { Button, Card, CardInset, IconBadge, Textarea } from '@/components/ui';

interface CompletionScreenProps {
  action: RescueAction;
  completedAction: boolean;
  onSave: () => void;
  onNextStep: () => void;
  onFinish: () => void;
  generating: boolean;
}

export default function CompletionScreen({
  action,
  completedAction,
  onSave,
  onNextStep,
  onFinish,
  generating,
}: CompletionScreenProps) {
  const shouldReduceMotion = useReducedMotion();
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');

  async function sendFeedback(value: boolean) {
    setHelpful(value);
    setFeedbackSent(true);
    await fetch('/api/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ helpful: value, comment: comment || undefined }),
    }).catch(() => undefined);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Card className="mx-auto w-full max-w-md text-center">
        {/* Fade-only: the 0.96→1 scale was the only remaining scale animation in
            the rescue flow, and the reduced-motion branch still changed opacity. */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' }}
          className="mx-auto mb-5 flex justify-center"
        >
          <IconBadge tone="success" size="lg">
            <Sparkles size={22} aria-hidden="true" />
          </IconBadge>
        </motion.div>

        <h2 className="mb-2 text-2xl font-bold tracking-tight text-[#F2F3F5] sm:text-3xl">
          {completedAction ? 'That step is done.' : 'You created some movement.'}
        </h2>
        <p className="mb-6 text-base leading-relaxed text-[#949BA4]">
          {completedAction
            ? 'Keep the same task open and build on what you just finished.'
            : 'You showed up. That is the hardest part.'}
        </p>

        <CardInset className="my-6 text-left">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2DD4BF]">
            Your step was
          </p>
          <p className="break-words font-medium text-[#F2F3F5]">
            {action.text}
          </p>
        </CardInset>

        <CardInset className="mb-6 text-left">
          <p className="mb-3 text-center text-sm font-medium text-[#DBDEE1]">Did this help you begin?</p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => sendFeedback(true)}
              aria-pressed={helpful === true}
              className={helpful === true ? 'border-[#23A55A] bg-[#23A55A]/15 text-[#23A55A]' : ''}
            >
              Yes
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => sendFeedback(false)}
              aria-pressed={helpful === false}
              className={helpful === false ? 'border-[#E8A33D] bg-[#E8A33D]/15 text-[#F0B232]' : ''}
            >
              Not yet
            </Button>
          </div>
          {feedbackSent && (
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="Optional: what would have helped?"
              aria-label="Optional feedback"
              containerClassName="mt-3"
            />
          )}
        </CardInset>

        <div className="w-full space-y-3">
          {completedAction && (
            <Button size="lg" fullWidth onClick={onNextStep} disabled={generating}>
              <ArrowRight size={20} aria-hidden="true" />
              {generating ? 'Finding the next step…' : 'Continue this task'}
            </Button>
          )}
          <Button variant="secondary" fullWidth onClick={onSave}>
            Save this session
          </Button>
          <Button variant="ghost" fullWidth onClick={onFinish}>
            I&apos;m done for now
          </Button>
        </div>
      </Card>
    </div>
  );
}
