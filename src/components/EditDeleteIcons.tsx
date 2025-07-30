'use client'

import { Pencil, Trash2 } from 'lucide-react'

interface EditDeleteIconsProps {
  onEdit: () => void
  onDelete: () => void
}

export default function EditDeleteIcons({ onEdit, onDelete }: EditDeleteIconsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation() // Prevent the task from being toggled
          onEdit()
        }}
        className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
        title="Edit chapter"
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-100 transition-all"
        title="Delete chapter"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
