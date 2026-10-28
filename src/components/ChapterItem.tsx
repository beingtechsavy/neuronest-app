'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, AlertTriangle } from 'lucide-react'
import EditDeleteIcons from './EditDeleteIcons'
import { supabase } from '@/lib/supabaseClient'
import { Chapter, Task } from '@/types/definitions'
import { useToastContext } from './ToastProvider'

interface ChapterItemProps {
  chapter: Chapter
  onToggleComplete: (chapterId: number, allTasksCompleted: boolean) => void
  onEdit: (chapter: Chapter) => void
  onDelete: (chapterId: number) => void
}

export default function ChapterItem({ chapter, onToggleComplete, onEdit, onDelete }: ChapterItemProps) {
  const { error: showError } = useToastContext();
  const [isExpanded, setIsExpanded] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)

  useEffect(() => {
    const fetchTasks = async () => {
      if (isExpanded) {
        setIsLoadingTasks(true)
        const { data, error } = await supabase
          .from('tasks')
          .select('task_id, title, task_status, is_stressful, status, scheduled_date')
          .eq('chapter_id', chapter.chapter_id)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Error fetching tasks:', error)
          showError(`Failed to load tasks for ${chapter.title}`)
        } else {
          // Ensure data is an array and has valid structure
          const validTasks = Array.isArray(data) ? data.filter(task => task && typeof task.task_id === 'number') : [];
          setTasks(validTasks as Task[]);
        }
        setIsLoadingTasks(false)
      }
    }
    fetchTasks()
  }, [isExpanded, chapter.chapter_id, chapter.title, showError])

  const handleToggleTask = async (taskId: number) => {
    const taskToToggle = tasks.find(t => t.task_id === taskId);
    if (!taskToToggle) {
      console.error('Task not found:', taskId);
      return;
    }
    const newStatus: 'pending' | 'completed' = taskToToggle.status === 'completed' ? 'pending' : 'completed';
    const newTaskStatus: 'completed' | 'scheduled' | 'inbox' | 'breakdown' = newStatus === 'completed' ? 'completed' :
      (taskToToggle.scheduled_date ? 'scheduled' : 'inbox');

    const updatedTasks = tasks.map(t => t.task_id === taskId ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);

    try {
      const { error } = await supabase.from('tasks').update({
        status: newStatus,
        task_status: newTaskStatus
      }).eq('task_id', taskId);
      if (error) {
        console.error('Error updating task status:', error);
        // Revert the optimistic update on error
        setTasks(tasks);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      // Revert the optimistic update on error
      setTasks(tasks);
    }
  };

  // Calculate all tasks completion - safe array operation
  const allTasksCompleted = Array.isArray(tasks) && tasks.length > 0 && tasks.every(t => t?.status === 'completed')

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border transition-colors duration-150 ${
        chapter.completed
          ? 'border-[#23A55A]/40 bg-[#23A55A]/10'
          : chapter.is_stressful
            ? 'border-[#E8A33D]/50 bg-[#1E1F22] hover:border-[#14B8A6]'
            : 'border-[#383A40] bg-[#1E1F22] hover:border-[#14B8A6]'
      }`}
    >
      <div className="flex min-h-11 items-center justify-between gap-2 px-2.5">
        <button
          type="button"
          onClick={() => !chapter.completed && setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          disabled={chapter.completed}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-1.5 py-2 text-left disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-inset"
        >
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`shrink-0 transition-transform duration-150 motion-reduce:transition-none ${
              chapter.completed ? 'text-[#6E747B]' : 'text-[#949BA4]'
            } ${isExpanded ? 'rotate-180' : ''}`}
          />
          {chapter.is_stressful && (
            <span title="This area may be stressful" className="flex shrink-0 items-center">
              <AlertTriangle size={14} className="text-[#E8A33D]" aria-hidden="true" />
            </span>
          )}
          <span
            className={`min-w-0 break-words text-sm font-semibold ${
              chapter.completed ? 'text-[#6E747B] line-through decoration-[#949BA4]' : 'text-[#F2F3F5]'
            }`}
          >
            {chapter.title}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {/* Always in the layout but only visible on hover/focus, so the row
              does not jump when the icons appear. */}
          {!chapter.completed && (
            <span className="opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
              <EditDeleteIcons onEdit={() => onEdit(chapter)} onDelete={() => onDelete(chapter.chapter_id)} />
            </span>
          )}
          {/* A 24px circle inside a 44px hit area: the circle reads as a
              checkbox, the button is still thumb-sized. */}
          <button
            type="button"
            onClick={() => onToggleComplete(chapter.chapter_id, allTasksCompleted)}
            aria-pressed={chapter.completed}
            aria-label={chapter.completed ? `Mark ${chapter.title} incomplete` : `Mark ${chapter.title} complete`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2B2D31]"
          >
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors duration-150 motion-reduce:transition-none ${
                chapter.completed
                  ? 'border-[#23A55A] bg-[#23A55A] text-[#1E1F22]'
                  : 'border-[#14B8A6] bg-[#1E1F22] text-transparent'
              }`}
            >
              ✓
            </span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="ml-6 mt-1 border-t border-[#383A40] pb-1 pl-2 pt-2">
          {isLoadingTasks ? (
            <p className="px-1.5 py-1 text-xs text-[#949BA4]">Loading tasks…</p>
          ) : tasks.length > 0 ? (
            <ul className="flex w-full flex-col gap-0.5">
              {tasks.map(task => (
                <li key={task.task_id}>
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.task_id)}
                    aria-pressed={task.status === 'completed'}
                    className={`flex min-h-11 w-full items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-[#2B2D31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-inset ${
                      task.status === 'completed' ? 'opacity-60' : ''
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold leading-none ${
                        task.status === 'completed'
                          ? 'border-[#23A55A] bg-[#23A55A] text-[#1E1F22]'
                          : 'border-[#14B8A6] text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    {task.is_stressful && (
                      <span title="Task is stressful">
                        <AlertTriangle size={12} className="shrink-0 text-[#E8A33D]" aria-hidden="true" />
                      </span>
                    )}
                    <span
                      className={`min-w-0 break-words text-[13px] ${
                        task.status === 'completed'
                          ? 'text-[#949BA4] line-through'
                          : 'text-[#DBDEE1]'
                      }`}
                    >
                      {task.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-1.5 py-1 text-xs text-[#949BA4]">No tasks yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
