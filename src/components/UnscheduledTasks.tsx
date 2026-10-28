'use client'

import { useState } from 'react'
import { Wand2, Plus } from 'lucide-react'
import NewTaskModal from './NewTaskModal'
import { Card, IconBadge } from '@/components/ui'

interface UnscheduledTask {
  task_id: number;
  title: string;
  chapters: {
    subjects: {
      title: string;
      color: string;
    } | null;
  } | null;
}

interface UnscheduledTasksProps {
  tasks: UnscheduledTask[];
  onSchedule: () => void;
  onTaskAdded: () => void;
  isScheduling: boolean;
  scheduleMessage: string;
}

const iconButton =
  'flex h-10 w-10 items-center justify-center rounded-lg text-[#949BA4] transition-colors ' +
  'hover:bg-[#383A40] hover:text-[#F2F3F5] focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2B2D31] ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

export default function UnscheduledTasks({ tasks, onSchedule, onTaskAdded, isScheduling, scheduleMessage }: UnscheduledTasksProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskAdded={onTaskAdded}
      />
      <Card className="flex h-full flex-col">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold tracking-tight text-[#F2F3F5]">Task inbox</h2>
            {tasks.length > 0 && (
              <span className="rounded-lg bg-[#383A40] px-2 py-0.5 text-xs font-semibold tabular-nums text-[#DBDEE1]">
                {tasks.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={iconButton}
              aria-label="Add a task"
            >
              <Plus size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onSchedule}
              disabled={isScheduling}
              className={`${iconButton} hover:bg-[#14B8A6]/15 hover:text-[#2DD4BF]`}
              aria-label="Schedule my week"
            >
              <Wand2 size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {scheduleMessage && (
          <p className="mb-4 text-sm text-[#5EEAD4]" role="status" aria-live="polite">
            {scheduleMessage}
          </p>
        )}

        <ul className="-mr-3 flex-grow space-y-2 overflow-y-auto pr-3" aria-label="Unscheduled tasks">
          {tasks.length === 0 ? (
            <li className="pt-8 text-center text-sm text-[#949BA4]">
              Your inbox is clear. Nothing is waiting on you here.
            </li>
          ) : (
            tasks.map(task => (
              <li
                key={task.task_id}
                className="flex items-center gap-2.5 rounded-xl border border-[#3F4147] bg-[#1E1F22] px-3 py-3"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: task.chapters?.subjects?.color || '#14B8A6' }}
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words text-sm text-[#DBDEE1]">{task.title}</span>
              </li>
            ))
          )}
        </ul>
      </Card>
    </>
  );
}
