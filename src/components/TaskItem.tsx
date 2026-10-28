'use client';

import React from 'react';
import { Task } from '@/types/tasks'; // 1. Import Task from the new central file
import { Edit, Trash2, Calendar, Tag } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

// --- HELPER for Status Badges ---
const StatusBadge = ({ taskStatus }: { taskStatus: 'breakdown' | 'inbox' | 'scheduled' | 'completed' }) => {
  // Inbox is a resting state, not a warning — it gets the neutral grey so the
  // yellow accent stays reserved for things that genuinely need attention.
  const styles: Record<string, string> = {
    breakdown: 'bg-[#14B8A6]/10 text-[#2DD4BF] border-[#14B8A6]/30',
    inbox: 'bg-[#383A40] text-[#DBDEE1] border-[#3F4147]',
    scheduled: 'bg-[#14B8A6]/10 text-[#2DD4BF] border-[#14B8A6]/30',
    completed: 'bg-[#23A55A]/10 text-[#23A55A] border-[#23A55A]/30',
  };

  const labels: Record<string, string> = {
    breakdown: 'Breakdown',
    inbox: 'Inbox',
    scheduled: 'Scheduled',
    completed: 'Completed',
  };

  return (
    <span className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${styles[taskStatus]}`}>
      {labels[taskStatus]}
    </span>
  );
};

// --- MAIN COMPONENT ---
export default function TaskItem({ task, onEdit, onDelete }: TaskItemProps) {
  const subject = task.chapters?.[0]?.subjects?.[0];
  const subjectColor = subject?.color || '#14B8A6';
  const subjectTitle = subject?.title || 'No project';
  const isOverdue = task.deadline ? new Date(task.deadline) < new Date() : false;

  return (
    // Bordered row with a project-colour dot rather than a 4px left rail: the
    // rail read as a status stripe and competed with the real status badge.
    <div className="group relative flex items-center justify-between gap-3 rounded-xl border border-[#383A40] bg-[#2B2D31] p-3.5 transition-colors hover:border-[#3F4147] hover:bg-[#383A40]">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="break-words text-sm font-semibold text-[#F2F3F5]">{task.title}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#949BA4]">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: subjectColor }}
              aria-hidden="true"
            />
            <Tag size={13} aria-hidden="true" />
            {subjectTitle}
          </span>
          {task.deadline && (
            <span className={`flex items-center gap-1.5 ${isOverdue ? 'text-[#FF6B6B]' : ''}`}>
              <Calendar size={13} aria-hidden="true" />
              {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge taskStatus={task.task_status} />
        <div className="flex gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <button type="button" onClick={() => onEdit(task)} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#949BA4] transition-colors hover:bg-[#383A40] hover:text-[#F2F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2B2D31]" aria-label={`Edit ${task.title}`}>
            <Edit size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onDelete(task)} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#949BA4] transition-colors hover:bg-[#ED4245]/10 hover:text-[#FF6B6B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED4245] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2B2D31]" aria-label={`Delete ${task.title}`}>
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
