'use client';

import React, { useState, useCallback } from 'react';
import { Button, Card, Textarea } from '@/components/ui';

interface TaskEntryProps {
  initialText?: string;
  onSubmit: (taskText: string) => void;
}

const MAX_TASK_LENGTH = 200;

export default function TaskEntry({ initialText = '', onSubmit }: TaskEntryProps) {
  const [text, setText] = useState(initialText);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || submitted) return;
      setSubmitted(true);
      onSubmit(trimmed);
    },
    [text, submitted, onSubmit]
  );

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <Card className="mx-auto w-full max-w-md">
        <h1 className="mb-3 text-center text-2xl font-bold tracking-tight text-[#F2F3F5] sm:text-3xl">
          What are you trying to start?
        </h1>
        <p className="mb-6 text-center text-sm leading-relaxed text-[#949BA4] sm:text-base">
          Describe the task you&apos;re stuck on. No need for details — just name it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Finish my assignment, clean the kitchen, reply to that email…"
              maxLength={MAX_TASK_LENGTH}
              rows={3}
              className="resize-none pb-8"
              aria-label="Describe the task you're trying to start"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="pointer-events-none absolute bottom-3 right-3 text-xs tabular-nums text-[#6E747B]">
              {text.length}/{MAX_TASK_LENGTH}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={!text.trim() || submitted}
          >
            {submitted ? 'Thinking…' : "Let's figure this out"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
