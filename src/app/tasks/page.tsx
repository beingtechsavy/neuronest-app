'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';

import TaskFilters from '@/components/TaskFilters';
import TaskList from '@/components/TaskList';
import NewTaskModal from '@/components/NewTaskModal';
import EditTaskModal from '@/components/EditTaskModal';
import DeleteTaskConfirmModal from '@/components/DeleteTaskConfirmModal';
import { Task } from '@/types/tasks'; // 1. Import Task from the new central file
import { Button, Card, PageHeader, PageShell } from '@/components/ui';

// --- MAIN PAGE COMPONENT ---
export default function TasksPage() {
  const user = useUser();

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'breakdown' | 'inbox' | 'scheduled' | 'completed'>('all');
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
          task_id, title, task_status, deadline, created_at, effort_units, scheduled_date, is_stressful, ai_generated,
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
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredAndSortedTasks = useMemo(() => {
    return allTasks
      .filter(task => {
        if (statusFilter !== 'all' && task.task_status !== statusFilter) return false;
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
          taskId={taskToEdit.task_id}
          onSave={async (updates) => {
            await supabase.from('tasks').update(updates).eq('task_id', taskToEdit.task_id);
            await fetchTasks();
            setTaskToEdit(null);
          }}
          currentTitle={taskToEdit.title}
          currentEffort={taskToEdit.effort_units}
          currentDate={taskToEdit.scheduled_date || taskToEdit.deadline || ''}
          currentStartTime={taskToEdit.start_time}
          currentEndTime={taskToEdit.end_time}
          currentIsCritical={taskToEdit.is_critical}
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

      <PageShell width="wide">
        <PageHeader
          title="Tasks"
          description="Every task across your projects, filtered and sorted in one list."
          actions={
            <Button onClick={() => setIsNewTaskModalOpen(true)}>
              <Plus size={18} aria-hidden="true" />
              New task
            </Button>
          }
        />

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

        <Card className="overflow-hidden p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-[#949BA4]" role="status">
              <Loader2
                size={22}
                className="animate-spin text-[#2DD4BF] motion-reduce:animate-none"
                aria-hidden="true"
              />
              <span className="text-sm">Loading tasks…</span>
            </div>
          ) : error ? (
            <p className="p-8 text-center text-sm text-[#FF6B6B]" role="alert">{error}</p>
          ) : (
            <TaskList
              tasks={filteredAndSortedTasks}
              onEditTask={(task) => setTaskToEdit(task)}
              onDeleteTask={(task) => setTaskToDelete(task)}
            />
          )}
        </Card>
      </PageShell>
    </>
  );
}
