'use client'

import { useState, useEffect } from 'react'

const colorOptions = [
  '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#78716c',
];

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
}

export default function SubjectModal({ isOpen, onClose, onSave, subjectToEdit }: SubjectModalProps) {
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(colorOptions[8])
  const [isStressful, setIsStressful] = useState(false) // New state for the warning
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (subjectToEdit) {
        setTitle(subjectToEdit.title)
        setColor(subjectToEdit.color)
        setIsStressful(subjectToEdit.is_stressful || false)
      } else {
        setTitle('')
        setColor(colorOptions[8])
        setIsStressful(false)
      }
    }
  }, [isOpen, subjectToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    await onSave({ title, color, is_stressful: isStressful })
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.header}>{subjectToEdit ? 'Edit Subject' : 'Add New Subject'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label htmlFor="subjectTitle" style={styles.label}>Subject Title</label>
            <input id="subjectTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} required autoFocus />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Color</label>
            <div style={styles.colorGrid}>
              {colorOptions.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ ...styles.colorSwatch, backgroundColor: c, ...(color === c ? styles.colorSwatchSelected : {}) }}
                />
              ))}
            </div>
          </div>
          {/* New Stressful Toggle */}
          <div style={styles.inputGroup}>
            <label style={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={isStressful}
                onChange={(e) => setIsStressful(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>Mark as a potentially stressful subject</span>
            </label>
          </div>
          <div style={styles.buttonGroup}>
            <button type="button" onClick={onClose} style={styles.cancelButton} disabled={loading}>Cancel</button>
            <button type="submit" style={styles.saveButton} disabled={loading || !title.trim()}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 4000,
  },
  modal: {
    background: '#1e293b', padding: '2rem', borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', width: '100%',
    maxWidth: '500px', border: '1px solid #334155',
  },
  header: { color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' },
  inputGroup: { marginBottom: '1.5rem' },
  label: { display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.875rem' },
  input: {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
    backgroundColor: '#334155', border: '1px solid #475569',
    color: '#f1f5f9', fontSize: '1rem', outline: 'none',
    boxSizing: 'border-box',
  },
  colorGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' },
  colorSwatch: {
    width: '36px', height: '36px', borderRadius: '50%',
    border: '2px solid transparent', cursor: 'pointer', transition: 'transform 0.2s',
  },
  colorSwatchSelected: { border: '2px solid #ffffff', transform: 'scale(1.1)' },
  checkboxLabel: { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  checkbox: { width: '16px', height: '16px', marginRight: '0.75rem', accentColor: '#a855f7' },
  checkboxText: { color: '#cbd5e1', fontSize: '0.875rem' },
  buttonGroup: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' },
  cancelButton: {
    padding: '0.75rem 1.5rem', borderRadius: '8px',
    border: '1px solid #475569', backgroundColor: 'transparent',
    color: '#cbd5e1', fontWeight: '600', cursor: 'pointer',
  },
  saveButton: {
    padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
    backgroundColor: '#4f46e5', color: 'white', fontWeight: '600',
    cursor: 'pointer',
  },
};
