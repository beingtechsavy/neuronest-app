'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

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
      const startHour = String(selectedDateTime.getHours()).padStart(2, '0')
      const endHour = String(selectedDateTime.getHours() + 1).padStart(2, '0')
      setStartTime(`${startHour}:00`)
      setEndTime(`${endHour}:00`)
      setTitle('') // Reset title
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
    : '';

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.header}>Add Event</h2>
        <p style={styles.subHeader}>{formattedDate}</p>
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label htmlFor="blockTitle" style={styles.label}>Title</label>
            <input id="blockTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} autoFocus />
          </div>
          <div style={styles.timeGroup}>
            <div>
              <label htmlFor="startTime" style={styles.label}>Start Time</label>
              <input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={styles.input} />
            </div>
            <div>
              <label htmlFor="endTime" style={styles.label}>End Time</label>
              <input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={styles.input} />
            </div>
          </div>
          <div style={styles.buttonGroup}>
            <button type="button" onClick={onClose} style={styles.cancelButton} disabled={loading}>Cancel</button>
            <button type="submit" style={styles.saveButton} disabled={loading || !title.trim()}>{loading ? 'Saving...' : 'Save Event'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 3000, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#1e293b', padding: '2rem', borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    width: '100%', maxWidth: '450px', border: '1px solid #334155',
  },
  header: { color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' },
  subHeader: { color: '#94a3b8', textAlign: 'center', marginBottom: '2rem', fontSize: '0.875rem' },
  inputGroup: { marginBottom: '1rem' },
  timeGroup: { display: 'flex', gap: '1rem', marginBottom: '1.5rem' },
  label: { display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.875rem' },
  input: {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
    backgroundColor: '#334155', border: '1px solid #475569',
    color: '#f1f5f9', fontSize: '1rem', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  },
  buttonGroup: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' },
  cancelButton: {
    padding: '0.75rem 1.5rem', borderRadius: '8px',
    border: '1px solid #475569', backgroundColor: 'transparent',
    color: '#cbd5e1', fontWeight: '600', cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  saveButton: {
    padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
    backgroundColor: '#4f46e5', color: 'white', fontWeight: '600',
    cursor: 'pointer', transition: 'background-color 0.2s',
  },
};
