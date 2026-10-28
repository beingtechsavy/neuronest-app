'use client';

import { ArrowRight, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface BreakdownTask {
  task_id: number;
  title: string;
  difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD';
  estimated_minutes?: number;
  task_status?: 'breakdown' | 'inbox' | 'scheduled' | 'completed';
}

interface BreakdownTaskItemProps {
  task: BreakdownTask;
  onAddToInbox: (taskId: number) => void;
  isLoading?: boolean;
}

// Text labels rather than 🟢🟡🔴: colour-only difficulty is invisible to a
// red-green colour-blind user, and the emoji rendered at three different sizes
// depending on platform.
const difficulty = {
  EASY: { label: 'Easy', className: 'border-[#23A55A]/30 bg-[#23A55A]/10 text-[#23A55A]' },
  MEDIUM: { label: 'Medium', className: 'border-[#E8A33D]/30 bg-[#E8A33D]/10 text-[#E8A33D]' },
  HARD: { label: 'Hard', className: 'border-[#ED4245]/30 bg-[#ED4245]/10 text-[#ED4245]' },
} as const;

export default function BreakdownTaskItem({ task, onAddToInbox, isLoading }: BreakdownTaskItemProps) {
  const badge = task.difficulty_level ? difficulty[task.difficulty_level] : null;

  return (
    <div
      className={cn(
        'relative flex items-center justify-between gap-3 rounded-xl border border-l-2 p-3 transition-colors',
        task.task_status === 'breakdown'
          ? 'border-[#3F4147] border-l-[#14B8A6] bg-[#2B2D31]'
          : 'border-[#3F4147] border-l-[#6E747B] bg-[#1E1F22]',
      )}
    >
      <div className="min-w-0 flex-1">
        {(badge || task.estimated_minutes) && (
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {badge && (
              <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', badge.className)}>
                {badge.label}
              </span>
            )}
            {task.estimated_minutes && (
              <span className="flex items-center gap-1 text-xs text-[#949BA4] tabular-nums">
                <Clock size={11} aria-hidden="true" />
                {task.estimated_minutes} min
              </span>
            )}
          </div>
        )}

        <h4 className="truncate text-sm font-medium leading-relaxed text-[#F2F3F5]">{task.title}</h4>
      </div>

      {task.task_status === 'breakdown' && (
        <button
          type="button"
          onClick={() => onAddToInbox(task.task_id)}
          disabled={isLoading}
          className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg bg-[#0D9488] px-3 text-xs font-semibold text-[#F2F3F5] transition-colors hover:bg-[#14B8A6] active:bg-[#0F766E] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E1F22]"
          aria-label={`Add "${task.title}" to your schedule`}
        >
          {isLoading ? (
            <Loader2 size={13} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <>
              <span>{isLoading ? 'Adding' : 'Add'}</span>
              <ArrowRight size={13} aria-hidden="true" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
