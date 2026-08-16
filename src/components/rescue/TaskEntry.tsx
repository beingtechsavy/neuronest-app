'use client';

import React, { useState, useCallback } from 'react';

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3 tracking-tight">
          What are you trying to start?
        </h2>
        <p className="text-slate-400 text-center mb-8 text-sm sm:text-base">
          Describe the task you&apos;re stuck on. No need for details — just name it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Finish my assignment, clean the kitchen, reply to that email..."
              maxLength={MAX_TASK_LENGTH}
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-[16px] text-base"
              aria-label="Describe the task you're trying to start"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="absolute bottom-3 right-3 text-xs text-slate-500">
              {text.length}/{MAX_TASK_LENGTH}
            </div>
          </div>

          <button
            type="submit"
            disabled={!text.trim() || submitted}
            className="w-full min-h-[48px] py-3.5 px-6 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:transform-none text-lg flex items-center justify-center"
          >
            {submitted ? 'Thinking…' : "Let's figure this out"}
          </button>
        </form>
      </div>
    </div>
  );
}