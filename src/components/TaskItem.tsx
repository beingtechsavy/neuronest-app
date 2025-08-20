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
const StatusBadge = ({ status }: { status: string }) => {
  // --- FIX IS HERE ---
  // We've explicitly typed the 'styles' object to tell TypeScript
  // that it can be indexed by any string. This resolves the error.
  const styles: { [key: string]: string } = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    Scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    completed: 'bg-green-500/10 text-green-400 border-green-500/30',
  };
  const text = status === 'pending' ? 'Inbox' : status;
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status] || 'bg-slate-600'}`}>
      {text}
    </span>
  );
};

// --- MAIN COMPONENT ---
export default function TaskItem({ task, onEdit, onDelete }: TaskItemProps) {
  const subject = task.chapters?.[0]?.subjects?.[0];
  const subjectColor = subject?.color || '#6366f1';
  const subjectTitle = subject?.title || 'No Subject';
  const isOverdue = task.deadline ? new Date(task.deadline) < new Date() : false;

  return (
    <div className="group relative flex items-center justify-between p-4 bg-slate-800 rounded-lg border-l-4 transition-colors hover:bg-slate-700/50" style={{ borderLeftColor: subjectColor }}>
      <div className="flex flex-col gap-2">
        <p className="font-semibold text-white">{task.title}</p>
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
      <div className="flex items-center gap-4">
        <StatusBadge status={task.status} />
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button onClick={() => onEdit(task)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-md"><Edit size={16} /></button>
          <button onClick={() => onDelete(task)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded-md"><Trash2 size={16} /></button>
        </div>
      </div>
    </div>
  );
}
