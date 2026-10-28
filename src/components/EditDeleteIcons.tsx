'use client'

import { Pencil, Trash2 } from 'lucide-react'

interface EditDeleteIconsProps {
  onEdit: () => void
  onDelete: () => void
  label?: string
}

const iconButton =
  'flex h-11 w-11 items-center justify-center rounded-lg text-[#949BA4] transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2B2D31]'

export default function EditDeleteIcons({ onEdit, onDelete, label }: EditDeleteIconsProps) {
  const suffix = label ? ` ${label}` : ''
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation() // Prevent the task from being toggled
          onEdit()
        }}
        aria-label={`Edit${suffix}`}
        className={`${iconButton} hover:bg-[#383A40] hover:text-[#F2F3F5]`}
      >
        <Pencil size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        aria-label={`Delete${suffix}`}
        className={`${iconButton} hover:bg-[#ED4245]/10 hover:text-[#FF6B6B]`}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
