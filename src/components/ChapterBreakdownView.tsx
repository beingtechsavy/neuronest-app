'use client';

import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import BreakdownTaskItem from './BreakdownTaskItem';
import { useToastContext } from './ToastProvider';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabaseClient';
import { Button, CardInset, IconBadge } from '@/components/ui';
import { cn } from '@/lib/cn';

interface BreakdownTask {
  task_id: number;
  title: string;
  difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD';
  estimated_minutes?: number;
  task_status?: 'breakdown' | 'inbox' | 'scheduled' | 'completed';
}

interface Chapter {
  chapter_id: number;
  title: string;
  completed: boolean;
  ai_generated?: boolean;
}

interface ChapterBreakdownViewProps {
  chapter: Chapter;
  tasks: BreakdownTask[];
  onTaskMoved?: () => void;
}

export default function ChapterBreakdownView({
  chapter,
  tasks,
  onTaskMoved
}: ChapterBreakdownViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState<Set<number>>(new Set());
  const { success, error } = useToastContext();
  const user = useUser();

  const breakdownTasks = tasks.filter(t => t.task_status === 'breakdown');
  const inboxTasks = tasks.filter(t => t.task_status === 'inbox');
  const scheduledTasks = tasks.filter(t => t.task_status === 'scheduled');
  const completedTasks = tasks.filter(t => t.task_status === 'completed');

  const handleAddToInbox = async (taskId: number) => {
    if (!user?.id) {
      error('Please log in to move tasks');
      return;
    }

    setLoadingTasks(prev => new Set(prev).add(taskId));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/tasks/move-to-inbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          userId: user.id,
          taskIds: [taskId]
        })
      });

      const result = await response.json();

      if (result.success) {
        success('Added to your schedule.');
        onTaskMoved?.();
      } else {
        error('Failed to add task. Please try again.');
      }
    } catch {
      error('Something went wrong. Please try again.');
    } finally {
      setLoadingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleAddAllToInbox = async () => {
    if (breakdownTasks.length === 0) return;

    if (!user?.id) {
      error('Please log in to move tasks');
      return;
    }

    const taskIds = breakdownTasks.map(t => t.task_id);
    setLoadingTasks(new Set(taskIds));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/tasks/move-to-inbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          userId: user.id,
          taskIds
        })
      });

      const result = await response.json();

      if (result.success) {
        success(`Added ${result.movedTasks} tasks to your schedule.`);
        onTaskMoved?.();
      } else {
        error('Failed to add tasks. Please try again.');
      }
    } catch {
      error('Something went wrong. Please try again.');
    } finally {
      setLoadingTasks(new Set());
    }
  };

  if (!chapter.ai_generated || tasks.length === 0) {
    return null; // Don't show for non-AI chapters or empty chapters
  }

  const total = breakdownTasks.length + inboxTasks.length + scheduledTasks.length + completedTasks.length;
  const progress = total > 0 ? ((inboxTasks.length + scheduledTasks.length + completedTasks.length) / total) * 100 : 0;

  return (
    <CardInset className="overflow-hidden p-0">
      {/* The whole header is one button. It used to be a clickable div with a
          nested button inside it, which is invalid nesting and swallowed the
          "Start project" click on some browsers. */}
      <div className="flex items-center gap-3 p-4 transition-colors hover:bg-[#2B2D31]/50">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
        >
          <IconBadge tone="brand" size="sm">
            <Sparkles size={16} />
          </IconBadge>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-[#F2F3F5]">{chapter.title}</span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
              {breakdownTasks.length > 0 && (
                <span className="font-medium text-[#2DD4BF]">{breakdownTasks.length} ready</span>
              )}
              {inboxTasks.length > 0 && (
                <span className="text-[#E8A33D]">{inboxTasks.length} scheduled</span>
              )}
              {completedTasks.length > 0 && (
                <span className="text-[#23A55A]">{completedTasks.length} done</span>
              )}
            </span>
          </span>
          <span
            className="hidden h-1 w-16 shrink-0 overflow-hidden rounded-full bg-[#383A40] sm:block"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${chapter.title} progress`}
          >
            <span className="block h-full rounded-full bg-[#23A55A]" style={{ width: `${progress}%` }} />
          </span>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={cn('shrink-0 text-[#949BA4] transition-transform duration-150 motion-reduce:transition-none', isExpanded && 'rotate-180')}
          />
        </button>

        {breakdownTasks.length > 0 && (
          <Button
            size="md"
            onClick={handleAddAllToInbox}
            disabled={loadingTasks.size > 0}
            className="shrink-0 text-sm"
          >
            {loadingTasks.size > 0 ? 'Adding…' : 'Start project'}
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3 border-t border-[#3F4147] p-4">
          {breakdownTasks.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#949BA4]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A6]" aria-hidden="true" />
                Ready to schedule ({breakdownTasks.length})
              </h4>
              <div className="space-y-2">
                {breakdownTasks.map(task => (
                  <BreakdownTaskItem
                    key={task.task_id}
                    task={task}
                    onAddToInbox={handleAddToInbox}
                    isLoading={loadingTasks.has(task.task_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {(inboxTasks.length > 0 || scheduledTasks.length > 0 || completedTasks.length > 0) && (
            <dl className="grid grid-cols-3 gap-3 border-t border-[#3F4147] pt-3 text-center">
              {inboxTasks.length > 0 && (
                <div>
                  <dd className="text-base font-bold tabular-nums text-[#E8A33D]">{inboxTasks.length}</dd>
                  <dt className="text-xs text-[#949BA4]">In schedule</dt>
                </div>
              )}
              {scheduledTasks.length > 0 && (
                <div>
                  <dd className="text-base font-bold tabular-nums text-[#23A55A]">{scheduledTasks.length}</dd>
                  <dt className="text-xs text-[#949BA4]">Scheduled</dt>
                </div>
              )}
              {completedTasks.length > 0 && (
                <div>
                  <dd className="text-base font-bold tabular-nums text-[#2DD4BF]">{completedTasks.length}</dd>
                  <dt className="text-xs text-[#949BA4]">Completed</dt>
                </div>
              )}
            </dl>
          )}
        </div>
      )}
    </CardInset>
  );
}
