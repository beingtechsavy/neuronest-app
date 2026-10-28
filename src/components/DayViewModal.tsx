'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import EditDeleteIcons from './EditDeleteIcons' // We will reuse this component
import { Button, Input, Modal } from '@/components/ui'

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
    <Modal isOpen={isOpen} onClose={onClose} title={formattedDate} size="lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#DBDEE1]">Tasks for today</h3>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          aria-expanded={showAddForm}
          className="flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-[#2DD4BF] transition-colors hover:bg-[#14B8A6]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
        >
          <Plus size={16} aria-hidden="true" />
          Add task
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddTaskSubmit} className="mb-4 flex items-end gap-2">
          <Input
            label="New task"
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What needs doing?"
            autoFocus
            maxLength={160}
          />
          <Button type="submit" disabled={!newTaskTitle.trim()} className="mb-0.5 shrink-0">
            Add
          </Button>
        </form>
      )}

      {tasks.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {tasks.map(task => (
            <li
              key={task.task_id}
              className="group flex items-center justify-between gap-3 rounded-xl border border-[#3F4147] bg-[#1E1F22] px-3 py-2.5"
            >
              <span className="min-w-0 break-words text-sm text-[#F2F3F5]">{task.title}</span>
              <span className="shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                <EditDeleteIcons
                  onEdit={() => onEditTask(task)}
                  onDelete={() => onDeleteTask(task.task_id)}
                />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-8 text-center text-sm text-[#949BA4]">
          No tasks scheduled for this day.
        </p>
      )}
    </Modal>
  )
}
