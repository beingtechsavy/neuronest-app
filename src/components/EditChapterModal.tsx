'use client'

import { useState, useEffect } from 'react'

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
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.header}>Edit Chapter</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label htmlFor="chapterTitle" style={styles.label}>Chapter Title</label>
            <input id="chapterTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} autoFocus />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={isStressful}
                onChange={(e) => setIsStressful(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>Mark as a potentially stressful chapter</span>
            </label>
          </div>
          <div style={styles.buttonGroup}>
            <button type="button" onClick={onClose} style={styles.cancelButton} disabled={loading}>Cancel</button>
            <button type="submit" style={styles.saveButton} disabled={loading || !title.trim()}>{loading ? 'Saving...' : 'Save Changes'}</button>
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
  header: {
    color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 'bold',
    textAlign: 'center', marginBottom: '2rem',
  },
  inputGroup: { marginBottom: '1.5rem' },
  label: {
    display: 'block', color: '#cbd5e1',
    marginBottom: '0.5rem', fontSize: '0.875rem',
  },
  input: {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
    backgroundColor: '#334155', border: '1px solid #475569',
    color: '#f1f5f9', fontSize: '1rem', outline: 'none',
    boxSizing: 'border-box',
  },
  checkboxLabel: { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  checkbox: { width: '16px', height: '16px', marginRight: '0.75rem', accentColor: '#a855f7' },
  checkboxText: { color: '#cbd5e1', fontSize: '0.875rem' },
  buttonGroup: {
    display: 'flex', justifyContent: 'flex-end',
    gap: '1rem', marginTop: '2rem',
  },
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
