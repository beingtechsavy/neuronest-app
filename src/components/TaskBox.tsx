'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ChapterItem from './ChapterItem'
import EditChapterModal from './EditChapterModal'
import AddChapterModal from './AddChapterModal'
import ConfirmModal from './ConfirmModal'
import { Pencil, Trash2, AlertTriangle, ChevronDown, Sparkles } from 'lucide-react'
import React from 'react'
import { Subject, Chapter as BaseChapter } from '@/types/definitions'
import { Card } from '@/components/ui'

interface Chapter extends BaseChapter {
  ai_generated?: boolean;
}
import { useToastContext } from './ToastProvider'
import { useTimeouts } from '@/hooks/useTimeout'
import { useConfirm } from '@/hooks/useConfirm'
import AIBreakdownModal from './AIBreakdownModal'
import ChapterBreakdownView from './ChapterBreakdownView'
import ReadyBadge from './ReadyBadge'
import { useUser } from '@supabase/auth-helpers-react'

interface TaskBoxProps {
  subject: Subject
  className?: string
  onEdit: () => void
  onDelete: () => void
}

export default function TaskBox({ subject, className = '', onEdit, onDelete }: TaskBoxProps) {
  const { error: showError, success } = useToastContext();
  const { addTimeout } = useTimeouts();
  const { confirm, confirmState, closeConfirm } = useConfirm();
  const user = useUser();
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [todayChapterIds, setTodayChapterIds] = useState<number[]>([])
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today')
  const [progress, setProgress] = useState(0)
  const [chapterTasks, setChapterTasks] = useState<Record<number, any[]>>({})
  const [breakdownTasksCount, setBreakdownTasksCount] = useState(0)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false)
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [isAIBreakdownOpen, setIsAIBreakdownOpen] = useState(false)

  const updateProgress = useCallback((currentChapters: Chapter[]) => {
    const completedCount = currentChapters.filter(c => c.completed).length
    setProgress(currentChapters.length > 0 ? Math.round((completedCount / currentChapters.length) * 100) : 0)
  }, [])

  const updateTodayView = useCallback((currentChapters: Chapter[]) => {
    const incomplete = currentChapters.filter(c => !c.completed)
    setTodayChapterIds(incomplete.slice(0, 2).map(c => c.chapter_id))
  }, [])

  const loadChapters = useCallback(async () => {
    setLoadingChapters(true);
    
    try {
      // Fetch chapters and their tasks in parallel
      const [chaptersRes, tasksRes] = await Promise.all([
        supabase
          .from('chapters')
          .select('chapter_id, title, order_idx, completed, is_stressful, ai_generated')
          .eq('subject_id', subject.subject_id)
          .order('order_idx', { ascending: true }),
        supabase
          .from('tasks')
          .select('task_id, title, chapter_id, task_status, difficulty_level, estimated_minutes')
          .in('chapter_id', 
            await supabase
              .from('chapters')
              .select('chapter_id')
              .eq('subject_id', subject.subject_id)
              .then(res => res.data?.map(c => c.chapter_id) || [])
          )
      ]);

      if (chaptersRes.error) {
        console.error('Error loading chapters:', chaptersRes.error)
        showError(`Failed to load chapters for ${subject.title}`)
        return
      }

      const initializedChapters = (chaptersRes.data || []).map(chapter => ({
        ...chapter,
        completed: chapter.completed || false,
        is_stressful: chapter.is_stressful || false,
        ai_generated: chapter.ai_generated || false,
      }))

      // Group tasks by chapter
      const tasksByChapter: Record<number, any[]> = {};
      let totalBreakdownTasks = 0;

      if (tasksRes.data) {
        tasksRes.data.forEach(task => {
          if (!tasksByChapter[task.chapter_id]) {
            tasksByChapter[task.chapter_id] = [];
          }
          tasksByChapter[task.chapter_id].push(task);
          
          if (task.task_status === 'breakdown') {
            totalBreakdownTasks++;
          }
        });
      }

      setChapters(initializedChapters)
      setChapterTasks(tasksByChapter)
      setBreakdownTasksCount(totalBreakdownTasks)
      updateProgress(initializedChapters)
      updateTodayView(initializedChapters)
    } catch (error) {
      console.error('Error loading data:', error)
      showError(`Failed to load data for ${subject.title}`)
    } finally {
      setLoadingChapters(false);
    }
  }, [subject.subject_id, subject.title, updateProgress, updateTodayView, showError])

  useEffect(() => {
    loadChapters()
  }, [loadChapters])

  async function toggleChapterCompletion(chapterId: number, allTasksCompleted: boolean) {
    const chapterToToggle = chapters.find(c => c.chapter_id === chapterId)
    if (!chapterToToggle) {
      console.error('Chapter not found:', chapterId);
      return;
    }
    const newCompletedStatus = allTasksCompleted ? true : !chapterToToggle.completed
    const updatedChapters = chapters.map(c =>
      c.chapter_id === chapterId ? { ...c, completed: newCompletedStatus } : c
    )
    setChapters(updatedChapters)
    updateProgress(updatedChapters)
    
    // Use managed timeout with automatic cleanup
    addTimeout(() => updateTodayView(updatedChapters), 500)
    
    await supabase.from('chapters').update({ completed: newCompletedStatus }).eq('chapter_id', chapterId)
  }

  const handleEditChapterClick = (chapter: Chapter) => {
    setEditingChapter(chapter)
    setIsEditModalOpen(true)
  }

  const handleSaveChapter = async (data: { title: string; is_stressful: boolean }) => {
    if (!editingChapter) {
      console.error('No chapter selected for editing');
      return;
    }
    
    try {
      const { error } = await supabase.from('chapters').update(data).eq('chapter_id', editingChapter.chapter_id)
      if (error) throw error;
      
      setChapters(chapters.map(c => (c.chapter_id === editingChapter.chapter_id ? { ...c, ...data } : c)))
      success('Chapter updated successfully!')
      setIsEditModalOpen(false)
      setEditingChapter(null)
    } catch (error) {
      console.error('Error updating chapter:', error);
      showError('Failed to update chapter')
    }
  }

  const handleDeleteChapter = async (chapterId: number) => {
    const chapter = chapters.find(c => c.chapter_id === chapterId);
    const confirmed = await confirm({
      title: 'Delete Chapter',
      message: `Are you sure you want to delete "${chapter?.title}"? This will also delete all tasks, AI breakdowns, and progress data in this chapter. This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger'
    });

    if (confirmed) {
      try {
        // Use SQL function to handle complex cascade deletion
        const { data, error } = await supabase.rpc('delete_chapter_cascade', {
          chapter_id_param: chapterId
        });
        
        if (error) throw error;
        
        if (data) {
          const updatedChapters = chapters.filter(c => c.chapter_id !== chapterId);
          setChapters(updatedChapters);
          updateProgress(updatedChapters);
          updateTodayView(updatedChapters);
          success('Chapter and all related data deleted successfully');
        } else {
          throw new Error('Deletion failed');
        }
      } catch (error) {
        console.error('Delete chapter error:', error);
        showError('Failed to delete chapter. Please try again.');
      }
    }
  }

  const handleAddChapter = async (data: { title: string; is_stressful: boolean }) => {
    try {
      const maxOrderIdx = chapters.reduce((max, chap) => Math.max(max, chap.order_idx), 0)
      const { data: newChapterData, error } = await supabase
        .from('chapters')
        .insert({ ...data, subject_id: subject.subject_id, order_idx: maxOrderIdx + 1 })
        .select()
        .single()
        
      if (error) throw error;
      
      const newChapter: Chapter | null = newChapterData as Chapter | null
      if (newChapter) {
        const updatedChapters = [...chapters, newChapter]
        setChapters(updatedChapters)
        updateProgress(updatedChapters)
        updateTodayView(updatedChapters)
        success('Chapter added successfully!')
      } else {
        throw new Error('No chapter data returned');
      }
    } catch (error) {
      console.error('Error creating chapter:', error);
      showError('Failed to create chapter')
    }
    setIsAddChapterModalOpen(false)
  }

  const handleAIBreakdownComplete = async (breakdown: any[]) => {
    // Reload chapters to get the new breakdown tasks
    await loadChapters();
    success('AI breakdown generated. Check your areas for new tasks.');
  }

  const handleTaskMoved = async () => {
    // Reload data when tasks are moved to inbox
    setLoadingChapters(true);
    await loadChapters();
  }

  const chaptersToDisplay = activeTab === 'today' ? chapters.filter(c => todayChapterIds.includes(c.chapter_id)) : chapters

  return (
    <>
      {editingChapter && (
        <EditChapterModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveChapter}
          chapterToEdit={editingChapter}
        />
      )}
      <AddChapterModal isOpen={isAddChapterModalOpen} onClose={() => setIsAddChapterModalOpen(false)} onAdd={handleAddChapter} />
      <AIBreakdownModal
        isOpen={isAIBreakdownOpen}
        onClose={() => setIsAIBreakdownOpen(false)}
        taskTitle={`Work on ${subject.title}`}
        taskDescription={`Break down ${subject.title} into manageable steps`}
        taskSubject={subject.title}
        userId={user?.id || ''}
        onBreakdownComplete={handleAIBreakdownComplete}
      />
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
      <Card className={`flex w-full flex-col overflow-hidden p-0 ${className}`}>
        <div className="flex flex-col p-5 sm:p-6">
          <div className="mb-3 grid grid-cols-[1fr_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {subject.is_stressful && (
                <span title="High-priority project">
                  <AlertTriangle size={15} className="shrink-0 text-[#E8A33D]" aria-hidden="true" />
                </span>
              )}
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: subject.color }}
                aria-hidden="true"
              />
              <h3 className="min-w-0 flex-1 truncate text-base font-bold tracking-tight text-[#F2F3F5]">
                {subject.title}
              </h3>
              {breakdownTasksCount > 0 && <ReadyBadge count={breakdownTasksCount} type="breakdown" size="sm" />}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={onEdit}
                aria-label={`Edit ${subject.title}`}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#949BA4] transition-colors hover:bg-[#383A40] hover:text-[#F2F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]">
                <Pencil size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                aria-label={`Delete ${subject.title}`}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#949BA4] transition-colors hover:bg-[#ED4245]/10 hover:text-[#FF6B6B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED4245]">
                <Trash2 size={14} aria-hidden="true" />
              </button>
              <span className="rounded-lg bg-[#383A40] px-2 py-0.5 text-xs font-semibold tabular-nums text-[#DBDEE1]">
                {progress}%
              </span>
            </div>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-[#383A40]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${subject.title} progress`}>
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${progress}%`, backgroundColor: subject.color }}
            />
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-1 rounded-xl text-sm font-medium text-[#949BA4] transition-colors hover:bg-[#383A40] hover:text-[#F2F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
          >
            {expanded ? 'Collapse' : 'View areas'}
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </button>

          {expanded && (
            <div className="mt-3 flex flex-col border-t border-[#383A40] pt-3">
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <div className="flex gap-1 rounded-xl bg-[#1E1F22] p-1" role="group" aria-label="Area filter">
                  <button
                    type="button"
                    onClick={() => setActiveTab('today')}
                    aria-pressed={activeTab === 'today'}
                    className={`min-h-11 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] ${
                      activeTab === 'today' ? 'bg-[#0D9488] text-[#F2F3F5]' : 'text-[#949BA4] hover:text-[#F2F3F5]'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    aria-pressed={activeTab === 'all'}
                    className={`min-h-11 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] ${
                      activeTab === 'all' ? 'bg-[#0D9488] text-[#F2F3F5]' : 'text-[#949BA4] hover:text-[#F2F3F5]'
                    }`}
                  >
                    All
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAIBreakdownOpen(true)}
                  title="Break down this project with AI"
                  className="flex min-h-11 items-center gap-1.5 rounded-lg border border-[#14B8A6]/40 bg-[#14B8A6]/10 px-2.5 text-xs font-semibold text-[#2DD4BF] transition-colors hover:border-[#14B8A6] hover:bg-[#14B8A6]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
                >
                  <Sparkles size={13} aria-hidden="true" />
                  AI Breakdown
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddChapterModalOpen(true)}
                  className="flex min-h-11 items-center rounded-lg border border-dashed border-[#3F4147] px-2.5 text-xs font-semibold text-[#949BA4] transition-colors hover:border-[#14B8A6] hover:text-[#F2F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
                >
                  + Add area
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {loadingChapters ? (
                  <div className="flex min-h-[60px] items-center justify-center text-sm text-[#949BA4]">
                    Loading areas…
                  </div>
                ) : (
                  <>
                    {/* AI breakdown areas first */}
                    {chaptersToDisplay
                      .filter(chapter => chapter.ai_generated && chapterTasks[chapter.chapter_id]?.some(t => t.task_status === 'breakdown'))
                      .map(chapter => (
                        <div key={`breakdown-${chapter.chapter_id}`} className="mb-2">
                          <ChapterBreakdownView
                            chapter={chapter}
                            tasks={chapterTasks[chapter.chapter_id] || []}
                            onTaskMoved={handleTaskMoved}
                          />
                        </div>
                      ))
                    }

                    {chaptersToDisplay.length > 0 ? (
                      chaptersToDisplay
                        .filter(chapter => !chapter.ai_generated || !chapterTasks[chapter.chapter_id]?.some(t => t.task_status === 'breakdown'))
                        .map(chapter => (
                          <ChapterItem
                            key={chapter.chapter_id}
                            chapter={chapter}
                            onToggleComplete={toggleChapterCompletion}
                            onEdit={handleEditChapterClick}
                            onDelete={handleDeleteChapter}
                          />
                        ))
                    ) : (
                      <div className="flex min-h-[60px] items-center justify-center px-4 text-center text-sm text-[#949BA4]">
                        {activeTab === 'today'
                          ? 'Nothing left for today. Switch to All to see everything.'
                          : 'No areas yet. Add one to get started.'}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  )
}

