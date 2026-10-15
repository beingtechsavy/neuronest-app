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
  const styles: Record<string, string> = {
    breakdown: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    inbox: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    completed: 'bg-green-500/10 text-green-400 border-green-500/30',
  };
  
  const labels: Record<string, string> = {
    breakdown: 'Breakdown',
    inbox: 'Inbox',
    scheduled: 'Scheduled',
    completed: 'Completed',
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[taskStatus]}`}>
      {labels[taskStatus]}
    </span>
  );
};

// --- MAIN COMPONENT ---
export default function TaskItem({ task, onEdit, onDelete }: TaskItemProps) {
  const subject = task.chapters?.[0]?.subjects?.[0];
  const subjectColor = subject?.color || '#6366f1';
  const subjectTitle = subject?.title || 'No Project';
  const isOverdue = task.deadline ? new Date(task.deadline) < new Date() : false;

  return (
    <div className="group relative flex items-center justify-between gap-3 rounded-lg border-l-4 bg-slate-800 p-4 transition-colors hover:bg-slate-700/50" style={{ borderLeftColor: subjectColor }}>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="break-words font-semibold text-white">{task.title}</p>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Tag size={14} style={{ color: subjectColor }} />
            <span>{subjectTitle}</span>
          </div>
          {task.deadline && (
            <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-400' : ''}`}>
              <Calendar size={14} />
              <span>{new Date(task.deadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <StatusBadge taskStatus={task.task_status} />
        <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <button type="button" onClick={() => onEdit(task)} className="flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-600 hover:text-white" aria-label={`Edit ${task.title}`}>
            <Edit size={16} />
          </button>
          <button type="button" onClick={() => onDelete(task)} className="flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-600 hover:text-red-400" aria-label={`Delete ${task.title}`}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
