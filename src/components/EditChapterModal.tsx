'use client'

import { useState, useEffect } from 'react'
import { Button, Checkbox, Input, Modal, ModalActions } from '@/components/ui'

interface ChapterToEdit {
    title: string;
    is_stressful?: boolean;
}

interface EditChapterModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { title: string, is_stressful: boolean }) => Promise<void>
  chapterToEdit: ChapterToEdit
}

export default function EditChapterModal({ isOpen, onClose, onSave, chapterToEdit }: EditChapterModalProps) {
  const [title, setTitle] = useState(chapterToEdit.title)
  const [isStressful, setIsStressful] = useState(chapterToEdit.is_stressful || false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTitle(chapterToEdit.title)
      setIsStressful(chapterToEdit.is_stressful || false)
    }
  }, [chapterToEdit, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      onClose()
      return
    }
    setLoading(true)
    await onSave({ title, is_stressful: isStressful })
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit area">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Area name"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
            {loading ? 'Saving…' : 'Save changes'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  )
}
