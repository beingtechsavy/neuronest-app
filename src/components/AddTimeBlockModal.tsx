'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Modal, ModalActions } from '@/components/ui'

interface AddTimeBlockModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (block: { title: string; startTime: string; endTime: string }) => Promise<void>
  selectedDateTime: Date | null
}

export default function AddTimeBlockModal({ isOpen, onClose, onSave, selectedDateTime }: AddTimeBlockModalProps) {
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedDateTime) {
      // Use UTC hours here for consistency
      const startHour = String(selectedDateTime.getUTCHours()).padStart(2, '0')
      const endHour = String(selectedDateTime.getUTCHours() + 1).padStart(2, '0')
      setStartTime(`${startHour}:00`)
      setEndTime(`${endHour}:00`)
      setTitle('')
    }
  }, [selectedDateTime, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    await onSave({ title, startTime, endTime })
    setLoading(false)
  }

  if (!isOpen) return null

  const formattedDate = selectedDateTime
    ? new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(selectedDateTime)
    : ''

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add an event"
      description={formattedDate || undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
          required
          maxLength={120}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Start time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
          <Input label="End time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !title.trim()}>
            {loading ? 'Saving…' : 'Save event'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  )
}
