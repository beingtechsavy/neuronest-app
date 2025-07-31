'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, AlertTriangle } from 'lucide-react'
import EditDeleteIcons from './EditDeleteIcons'
import { supabase } from '@/lib/supabaseClient'
import React from 'react'

// Update Task interface
interface Task { 
  task_id: number; 
  title: string; 
  status: 'pending' | 'completed';
  is_stressful: boolean;
}

interface Chapter {
  chapter_id: number
  title: string
  completed: boolean
  is_stressful: boolean
}

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
          // ***** FIX: Cast the fetched data to the correct Task[] type *****
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
    const newStatus = taskToToggle.status === 'completed' ? 'pending' : 'completed';
    const updatedTasks = tasks.map(t => t.task_id === taskId ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);
    await supabase.from('tasks').update({ status: newStatus }).eq('task_id', taskId);
  };

  return (
    <div
      style={{ ...styles.container, ...(chapter.completed ? styles.containerCompleted : {}) }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.mainRow}>
        <div
          style={styles.titleContainer}
          onClick={() => !chapter.completed && setIsExpanded(!isExpanded)}
        >
          <ChevronDown size={18} style={{ ...styles.chevron, ...(isExpanded ? styles.chevronExpanded : {}) }} />
          {chapter.is_stressful && <AlertTriangle size={16} style={{color: '#f59e0b'}} title="This chapter may be stressful"/>}
          <span style={{ ...styles.taskName, ...(chapter.completed ? styles.taskNameCompleted : {}) }}>
            {chapter.title}
          </span>
        </div>
        <div style={styles.actionsContainer}>
          {isHovered && !chapter.completed && (
            <EditDeleteIcons onEdit={() => onEdit(chapter)} onDelete={() => onDelete(chapter.chapter_id)} />
          )}
          <div onClick={(e) => { e.stopPropagation(); onToggleComplete(chapter.chapter_id, false); }} style={styles.checkboxContainer}>
            <div style={{ ...styles.checkmark, ...(chapter.completed ? styles.checkmarkCompleted : {}) }}>✓</div>
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
                <div key={task.task_id} style={styles.subTaskItem} onClick={() => handleToggleTask(task.task_id)}>
                    <div style={{...styles.subTaskCheckmark, ...(task.status === 'completed' ? styles.subTaskCheckmarkCompleted : {})}}></div>
                    {task.is_stressful && <AlertTriangle size={14} style={{color: '#f59e0b', flexShrink: 0}} title="This task may be stressful"/>}
                    <span style={{...styles.subTaskName, ...(task.status === 'completed' ? styles.subTaskNameCompleted : {})}}>{task.title}</span>
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
    backgroundColor: '#ffffff', borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    borderWidth: '1px', borderStyle: 'solid', borderColor: '#f1f5f9',
    transition: 'all 0.4s ease-in-out', flexShrink: 0,
  },
  containerCompleted: { backgroundColor: '#e0f2fe', opacity: 0.7, transform: 'scale(0.98)', boxShadow: 'none' },
  mainRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' },
  titleContainer: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer' },
  chevron: { color: '#94a3b8', transition: 'transform 0.3s ease-in-out', flexShrink: 0 },
  chevronExpanded: { transform: 'rotate(180deg)' },
  taskName: { fontWeight: 500, color: '#1e293b', transition: 'all 0.4s ease-in-out' },
  taskNameCompleted: { color: '#64748b', textDecoration: 'line-through', textDecorationColor: '#94a3b8' },
  actionsContainer: { display: 'flex', alignItems: 'center', gap: '8px' },
  checkboxContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  checkmark: {
    width: '22px', height: '22px', borderRadius: '50%',
    borderWidth: '2px', borderStyle: 'solid', borderColor: '#cbd5e1',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'transparent', fontSize: '16px', fontWeight: 'bold',
    transition: 'all 0.4s ease-in-out',
  },
  checkmarkCompleted: { backgroundColor: '#22c55e', borderColor: '#22c55e', color: 'white', transform: 'scale(1.1)' },
  tasksContainer: { padding: '12px 16px 16px 42px', borderTop: '1px solid #f0f4f8' },
  placeholderText: { fontSize: '14px', color: '#64748b', fontStyle: 'italic' },
  subTaskList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  subTaskItem: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  subTaskCheckmark: {
    width: '16px', height: '16px', borderRadius: '4px',
    borderWidth: '2px', borderStyle: 'solid', borderColor: '#94a3b8',
    transition: 'all 0.3s ease',
    flexShrink: 0,
  },
  subTaskCheckmarkCompleted: { backgroundColor: '#a7f3d0', borderColor: '#059669' },
  subTaskName: { fontSize: '14px', color: '#334155', transition: 'all 0.3s ease' },
  subTaskNameCompleted: { color: '#94a3b8', textDecoration: 'line-through' },
}
