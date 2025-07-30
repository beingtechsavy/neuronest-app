'use client'

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'

interface RescheduleDetails {
  title: string;
  newStartTime: Date;
  newEndTime: Date;
}

interface RescheduleConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  // FIX: onConfirm now passes the final times back to the parent
  onConfirm: (finalTimes: { startTime: string, endTime: string }) => void
  details: RescheduleDetails | null
}

export default function RescheduleConfirmModal({ isOpen, onClose, onConfirm, details }: RescheduleConfirmModalProps) {
  // FIX: Add state to manage the time inputs inside the modal
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  // Helper to format a Date object into "HH:mm" string for the input
  const formatToTimeInput = (date: Date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
  }

  // FIX: When the modal opens or the details change, update the time inputs
  useEffect(() => {
    if (details) {
        setStartTime(formatToTimeInput(details.newStartTime));
        setEndTime(formatToTimeInput(details.newEndTime));
    }
  }, [details]);


  if (!isOpen || !details) return null

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const handleConfirmClick = () => {
      onConfirm({ startTime, endTime });
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.header}>Confirm Reschedule</h3>
        <p style={styles.taskTitle}>"{details.title}"</p>
        <p style={styles.details}>Move to:</p>
        <p style={styles.newDate}>{formatDate(details.newStartTime)}</p>
        
        {/* FIX: Replaced static time display with interactive time inputs */}
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
          <button onClick={onClose} style={{...styles.button, ...styles.cancelButton}}><X size={18}/> Cancel</button>
          <button onClick={handleConfirmClick} style={{...styles.button, ...styles.confirmButton}}><Check size={18}/> Confirm</button>
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
  newDate: { color: '#ffffff', fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' },
  timeGroup: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', textAlign: 'left' },
  label: { display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.875rem' },
  input: {
    width: '100%', padding: '0.5rem', borderRadius: '8px',
    backgroundColor: '#334155', border: '1px solid #475569',
    color: '#f1f5f9', fontSize: '1rem', outline: 'none',
    boxSizing: 'border-box',
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
