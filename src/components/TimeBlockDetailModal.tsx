'use client'

import { Trash2, Clock, CalendarClock } from 'lucide-react'
import { Button, Modal } from '@/components/ui'

interface TimeBlock {
  block_id: number;
  title: string;
  start_time: string;
  end_time: string;
}

interface TimeBlockDetailModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: (blockId: number) => void
  block: TimeBlock | null
}

export default function TimeBlockDetailModal({ isOpen, onClose, onDelete, block }: TimeBlockDetailModalProps) {
  if (!isOpen || !block) return null

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={block.title} size="sm">
      {/* A labelled "event" marker instead of an 8px colour bar across the top:
          the bar looked like a status stripe with no legend. */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#23A55A]/30 bg-[#23A55A]/10 px-4 py-3">
        <CalendarClock size={18} className="shrink-0 text-[#23A55A]" aria-hidden="true" />
        <span className="text-sm font-medium text-[#DBDEE1]">
          Event · not a task
        </span>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Clock size={16} className="shrink-0 text-[#949BA4]" aria-hidden="true" />
        <span className="text-base text-[#DBDEE1]">
          {formatTime(block.start_time)} – {formatTime(block.end_time)}
        </span>
      </div>

      <Button
        variant="danger"
        fullWidth
        onClick={() => onDelete(block.block_id)}
        aria-label={`Delete time block ${block.title}`}
      >
        <Trash2 size={16} aria-hidden="true" />
        Delete event
      </Button>
    </Modal>
  )
}
