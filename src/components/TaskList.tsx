'use client';

import React from 'react';
import { Task } from '@/types/tasks'; // 1. Correct the import path
import TaskItem from './TaskItem';
import { FolderSearch } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

// --- MAIN COMPONENT ---
export default function TaskList({ tasks, onEditTask, onDeleteTask }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center p-12 text-slate-500">
        <FolderSearch size={48} className="mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-300">No Tasks Found</h3>
        <p>Try adjusting your filters or add a new task.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {tasks.map(task => (
        <TaskItem
          key={task.task_id}
          task={task}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
        />
      ))}
    </div>
  );
}
