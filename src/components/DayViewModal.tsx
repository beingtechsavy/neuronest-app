'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import EditDeleteIcons from './EditDeleteIcons' // We will reuse this component

// Define the shape of a Task object
interface CalendarTask {
  task_id: number
  title: string
  scheduled_date: string
}

interface DayViewModalProps {
  isOpen: boolean
  onClose: () => void
  tasks: CalendarTask[]
  selectedDate: Date | null
  onAddTask: (title: string) => void
  // New props for edit and delete
  onEditTask: (task: CalendarTask) => void
  onDeleteTask: (taskId: number) => void
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export default function DayViewModal({ isOpen, onClose, tasks, selectedDate, onAddTask, onEditTask, onDeleteTask }: DayViewModalProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null)

  if (!isOpen || !selectedDate) return null

  const formattedDate = `${months[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    onAddTask(newTaskTitle.trim())
    setNewTaskTitle('')
    setShowAddForm(false)
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.headerTitle}>{formattedDate}</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={20} />
          </button>
        </div>
        <div style={styles.content}>
          <div style={styles.addTaskHeader}>
            <h4 style={styles.tasksHeadline}>Tasks for today</h4>
            <button onClick={() => setShowAddForm(!showAddForm)} style={styles.toggleAddTaskButton}>
              <Plus size={16} /> Add Task
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddTaskSubmit} style={styles.addTaskForm}>
              <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Enter new task title..." style={styles.addTaskInput} autoFocus />
              <button type="submit" style={styles.addTaskButton}>Add</button>
            </form>
          )}

          {tasks.length > 0 ? (
            <ul style={styles.taskList}>
              {tasks.map(task => (
                <li
                  key={task.task_id}
                  style={styles.taskItem}
                  onMouseEnter={() => setHoveredTaskId(task.task_id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                >
                  <span>{task.title}</span>
                  {hoveredTaskId === task.task_id && (
                    <EditDeleteIcons
                      onEdit={() => onEditTask(task)}
                      onDelete={() => onDeleteTask(task.task_id)}
                    />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p style={styles.noTasksText}>No tasks scheduled for this day.</p>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#1e293b', padding: '1.5rem', borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', width: '90%',
    maxWidth: '500px', border: '1px solid #334155', color: '#e2e8f0',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '1rem',
  },
  headerTitle: { fontSize: '1.25rem', fontWeight: '600', color: '#ffffff' },
  closeButton: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' },
  content: { maxHeight: '60vh', overflowY: 'auto' },
  addTaskHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  tasksHeadline: { fontSize: '1rem', fontWeight: '600', color: '#cbd5e1' },
  toggleAddTaskButton: {
    display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none',
    color: '#a78bfa', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
  },
  addTaskForm: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  addTaskInput: {
    flex: 1, backgroundColor: '#334155', border: '1px solid #475569',
    color: '#e2e8f0', borderRadius: '6px', padding: '0.5rem 0.75rem',
    fontSize: '0.875rem', outline: 'none',
  },
  addTaskButton: {
    border: 'none', backgroundColor: '#7c3aed', color: 'white',
    padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer',
  },
  taskList: {
    listStyle: 'none', padding: 0, margin: 0, display: 'flex',
    flexDirection: 'column', gap: '0.75rem',
  },
  taskItem: {
    backgroundColor: '#334155', padding: '0.75rem 1rem', borderRadius: '8px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  noTasksText: { textAlign: 'center', padding: '2rem 0', color: '#94a3b8' },
}
