'use client';

import React from 'react';
import { Tag, Clock, Folder, Edit, Trash2 } from 'lucide-react';
import { Button, Modal } from '@/components/ui';

// --- TYPE DEFINITIONS ---
// It's best practice to move shared types to a central file (e.g., @/types/index.ts)
interface CalendarTask {
  task_id: number;
  title: string;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  effort_units: number | null;
  chapters: {
    title: string;
    subjects: {
      title: string;
      color: string;
    } | null;
  } | null;
  user_id: string;
  chapter_id: number | null;
  deadline: string | null;
  status: string;
  is_stressful: boolean;
  task_status: 'breakdown' | 'inbox' | 'scheduled' | 'completed';
  ai_generated?: boolean;
  difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD';
  estimated_minutes?: number;
  ai_step_order?: number;
  ai_breakdown_id?: number;
  is_critical: boolean;
}

type DetailedTask = CalendarTask & { startTime: Date; endTime: Date; };

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: DetailedTask | null;
  onDelete: (task: CalendarTask) => void;
  onEdit: (task: CalendarTask) => void;
}

// --- MAIN COMPONENT ---
export default function TaskDetailModal({ isOpen, onClose, task, onEdit, onDelete }: TaskDetailModalProps) {
  if (!isOpen || !task) return null;

  // Format time from time string (HH:MM:SS) to display format
  const formatTimeFromString = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Fallback to Date formatting if needed
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    });
  };

  const subjectTitle = task.chapters?.subjects?.title || 'Uncategorized';
  const subjectColor = task.chapters?.subjects?.color || '#14B8A6';
  const chapterTitle = task.chapters?.title;

  const timeRange = task.start_time && task.end_time
    ? `${formatTimeFromString(task.start_time)} – ${formatTimeFromString(task.end_time)}`
    : `${formatTime(task.startTime)} – ${formatTime(task.endTime)}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.title} size="sm">
      {/* Replaced the full-bleed colour bar: it read as a status stripe with no
          legend. Project identity is now a dot beside its label. */}
      <dl className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <dt className="sr-only">Project</dt>
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: subjectColor }}
            aria-hidden="true"
          />
          <Tag size={16} className="shrink-0 text-[#949BA4]" aria-hidden="true" />
          <dd className="min-w-0 break-words text-sm text-[#DBDEE1]">{subjectTitle}</dd>
        </div>

        {chapterTitle && (
          <div className="flex items-center gap-3">
            <dt className="sr-only">Area</dt>
            <Folder size={16} className="ml-[22px] shrink-0 text-[#949BA4]" aria-hidden="true" />
            <dd className="min-w-0 break-words text-sm text-[#DBDEE1]">{chapterTitle}</dd>
          </div>
        )}

        <div className="flex items-center gap-3">
          <dt className="sr-only">Scheduled time</dt>
          <Clock size={16} className="ml-[22px] shrink-0 text-[#949BA4]" aria-hidden="true" />
          <dd className="text-sm tabular-nums text-[#DBDEE1]">{timeRange}</dd>
        </div>
      </dl>

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button
          variant="danger"
          fullWidth
          onClick={() => onDelete(task)}
          aria-label={`Delete task ${task.title}`}
        >
          <Trash2 size={16} aria-hidden="true" />
          Delete
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => onEdit(task)}
          aria-label={`Edit task ${task.title}`}
        >
          <Edit size={16} aria-hidden="true" />
          Edit
        </Button>
      </div>
    </Modal>
  );
}
