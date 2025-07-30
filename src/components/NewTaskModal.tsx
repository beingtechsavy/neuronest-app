'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

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
  isOpen: boolean
  onClose: () => void
  onTaskAdded: () => void
}

export default function NewTaskModal({ isOpen, onClose, onTaskAdded }: NewTaskModalProps) {
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [hours, setHours] = useState('0')
  const [minutes, setMinutes] = useState('50')
  const [isStressful, setIsStressful] = useState(false) // New state
  
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')
  
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  useEffect(() => {
    if (!isOpen) return;

    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingSubjects(false);
        return;
      }

      const { data, error } = await supabase
        .from('subjects')
        .select(`subject_id, title, chapters (chapter_id, title)`)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error fetching subjects for modal:", error);
      } else {
        setSubjects(data || []);
      }
      setLoadingSubjects(false);
    };

    fetchSubjects();
    // Reset form on open
    setTitle('');
    setDeadline('');
    setHours('0');
    setMinutes('50');
    setIsStressful(false);
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setChapters([]);
  }, [isOpen]);

  useEffect(() => {
    if (selectedSubjectId) {
      const subject = subjects.find(s => s.subject_id === parseInt(selectedSubjectId));
      setChapters(subject?.chapters || []);
      setSelectedChapterId('');
    } else {
      setChapters([]);
    }
  }, [selectedSubjectId, subjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please provide a title for the task.");
      return;
    }
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);

    const { error } = await supabase.from('tasks').insert({
      title,
      deadline: deadline || null,
      chapter_id: selectedChapterId ? parseInt(selectedChapterId) : null,
      user_id: user.id,
      status: 'pending',
      effort_units: totalMinutes > 0 ? totalMinutes : 50,
      is_stressful: isStressful, // Save the stressful flag
    });

    if (error) {
        alert("Error: Could not add task.");
        console.error("Task insert error:", error);
    } else {
        onTaskAdded();
        onClose();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.header}>Add a New Task</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label htmlFor="taskTitle" style={styles.label}>Task Title</label>
            <input id="taskTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} required autoFocus />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="subject" style={styles.label}>Subject (Optional)</label>
            <select id="subject" value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} style={styles.input}>
              <option value="">No Subject</option>
              {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.title}</option>)}
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="chapter" style={styles.label}>Chapter (Optional)</label>
            <select id="chapter" value={selectedChapterId} onChange={(e) => setSelectedChapterId(e.target.value)} style={styles.input} disabled={!selectedSubjectId}>
              <option value="">No Chapter</option>
              {chapters.map(c => <option key={c.chapter_id} value={c.chapter_id}>{c.title}</option>)}
            </select>
          </div>
          <div style={styles.splitGroup}>
            <div style={{flex: 2}}>
                <label style={styles.label}>Effort</label>
                <div style={styles.timeInputContainer}>
                    <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} style={styles.timeInput} placeholder="h" />
                    <span>h</span>
                    <input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} style={styles.timeInput} placeholder="m" />
                    <span>m</span>
                </div>
            </div>
            <div style={{flex: 3}}>
                <label htmlFor="deadline" style={styles.label}>Deadline (Optional)</label>
                <input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={styles.input} />
            </div>
          </div>
           <div style={styles.inputGroup}>
            <label style={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={isStressful}
                onChange={(e) => setIsStressful(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>Mark as a potentially stressful task</span>
            </label>
          </div>
          <div style={styles.buttonGroup}>
            <button type="button" onClick={onClose} style={styles.cancelButton} disabled={loading}>Cancel</button>
            <button type="submit" style={styles.saveButton} disabled={loading || !title.trim()}>{loading ? 'Saving...' : 'Add Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
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
  header: {
    color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 'bold',
    textAlign: 'center', marginBottom: '2rem',
  },
  inputGroup: { marginBottom: '1rem' },
  splitGroup: { display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' },
  label: {
    display: 'block', color: '#cbd5e1', marginBottom: '0.5rem',
    fontSize: '0.875rem',
  },
  input: {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
    backgroundColor: '#334155', border: '1px solid #475569',
    color: '#f1f5f9', fontSize: '1rem', outline: 'none',
    boxSizing: 'border-box',
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
  checkboxLabel: { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  checkbox: { width: '16px', height: '16px', marginRight: '0.75rem', accentColor: '#a855f7' },
  checkboxText: { color: '#cbd5e1', fontSize: '0.875rem' },
  buttonGroup: {
    display: 'flex', justifyContent: 'flex-end', gap: '1rem',
    marginTop: '2rem',
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
