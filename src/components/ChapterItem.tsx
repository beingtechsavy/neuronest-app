'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, AlertTriangle } from 'lucide-react'
import EditDeleteIcons from './EditDeleteIcons'
import { supabase } from '@/lib/supabaseClient'
import React from 'react'
import { Chapter, Task } from '@/types/definitions'

interface ChapterItemProps {
  chapter: Chapter
  onToggleComplete: (chapterId: number, allTasksCompleted: boolean) => void
  onEdit: (chapter: Chapter) => void
  onDelete: (chapterId: number) => void
}

export default function ChapterItem({ chapter, onToggleComplete, onEdit, onDelete }: ChapterItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)

  useEffect(() => {
    const fetchTasks = async () => {
      if (isExpanded) {
        setIsLoadingTasks(true)
        const { data, error } = await supabase
          .from('tasks')
          .select('task_id, title, status, is_stressful')
          .eq('chapter_id', chapter.chapter_id)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Error fetching tasks:', error)
        } else {
          setTasks(data as Task[] || [])
        }
        setIsLoadingTasks(false)
      }
    }
    fetchTasks()
  }, [isExpanded, chapter.chapter_id])

  const handleToggleTask = async (taskId: number) => {
    const taskToToggle = tasks.find(t => t.task_id === taskId);
    if (!taskToToggle) return;
    const newStatus: 'pending' | 'completed' = taskToToggle.status === 'completed' ? 'pending' : 'completed';

    const updatedTasks = tasks.map(t => t.task_id === taskId ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);
    await supabase.from('tasks').update({ status: newStatus }).eq('task_id', taskId);
  };

  // Calculate all tasks completion
  const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.status === 'completed')

  return (
    <div
      style={{
        ...styles.container,
        ...(chapter.completed ? styles.containerCompleted : {}),
        ...(isHovered ? styles.containerHovered : {}),
        ...(chapter.is_stressful ? { borderColor: '#f59e0b' } : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.mainRow}>
        <div
          style={styles.titleContainer}
          onClick={() => !chapter.completed && setIsExpanded(!isExpanded)}
        >
          <ChevronDown
            size={18}
            style={{
              ...styles.chevron,
              ...(isExpanded ? styles.chevronExpanded : {}),
              ...(chapter.completed ? { color: '#64748b' } : {}),
            }}
          />
          {chapter.is_stressful && (
            <span title="This chapter may be stressful" style={styles.stressIcon}>
              <AlertTriangle size={16} style={{ color: '#fbbf24' }} />
            </span>
          )}
          <span
            style={{
              ...styles.chapterName,
              ...(chapter.completed ? styles.chapterNameCompleted : {})
            }}
          >
            {chapter.title}
          </span>
        </div>
        <div style={styles.actionsContainer}>
          {isHovered && !chapter.completed && (
            <EditDeleteIcons onEdit={() => onEdit(chapter)} onDelete={() => onDelete(chapter.chapter_id)} />
          )}
          <div
            onClick={e => { e.stopPropagation(); onToggleComplete(chapter.chapter_id, allTasksCompleted); }}
            style={{
              ...styles.checkboxContainer,
              ...(chapter.completed ? styles.checkboxContainerCompleted : {})
            }}
            title={chapter.completed ? 'Mark incomplete' : allTasksCompleted ? 'Mark complete' : 'Complete chapter'}
          >
            <div style={{
              ...styles.checkmark,
              ...(chapter.completed ? styles.checkmarkCompleted : {})
            }}>
              <span style={styles.checkmarkTick}>✓</span>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div style={styles.tasksContainer}>
          {isLoadingTasks ? (
            <p style={styles.placeholderText}>Loading tasks...</p>
          ) : tasks.length > 0 ? (
            <div style={styles.subTaskList}>
              {tasks.map(task => (
                <div
                  key={task.task_id}
                  style={{
                    ...styles.subTaskItem,
                    ...(task.status === 'completed' ? styles.subTaskItemCompleted : {}),
                  }}
                  onClick={() => handleToggleTask(task.task_id)}
                >
                  <div style={{
                    ...styles.subTaskCheckmark,
                    ...(task.status === 'completed' ? styles.subTaskCheckmarkCompleted : {})
                  }}>
                    {task.status === 'completed' ? <span style={styles.subTaskTick}>✓</span> : ''}
                  </div>
                  {task.is_stressful && <AlertTriangle size={14} style={{ color: '#fbbf24', marginRight: 3 }} title="Task is stressful" />}
                  <span
                    style={{
                      ...styles.subTaskName,
                      ...(task.status === 'completed' ? styles.subTaskNameCompleted : {})
                    }}
                  >
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.placeholderText}>No tasks yet.</p>
          )}
        </div>
      )}
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    background: 'linear-gradient(135deg, #1e293b 70%, #2d3748 100%)',
    borderRadius: 10,
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: '#334155',
    boxShadow: '0 2px 10px rgba(0,0,0,0.09)',
    transition: 'all 0.23s cubic-bezier(.69,.13,.38,1.18)',
    marginBottom: '10px',
    padding: '0.2rem 0.7rem 0.45rem 0.7rem',
    overflow: 'hidden',
    position: 'relative',
  },
  containerCompleted: {
    background: 'linear-gradient(135deg, #d1fae5 70%, #f0fdf4 100%)',
    opacity: 0.90,
    borderColor: '#22c55e',
    boxShadow: 'none',
  },
  containerHovered: {
    boxShadow: '0 4px 24px rgba(56,189,248,0.12)',
    borderColor: '#38bdf8'
  },
  mainRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    cursor: 'pointer',
    minWidth: 0,
  },
  chevron: {
    color: '#a3a3a3',
    transition: 'transform 0.23s cubic-bezier(.51,.11,.34,.94)',
    flexShrink: 0,
  },
  chevronExpanded: {
    transform: 'rotate(180deg)',
  },
  stressIcon: {
    display: 'flex',
    alignItems: 'center',
    marginRight: 1,
    marginLeft: 0,
  },
  chapterName: {
    color: '#fafafa',
    fontWeight: 600,
    fontSize: '1.04rem',
    letterSpacing: '.01em',
    transition: 'all 0.2s cubic-bezier(.64,.09,.48,.98)',
    wordBreak: 'break-word',
    whiteSpace: 'normal',
  },
  chapterNameCompleted: {
    color: '#64748b',
    textDecoration: 'line-through',
    textDecorationColor: '#a3a3a3',
  },
  actionsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginLeft: 12,
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    borderRadius: '50%',
    background: 'none',
    outline: 'none',
    boxShadow: 'none',
  },
  checkboxContainerCompleted: {
    filter: 'drop-shadow(0 2px 8px #4ade8040)'
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    borderWidth: '2.2px',
    borderStyle: 'solid',
    borderColor: '#38bdf8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f172a',
    fontSize: '1.18em',
    color: 'transparent',
    transition: 'all 0.22s cubic-bezier(.62,.09,.37,.95)',
    marginRight: 1,
  },
  checkmarkCompleted: {
    borderColor: '#22c55e',
    background: 'linear-gradient(135deg,#4ade80 70%,#bbf7d0 100%)',
    color: '#065f46',
  },
  checkmarkTick: {
    fontWeight: 'bold',
    fontSize: '1em',
    color: 'inherit',
    lineHeight: '1.1em',
    transition: 'color 0.3s',
  },
  tasksContainer: {
    background: 'none',
    padding: '7px 0 1px 27px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#334155',
    marginTop: 4,
    marginLeft: -12,
    marginRight: -12,
    minHeight: 32,
  },
  placeholderText: {
    fontSize: '12px',
    color: '#a3a3a3',
    fontStyle: 'italic',
    paddingLeft: 6,
    paddingTop: 5,
  },
  subTaskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    width: '100%',
  },
  subTaskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '3px 1px 2px 0',
    background: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'background 0.16s',
    userSelect: 'none',
  },
  subTaskItemCompleted: {
    opacity: 0.52,
  },
  subTaskCheckmark: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    borderWidth: '1.6px',
    borderStyle: 'solid',
    borderColor: '#38bdf8',
    background: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85em',
    color: 'transparent',
    marginRight: 2,
    transition: 'all 0.19s cubic-bezier(.61,.15,.51,1.10)',
  },
  subTaskCheckmarkCompleted: {
    background: 'linear-gradient(135deg,#a7f3d0 60%,#d1fae5 100%)',
    borderColor: '#059669',
    color: '#059669',
  },
  subTaskTick: {
    color: '#059669',
    fontWeight: 800,
    fontSize: '1em',
    lineHeight: '1.1em'
  },
  subTaskName: {
    fontSize: '13px',
    color: '#e0e7ef',
    transition: 'all 0.2s',
    wordBreak: 'break-word',
  },
  subTaskNameCompleted: {
    color: '#a3a3a3',
    textDecoration: 'line-through',
  },
}
