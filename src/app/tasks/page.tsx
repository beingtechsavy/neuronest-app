'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Plus, Loader2 } from 'lucide-react';

import TaskFilters from '@/components/TaskFilters';
import TaskList from '@/components/TaskList';
import NewTaskModal from '@/components/NewTaskModal';
import EditTaskModal from '@/components/EditTaskModal';
import DeleteTaskConfirmModal from '@/components/DeleteTaskConfirmModal';
import { Task } from '@/types/tasks'; // 1. Import Task from the new central file

// --- MAIN PAGE COMPONENT ---
export default function TasksPage() {
  const supabase = useSupabaseClient();
  const user = useUser();

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('deadline');
  
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select(`
          task_id, title, status, deadline, created_at, effort_units,
          chapters ( title, subjects ( title, color ) )
        `)
        .eq('user_id', user.id);
      if (fetchError) throw fetchError;
      setAllTasks(data || []);
    } catch (err: unknown) {
      console.error('Error loading tasks:', err);
      setError("Could not load your tasks. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredAndSortedTasks = useMemo(() => {
    return allTasks
      .filter(task => {
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;
        if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case 'deadline':
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          case 'created_at':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'subject':
            const subjectA = a.chapters?.[0]?.subjects?.[0]?.title || 'zzz';
            const subjectB = b.chapters?.[0]?.subjects?.[0]?.title || 'zzz';
            return subjectA.localeCompare(subjectB);
          default:
            return 0;
        }
      });
  }, [allTasks, searchTerm, statusFilter, sortOrder]);

  return (
    <>
      <NewTaskModal isOpen={isNewTaskModalOpen} onClose={() => setIsNewTaskModalOpen(false)} onTaskAdded={fetchTasks} />
      {taskToEdit && (
        <EditTaskModal
          isOpen={!!taskToEdit}
          onClose={() => setTaskToEdit(null)}
          onSave={async (updates) => {
            await supabase.from('tasks').update(updates).eq('task_id', taskToEdit.task_id);
            await fetchTasks();
            setTaskToEdit(null);
          }}
          currentTitle={taskToEdit.title}
          currentEffort={taskToEdit.effort_units}
          currentDate={taskToEdit.deadline || ''}
        />
      )}
      {taskToDelete && (
          <DeleteTaskConfirmModal
            isOpen={!!taskToDelete}
            onClose={() => setTaskToDelete(null)}
            onConfirm={async () => {
                await supabase.from('tasks').delete().eq('task_id', taskToDelete.task_id);
                await fetchTasks();
                setTaskToDelete(null);
            }}
            taskTitle={taskToDelete.title}
          />
      )}

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">My Tasks</h1>
          <button onClick={() => setIsNewTaskModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors">
            <Plus size={18} />
            <span>Add New Task</span>
          </button>
        </div>

        <div className="mb-6">
          <TaskFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
        </div>

        <div className="bg-slate-800/50 rounded-lg border border-slate-700">
          {isLoading ? (
            <div className="flex justify-center items-center p-12"><Loader2 size={32} className="animate-spin text-purple-400" /></div>
          ) : error ? (
            <p className="text-center text-red-400 p-8">{error}</p>
          ) : (
            <TaskList
              tasks={filteredAndSortedTasks}
              onEditTask={(task) => setTaskToEdit(task)}
              onDeleteTask={(task) => setTaskToDelete(task)}
            />
          )}
        </div>
      </div>
    </>
  );
}
