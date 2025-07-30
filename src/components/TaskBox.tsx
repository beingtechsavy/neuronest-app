'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import ChapterItem from './ChapterItem'
import EditChapterModal from './EditChapterModal'
import AddChapterModal from './AddChapterModal'
import { Pencil, Trash2, AlertTriangle } from 'lucide-react'

interface Subject {
  subject_id: number
  title: string
  color: string
  is_stressful: boolean
}

interface Chapter {
  chapter_id: number
  title: string
  order_idx: number
  completed: boolean
  is_stressful: boolean // Added new field
}

interface TaskBoxProps {
  subject: Subject
  className?: string
  onEdit: () => void
  onDelete: () => void
}

export default function TaskBox({ subject, className = '', onEdit, onDelete }: TaskBoxProps) {
  const router = useRouter()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [todayChapterIds, setTodayChapterIds] = useState<number[]>([])
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today')
  const [progress, setProgress] = useState(0)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false)

  useEffect(() => {
    loadChapters()
  }, [subject.subject_id])

  async function loadChapters() {
    // Update select query
    const { data, error } = await supabase
      .from('chapters')
      .select('chapter_id, title, order_idx, completed, is_stressful')
      .eq('subject_id', subject.subject_id)
      .order('order_idx', { ascending: true })

    if (error) {
      console.error('Error loading chapters:', error)
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
  }

  function updateTodayView(currentChapters: Chapter[]) {
    const incomplete = currentChapters.filter(c => !c.completed)
    setTodayChapterIds(incomplete.slice(0, 2).map(c => c.chapter_id))
  }

  async function toggleChapterCompletion(chapterId: number, allTasksCompleted: boolean) {
    const chapterToToggle = chapters.find(c => c.chapter_id === chapterId);
    if (!chapterToToggle) return;
    const newCompletedStatus = allTasksCompleted ? true : !chapterToToggle.completed;
    const updatedChapters = chapters.map(c => c.chapter_id === chapterId ? { ...c, completed: newCompletedStatus } : c)
    setChapters(updatedChapters)
    updateProgress(updatedChapters)
    setTimeout(() => updateTodayView(updatedChapters), 500)
    await supabase.from('chapters').update({ completed: newCompletedStatus }).eq('chapter_id', chapterId)
  }

  function updateProgress(chapters: Chapter[]) {
    const completedCount = chapters.filter(c => c.completed).length
    setProgress(chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0)
  }

  const handleEditChapterClick = (chapter: Chapter) => {
    setEditingChapter(chapter)
    setIsEditModalOpen(true)
  }

  // Update save handler to include is_stressful
  const handleSaveChapter = async (data: { title: string, is_stressful: boolean }) => {
    if (!editingChapter) return
    await supabase.from('chapters').update(data).eq('chapter_id', editingChapter.chapter_id)
    setChapters(chapters.map(c => c.chapter_id === editingChapter.chapter_id ? { ...c, ...data } : c))
    setIsEditModalOpen(false)
    setEditingChapter(null)
  }

  const handleDeleteChapter = async (chapterId: number) => {
    if (window.confirm("Are you sure?")) {
      await supabase.from('chapters').delete().eq('chapter_id', chapterId)
      const updatedChapters = chapters.filter(c => c.chapter_id !== chapterId)
      setChapters(updatedChapters)
      updateProgress(updatedChapters)
      updateTodayView(updatedChapters)
    }
  }
  
  // Update add handler to include is_stressful
  const handleAddChapter = async (data: { title: string, is_stressful: boolean }) => {
    const maxOrderIdx = chapters.reduce((max, chap) => Math.max(max, chap.order_idx), 0);
    const { data: newChapter } = await supabase.from('chapters').insert({ ...data, subject_id: subject.subject_id, order_idx: maxOrderIdx + 1 }).select().single();
    if (newChapter) setChapters([...chapters, newChapter]);
    setIsAddChapterModalOpen(false);
  }

  const chaptersToDisplay = activeTab === 'today'
    ? chapters.filter(c => todayChapterIds.includes(c.chapter_id))
    : chapters;

  return (
    <>
      {editingChapter && <EditChapterModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveChapter} chapterToEdit={editingChapter}/>}
      <AddChapterModal isOpen={isAddChapterModalOpen} onClose={() => setIsAddChapterModalOpen(false)} onAdd={handleAddChapter}/>
      <div className={className}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              {subject.is_stressful && <AlertTriangle size={20} style={{color: '#f59e0b'}} title="This subject may be stressful"/>}
              <span style={styles.cardTitle}>{subject.title}</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                <button onClick={onEdit} style={styles.iconButton}><Pencil size={16}/></button>
                <button onClick={onDelete} style={styles.iconButton}><Trash2 size={16}/></button>
                <span style={{...styles.percentBadge, backgroundColor: `${subject.color}20`, color: subject.color}}>{progress}%</span>
            </div>
          </div>

          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%`, backgroundColor: subject.color }} />
          </div>

          <button style={styles.expandButton} onClick={() => setExpanded(!expanded)}>{expanded ? '▴' : '▾'}</button>

          {expanded && (
            <div style={styles.expandedContent}>
              <div style={styles.tabContainer}>
                <button style={{ ...styles.tab, ...(activeTab === 'today' ? styles.activeTab : styles.inactiveTab) }} onClick={() => setActiveTab('today')}>Today</button>
                <button style={{ ...styles.tab, ...(activeTab === 'all' ? styles.activeTab : styles.inactiveTab) }} onClick={() => setActiveTab('all')}>All Chapters</button>
                <button style={styles.addChapterButton} onClick={() => setIsAddChapterModalOpen(true)}>+ Add Chapter</button>
              </div>
              <div style={styles.taskList}>
                {chaptersToDisplay.map(chapter => (
                  <ChapterItem key={chapter.chapter_id} chapter={chapter} onToggleComplete={toggleChapterCompletion} onEdit={handleEditChapterClick} onDelete={handleDeleteChapter}/>
                ))}
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
    backgroundColor: '#f8fafc', borderRadius: '20px', padding: '24px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.1)',
    width: '100%', display: 'flex', flexDirection: 'column',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  cardTitle: { fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' },
  iconButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  percentBadge: { fontSize: '1rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px' },
  progressBar: { backgroundColor: '#e2e8f0', borderRadius: '10px', height: '10px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '10px', transition: 'width 0.6s ease-in-out' },
  expandButton: {
    width: '100%', background: 'none', border: 'none', textAlign: 'right',
    cursor: 'pointer', fontSize: '18px', color: '#64748b', padding: '8px 0',
  },
  expandedContent: {
    marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0',
    flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
  },
  tabContainer: { display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' },
  tab: {
    flex: 1, padding: '10px 16px', borderRadius: '12px', border: 'none',
    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '0.875rem',
  },
  activeTab: { backgroundColor: '#4f46e5', color: '#ffffff' },
  inactiveTab: { backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' },
  addChapterButton: {
    padding: '10px 16px', borderRadius: '12px', border: '1px solid #4f46e5',
    backgroundColor: 'transparent', color: '#4f46e5', fontWeight: 600,
    cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap',
  },
  taskList: {
    display: 'flex', flexDirection: 'column', gap: '8px',
    overflowY: 'auto', flex: 1, paddingRight: '4px',
  },
};
