'use client'

import { useState, useEffect, useCallback } from 'react'
import { canCreateSubject, getUserPlanInfo, UserPlanInfo } from '@/lib/subscriptionLimits'
import { Button, Checkbox, Input, Modal, ModalActions } from '@/components/ui'
import UsageLimitModal from './UsageLimitModal'

// Full spectrum so projects stay distinguishable, but every swatch is tuned to
// hold contrast on the #2B2D31 surface without halogen glare.
const colorOptions = [
  { value: '#F2789B', name: 'Pink' },
  { value: '#EFA05C', name: 'Orange' },
  { value: '#FEE75C', name: 'Yellow' },
  { value: '#A9D96C', name: 'Lime' },
  { value: '#23A55A', name: 'Green' },
  { value: '#14B8A6', name: 'Teal' },
  { value: '#5AC8D8', name: 'Cyan' },
  { value: '#5B8DEF', name: 'Blue' },
  { value: '#8B9DF5', name: 'Indigo' },
  { value: '#A98BF0', name: 'Violet' },
  { value: '#BE8FE8', name: 'Purple' },
  { value: '#D98FD0', name: 'Orchid' },
  { value: '#F09AC8', name: 'Rose' },
  { value: '#949BA4', name: 'Grey' },
]

const DEFAULT_COLOR = '#8B9DF5'

interface Subject {
    subject_id?: number;
    title: string;
    color: string;
    is_stressful?: boolean;
}

interface SubjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (subject: { title: string, color: string, is_stressful: boolean }) => Promise<void>
  subjectToEdit?: Subject | null
  userId?: string
}

export default function SubjectModal({ isOpen, onClose, onSave, subjectToEdit, userId }: SubjectModalProps) {
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [isStressful, setIsStressful] = useState(false)
  const [loading, setLoading] = useState(false)

  // Usage limit state
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null)
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false)

  const loadPlanInfo = useCallback(async () => {
    if (!userId) return
    try {
      const info = await getUserPlanInfo(userId)
      setPlanInfo(info)
    } catch (err) {
      console.error('Failed to load plan info:', err)
    }
  }, [userId])

  useEffect(() => {
    if (isOpen) {
      if (subjectToEdit) {
        setTitle(subjectToEdit.title)
        setColor(subjectToEdit.color)
        setIsStressful(subjectToEdit.is_stressful || false)
      } else {
        setTitle('')
        setColor(DEFAULT_COLOR)
        setIsStressful(false)
      }

      // Load plan info when modal opens
      if (userId) {
        loadPlanInfo()
      }
    }
  }, [isOpen, subjectToEdit, userId, loadPlanInfo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    // Check if this is a new subject (not editing) and if user can create more subjects
    if (!subjectToEdit && userId) {
      const canCreate = await canCreateSubject(userId)
      if (!canCreate) {
        setShowUsageLimitModal(true)
        return
      }
    }

    setLoading(true)
    try {
      await onSave({ title, color, is_stressful: isStressful })
    } catch (err: any) {
      if (err?.message?.includes('SUBJECT_LIMIT_REACHED') || err?.code === 'P0001') {
        setShowUsageLimitModal(true)
      } else {
        console.error('Error saving project:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Usage Limit Modal */}
      {planInfo && (
        <UsageLimitModal
          isOpen={showUsageLimitModal}
          onClose={() => setShowUsageLimitModal(false)}
          planInfo={planInfo}
          limitType="subjects"
          onUpgrade={() => {
            window.location.href = '/pricing'
          }}
        />
      )}

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={subjectToEdit ? 'Edit project' : 'Add a project'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Project name"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            maxLength={120}
          />

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-[#DBDEE1]">Colour</legend>
            <div className="grid grid-cols-7 gap-2.5">
              {colorOptions.map((option) => {
                const selected = color === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setColor(option.value)}
                    aria-pressed={selected}
                    aria-label={option.name}
                    title={option.name}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2B2D31] ${
                      selected ? 'ring-2 ring-[#F2F3F5] ring-offset-2 ring-offset-[#2B2D31]' : 'ring-1 ring-black/30'
                    }`}
                    style={{ backgroundColor: option.value }}
                  >
                    {selected && (
                      <span
                        className="h-2 w-2 rounded-full bg-[#1E1F22]"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )
              })}
            </div>
            {/* The swatch no longer grows on selection: scale is a vestibular
                trigger, and the ring alone already carries the selected state. */}
          </fieldset>

          <Checkbox
            label="Mark as high-priority"
            checked={isStressful}
            onChange={setIsStressful}
          />

          <ModalActions>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Saving…' : 'Save'}
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </>
  )
}
