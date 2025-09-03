'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ChapterItem from './ChapterItem'
import EditChapterModal from './EditChapterModal'
import AddChapterModal from './AddChapterModal'
import ConfirmModal from './ConfirmModal'
import { Pencil, Trash2, AlertTriangle, ChevronDown } from 'lucide-react'
import React from 'react'
import { Subject, Chapter } from '@/types/definitions'
import { useToastContext } from './ToastProvider'
import { useTimeouts } from '@/hooks/useTimeout'
import { useConfirm } from '@/hooks/useConfirm'

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
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [todayChapterIds, setTodayChapterIds] = useState<number[]>([])
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today')
  const [progress, setProgress] = useState(0)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false)
  const [loadingChapters, setLoadingChapters] = useState(false)

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
    const { data, error } = await supabase
      .from('chapters')
      .select('chapter_id, title, order_idx, completed, is_stressful')
      .eq('subject_id', subject.subject_id)
      .order('order_idx', { ascending: true })

    if (error) {
      console.error('Error loading chapters:', error)
      showError(`Failed to load chapters for ${subject.title}`)
      setLoadingChapters(false);
      return
    }
    const initializedChapters = (data || []).map(chapter => ({
      ...chapter,
      completed: chapter.completed || false,
      is_stressful: chapter.is_stressful || false,
    }))
    setChapters(initializedChapters)
    updateProgress(initializedChapters)
    updateTodayView(initializedChapters)
    setLoadingChapters(false);
  }, [subject.subject_id, updateProgress, updateTodayView, showError])

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
      message: `Are you sure you want to delete "${chapter?.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger'
    });

    if (confirmed) {
      try {
        const { error } = await supabase.from('chapters').delete().eq('chapter_id', chapterId);
        if (error) throw error;
        
        const updatedChapters = chapters.filter(c => c.chapter_id !== chapterId);
        setChapters(updatedChapters);
        updateProgress(updatedChapters);
        updateTodayView(updatedChapters);
        success('Chapter deleted successfully');
      } catch (error) {
        showError('Failed to delete chapter');
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
      <div
        className={className}
        style={{
          ...styles.card,
          boxShadow: `0 4px 12px rgba(0,0,0,0.18)`,
          position: 'relative'
        }}
      >
        {/* Colored top highlight */}
        <div
          style={{
            height: 4,
            width: '100%',
            background: subject.color,
            position: 'absolute',
            top: 0,
            left: 0,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        />
        <div style={{ ...styles.cardContent, paddingTop: 16 }}>
          <div style={styles.cardHeader}>
            <div style={styles.titleGroup}>
              {subject.is_stressful && (
                <span title="This subject may be stressful">
                  <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                </span>
              )}
              <span style={styles.cardTitle}>{subject.title}</span>
            </div>
            <div style={styles.actionsGroup}>
              <button onClick={onEdit} style={styles.iconButton}>
                <Pencil size={14} />
              </button>
              <button onClick={onDelete} style={styles.iconButton}>
                <Trash2 size={14} />
              </button>
              <span style={{ ...styles.percentBadge, backgroundColor: `${subject.color}20`, color: subject.color }}>
                {progress}%
              </span>
            </div>
          </div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%`, backgroundColor: subject.color }} />
          </div>
          {/* Space between progress/bar and expand button */}
          <div style={{ marginTop: 18 }} />
          <button style={styles.expandButton} onClick={() => setExpanded(!expanded)}>
            <span>{expanded ? 'Collapse' : 'View Chapters'}</span>
            <ChevronDown
              size={16}
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            />
          </button>
          {expanded && (
            <div style={styles.expandedContent}>
              <div style={styles.tabContainer}>
                <button
                  style={{
                    ...styles.tab,
                    ...(activeTab === 'today' ? styles.activeTab : {})
                  }}
                  onClick={() => setActiveTab('today')}
                >Today</button>
                <button
                  style={{
                    ...styles.tab,
                    ...(activeTab === 'all' ? styles.activeTab : {})
                  }}
                  onClick={() => setActiveTab('all')}
                >All</button>
                <button style={styles.addChapterButton} onClick={() => setIsAddChapterModalOpen(true)}>
                  + Add Chapter
                </button>
              </div>
              <div style={styles.taskList}>
                {loadingChapters ? (
                  <div style={styles.loadingState}>
                    <span style={styles.loadingText}>Loading chapters...</span>
                  </div>
                ) : chaptersToDisplay.length > 0 ? (
                  chaptersToDisplay.map(chapter => (
                    <ChapterItem
                      key={chapter.chapter_id}
                      chapter={chapter}
                      onToggleComplete={toggleChapterCompletion}
                      onEdit={handleEditChapterClick}
                      onDelete={handleDeleteChapter}
                    />
                  ))
                ) : (
                  <div style={styles.emptyState}>
                    <span style={styles.emptyText}>No chapters yet. Add one to get started!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 0,
    // REPLACE border shorthand with longhand to avoid React conflict
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#334155',
    width: '100%',
    boxSizing: 'border-box',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.2s ease',
    minHeight: 0,
    overflow: 'hidden',
  },
  cardContent: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column'
  },
  cardHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    justifyContent: 'center',
    width: '100%',
  },
  cardTitle: {
    fontSize: '1.08rem',
    fontWeight: 600,
    color: '#f1f5f9',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    textAlign: 'center',
    flex: 1,
  },
  actionsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  iconButton: {
    background: '#334155',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '0.3rem',
    borderRadius: 6,
    display: 'flex',
    transition: 'background-color 0.2s, color 0.2s',
  },
  percentBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.2rem 0.6rem',
    borderRadius: 12,
  },
  progressBar: {
    backgroundColor: '#334155',
    borderRadius: 6,
    height: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    transition: 'width 0.4s ease-in-out',
  },
  expandButton: {
    width: '100%',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    color: '#94a3b8',
    padding: '0.5rem 0 0.25rem 0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    transition: 'color 0.2s',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#334155',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  tabContainer: { display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' },
  tab: {
    flex: 1,
    padding: '0.3rem 0.5rem',
    borderRadius: 6,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#475569',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.75rem',
    backgroundColor: 'transparent',
    color: '#94a3b8',
  },
  activeTab: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#4f46e5',
  },
  addChapterButton: {
    padding: '0.3rem 0.6rem',
    borderRadius: 6,
    borderWidth: '1px',
    borderStyle: 'dashed',
    borderColor: '#475569',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    overflowY: 'auto',
    flex: 1,
    paddingRight: '0.25rem',
  },
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem',
    minHeight: '60px',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: '0.875rem',
    fontStyle: 'italic',
  },
  emptyState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem',
    minHeight: '60px',
  },
  emptyText: {
    color: '#64748b',
    fontSize: '0.875rem',
    fontStyle: 'italic',
    textAlign: 'center',
  },
}
