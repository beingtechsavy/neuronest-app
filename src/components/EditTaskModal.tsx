'use client'

import { useState, useEffect } from 'react'

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  // ***** FIX: onSave now sends an object with all possible updates *****
  onSave: (updates: { title: string; effort_units: number; scheduled_date: string }) => Promise<void>
  currentTitle: string
  currentEffort: number
  // ***** NEW: Pass the current scheduled date *****
  currentDate: string 
}

export default function EditTaskModal({ isOpen, onClose, onSave, currentTitle, currentEffort, currentDate }: EditTaskModalProps) {
  const [title, setTitle] = useState(currentTitle)
  const [hours, setHours] = useState('0')
  const [minutes, setMinutes] = useState('0')
  // ***** NEW: State for the date input *****
  const [date, setDate] = useState(currentDate);
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle)
      setDate(currentDate); // Set the date when the modal opens
      const h = Math.floor(currentEffort / 60);
      const m = currentEffort % 60;
      setHours(String(h));
      setMinutes(String(m));
    }
  }, [currentTitle, currentEffort, currentDate, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);

    if (!title.trim()) {
      onClose()
      return
    }
    setLoading(true)
    // ***** FIX: Pass an object with title, effort, and the new date *****
    await onSave({ 
        title, 
        effort_units: totalMinutes > 0 ? totalMinutes : 50,
        scheduled_date: date
    })
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.header}>Edit Task</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label htmlFor="taskTitle" style={styles.label}>Task Title</label>
            <input
              id="taskTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
              autoFocus
            />
          </div>

          {/* ***** NEW: Date and Effort inputs side-by-side ***** */}
          <div style={styles.splitGroup}>
            <div style={{flex: 3}}>
                <label htmlFor="date" style={styles.label}>Date</label>
                <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />
            </div>
            <div style={{flex: 2}}>
                <label style={styles.label}>Effort</label>
                <div style={styles.timeInputContainer}>
                    <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} style={styles.timeInput} placeholder="h" min="0" />
                    <span>h</span>
                    <input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} style={styles.timeInput} placeholder="m" min="0" max="59" />
                    <span>m</span>
                </div>
            </div>
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" onClick={onClose} style={styles.cancelButton} disabled={loading}>
              Cancel
            </button>
            <button type="submit" style={styles.saveButton} disabled={loading || !title.trim()}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
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
    zIndex: 6000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#1e293b', padding: '2rem', borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    width: '100%', maxWidth: '450px', border: '1px solid #334155',
  },
  header: {
    color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 'bold',
    textAlign: 'center', marginBottom: '2rem',
  },
  inputGroup: { marginBottom: '1.5rem' },
  splitGroup: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-end' },
  label: {
    display: 'block', color: '#cbd5e1',
    marginBottom: '0.5rem', fontSize: '0.875rem',
  },
  input: {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
    backgroundColor: '#334155', border: '1px solid #475569',
    color: '#f1f5f9', fontSize: '1rem', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  },
  timeInputContainer: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    backgroundColor: '#334155', border: '1px solid #475569',
    borderRadius: '8px', padding: '0.75rem 1rem', color: '#f1f5f9',
  },
  timeInput: {
    backgroundColor: 'transparent', border: 'none', color: '#f1f5f9',
    width: '40px', textAlign: 'center', fontSize: '1rem', outline: 'none',
  },
  buttonGroup: {
    display: 'flex', justifyContent: 'flex-end',
    gap: '1rem', marginTop: '2rem',
  },
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
