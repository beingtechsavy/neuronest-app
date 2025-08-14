'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { trackTaskCreated } from '@/lib/analytics';

interface Subject {
  subject_id: number;
  title: string;
  chapters: Chapter[];
}

interface Chapter {
  chapter_id: number;
  title: string;
}

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
}

export default function NewTaskModal({ isOpen, onClose, onTaskAdded }: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('50');
  const [isStressful, setIsStressful] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch subjects and chapters when modal opens
  useEffect(() => {
    if (!isOpen) return;

    async function fetchSubjects() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('subjects')
        .select('subject_id, title, chapters (chapter_id, title)')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching subjects:', error);
      } else {
        setSubjects(data ?? []);
      }
    }

    fetchSubjects();

    // Reset form on modal open
    setTitle('');
    setDeadline('');
    setHours('0');
    setMinutes('50');
    setIsStressful(false);
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setChapters([]);
  }, [isOpen]);

  // Update chapters list when selected subject changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      setSelectedChapterId('');
      return;
    }
    const subject = subjects.find(sub => sub.subject_id === parseInt(selectedSubjectId));
    setChapters(subject?.chapters ?? []);
    setSelectedChapterId('');
  }, [selectedSubjectId, subjects]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a valid task title.');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('User is not authenticated.');
      setLoading(false);
      return;
    }

    // Calculate total effort in minutes; default to 50 if zero or invalid
    const totalMinutes =
      (parseInt(hours) || 0) * 60 +
      (parseInt(minutes) || 0) || 50;

    const insertPayload = {
      title: title.trim(),
      deadline: deadline || null,
      effort_units: totalMinutes > 0 ? totalMinutes : 50,
      is_stressful: isStressful,
      chapter_id: selectedChapterId ? parseInt(selectedChapterId) : null,
      user_id: user.id,
      status: 'pending',
    };

    const { error } = await supabase.from('tasks').insert(insertPayload);

    if (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } else {
      // Track task creation
      trackTaskCreated({
        hasStressMarking: isStressful,
        hasTimeSlot: false // New tasks don't have time slots initially
      });
      onTaskAdded();
      onClose();
    }
    setLoading(false);
  }

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div
        style={styles.modal}
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
      >
        <h2 id="modal-title" style={styles.header}>Add a New Task</h2>
        <form onSubmit={handleSubmit} style={styles.form}>

          <div style={styles.inputGroup}>
            <label htmlFor="task-title" style={styles.label}>Title</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={styles.input}
              required
              autoFocus
              placeholder="Enter task title"
            />
          </div>

          <div style={styles.gridGroup}>
            <div style={styles.inputGroup}>
              <label htmlFor="subject" style={styles.label}>Subject</label>
              <select
                id="subject"
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                style={styles.input}
              >
                <option value="">No Subject</option>
                {subjects.map(subject => (
                  <option key={subject.subject_id} value={subject.subject_id}>{subject.title}</option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="chapter" style={styles.label}>Chapter</label>
              <select
                id="chapter"
                value={selectedChapterId}
                onChange={e => setSelectedChapterId(e.target.value)}
                style={styles.input}
                disabled={!selectedSubjectId}
              >
                <option value="">No Chapter</option>
                {chapters.map(chapter => (
                  <option key={chapter.chapter_id} value={chapter.chapter_id}>{chapter.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.gridGroup}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Effort</label>
              <div style={styles.timeInputContainer}>
                <input
                  type="number"
                  min="0"
                  max="23"
                  step="1"
                  value={hours}
                  onChange={e => setHours(e.target.value)}
                  style={styles.input}
                  aria-label="Effort hours"
                  placeholder="Hours"
                />
                <span style={styles.timeUnit}>h</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={minutes}
                  onChange={e => setMinutes(e.target.value)}
                  style={styles.input}
                  aria-label="Effort minutes"
                  placeholder="Minutes"
                />
                <span style={styles.timeUnit}>m</span>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="deadline" style={styles.label}>Deadline</label>
              <input
                id="deadline"
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isStressful}
              onChange={e => setIsStressful(e.target.checked)}
              style={styles.checkbox}
            />
            Mark as stressful task
          </label>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.saveButton}
              disabled={loading || !title.trim()}
            >
              {loading ? 'Saving...' : 'Add Task'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

const styles: {[key: string]: React.CSSProperties} = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4000,
  },
  modal: {
    background: '#1e293b',
    padding: '1.5rem',
    borderRadius: 12,
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    width: '90%',
    maxWidth: 450,
    border: '1px solid #334155',
  },
  header: {
    color: '#f1f5f9',
    fontSize: "1.25rem",
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  gridGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  label: {
    color: '#94a3b8',
    marginBottom: '0.25rem',
    fontSize: '0.8rem',
  },
  input: {
    backgroundColor: '#334155',
    border: '1px solid #475569',
    borderRadius: 6,
    color: '#f1f5f9',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  timeInputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  timeUnit: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  checkboxLabel: {
    marginTop: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    color: '#cbd5e1',
    fontSize: '0.875rem',
  },
  checkbox: {
    width: 14,
    height: 14,
    accentColor: '#a855f7',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
    borderTop: '1px solid #334155',
    paddingTop: 16,
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    borderRadius: 6,
    border: '1px solid #475569',
    backgroundColor: 'transparent',
    color: '#cbd5e1',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  saveButton: {
    padding: '0.5rem 1rem',
    borderRadius: 6,
    border: 'none',
    backgroundColor: '#4f46e5',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.875rem',
  }
};
