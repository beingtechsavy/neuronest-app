'use client'

import { useState, useEffect } from 'react'
import { Button, Checkbox, Input, Modal, ModalActions } from '@/components/ui'

interface AddChapterModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: { title: string, is_stressful: boolean }) => Promise<void>
}

export default function AddChapterModal({ isOpen, onClose, onAdd }: AddChapterModalProps) {
  const [title, setTitle] = useState('')
  const [isStressful, setIsStressful] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setIsStressful(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    await onAdd({ title, is_stressful: isStressful })
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add an area">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Area name"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Physics — Kinematics"
          required
          autoFocus
          maxLength={120}
        />
        <Checkbox
          label="Mark as a potentially stressful area"
          checked={isStressful}
          onChange={setIsStressful}
        />
        <ModalActions>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !title.trim()}>
            {loading ? 'Adding…' : 'Add area'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  )
}
