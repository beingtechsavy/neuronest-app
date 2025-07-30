'use client'

import { X, Trash2, Clock } from 'lucide-react'

interface TimeBlock {
  block_id: number;
  title: string;
  start_time: string;
  end_time: string;
}

interface TimeBlockDetailModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: (blockId: number) => void
  block: TimeBlock | null
}

export default function TimeBlockDetailModal({ isOpen, onClose, onDelete, block }: TimeBlockDetailModalProps) {
  if (!isOpen || !block) return null

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{...styles.colorBar}}></div>
        <button onClick={onClose} style={styles.closeButton}>
          <X size={20} />
        </button>
        
        <div style={styles.content}>
            <h2 style={styles.title}>{block.title}</h2>

            <div style={styles.detailItem}>
                <Clock size={16} style={styles.icon} />
                <span style={styles.detailText}>{formatTime(block.start_time)} - {formatTime(block.end_time)}</span>
            </div>

            <button onClick={() => onDelete(block.block_id)} style={styles.deleteButton}>
                <Trash2 size={16} />
                Delete Event
            </button>
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 5000, backdropFilter: 'blur(8px)',
  },
  modal: {
    background: '#1e293b',
    borderRadius: '16px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
    width: '90%',
    maxWidth: '400px',
    border: '1px solid #334155',
    color: '#e2e8f0',
    overflow: 'hidden',
    position: 'relative',
  },
  colorBar: {
    height: '8px',
    width: '100%',
    backgroundColor: '#4ade80', // Green for appointments
  },
  closeButton: {
    position: 'absolute', top: '16px', right: '16px',
    background: 'rgba(71, 85, 105, 0.5)', border: 'none',
    color: '#e2e8f0', cursor: 'pointer', borderRadius: '50%',
    width: '32px', height: '32px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  content: {
    padding: '1.5rem 2rem 2rem 2rem',
  },
  title: {
    fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff',
    marginBottom: '1.5rem', paddingRight: '40px',
  },
  detailItem: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    marginBottom: '1.5rem',
  },
  icon: {
    color: '#94a3b8', flexShrink: 0,
  },
  detailText: {
    fontSize: '1rem', color: '#cbd5e1',
  },
  deleteButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }
}
