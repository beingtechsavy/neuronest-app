'use client'

import { Check, X } from 'lucide-react'
import React from 'react'

interface RescheduleDetails {
  title: string;
  newStartTime: Date;
  newEndTime: Date;
}

interface RescheduleConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  details: RescheduleDetails | null
}

export default function RescheduleConfirmModal({ isOpen, onClose, onConfirm, details }: RescheduleConfirmModalProps) {
  if (!isOpen || !details) return null

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });


  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.header}>Confirm Reschedule</h3>
        <p style={styles.taskTitle}>&ldquo;{details.title}&rdquo;</p>
        <p style={styles.details}>Move to:</p>
        <p style={styles.newDate}>{formatDate(details.newStartTime)}</p>
        
        <div style={styles.timeDisplay}>
            {formatTime(details.newStartTime)} - {formatTime(details.newEndTime)}
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={onClose} style={{...styles.button, ...styles.cancelButton}}><X size={18}/> Cancel</button>
          <button onClick={onConfirm} style={{...styles.button, ...styles.confirmButton}}><Check size={18}/> Confirm</button>
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 6000,
  },
  modal: {
    background: '#1e293b', padding: '2rem', borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', width: '90%',
    maxWidth: '400px', border: '1px solid #334155', textAlign: 'center',
  },
  header: { color: '#f1f5f9', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' },
  taskTitle: { color: '#a78bfa', fontWeight: '600', marginBottom: '1.5rem', fontSize: '1.1rem' },
  details: { color: '#94a3b8', fontSize: '0.875rem' },
  newDate: { color: '#ffffff', fontSize: '1rem', fontWeight: '500' },
  timeDisplay: { 
    color: '#ffffff', 
    fontSize: '1rem', 
    fontWeight: '500', 
    marginBottom: '1.5rem',
    backgroundColor: '#334155',
    padding: '0.5rem',
    borderRadius: '8px',
    marginTop: '0.5rem'
  },
  buttonGroup: { display: 'flex', gap: '1rem', marginTop: '1.5rem' },
  button: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.5rem', padding: '0.75rem', borderRadius: '8px',
    border: 'none', fontWeight: '600', cursor: 'pointer',
  },
  cancelButton: { backgroundColor: '#334155', color: '#cbd5e1' },
  confirmButton: { backgroundColor: '#4f46e5', color: 'white' },
};
