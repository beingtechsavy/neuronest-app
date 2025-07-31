'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/SideBar'
import TaskBox from '@/components/TaskBox'
import SubjectModal from '@/components/SubjectModal'
import UsernameModal from '@/components/UsernameModal'
import { PlusCircle } from 'lucide-react'

interface Subject {
  subject_id: number
  title: string
  color: string
  is_stressful: boolean
}

interface Profile {
    username: string | null;
}

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const fetchSubjects = async (userId: string) => {
    const { data, error } = await supabase
      .from('subjects')
      .select('subject_id, title, color, is_stressful')
      .eq('user_id', userId)
      .order('subject_id', { ascending: true })

    if (error) throw new Error('Failed to load subjects');
    setSubjects(data || [])
  }

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
        throw new Error('Failed to load profile');
    }

    if (!data || !data.username) {
        setIsUsernameModalOpen(true);
    }
    setProfile(data);
  }

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.replace('/login');
            return;
        }
        try {
            await fetchProfile(user.id);
            await fetchSubjects(user.id);
        // ***** FIX: Correctly typed the catch block to satisfy the linter *****
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("An unknown error occurred.");
            }
        } finally {
            setLoading(false);
        }
    }
    loadData()
  }, [router])

  const handleOpenAddModal = () => {
      setEditingSubject(null)
      setIsSubjectModalOpen(true)
  }

  const handleOpenEditModal = (subject: Subject) => {
      setEditingSubject(subject)
      setIsSubjectModalOpen(true)
  }

  const handleSaveSubject = async ({ title, color, is_stressful }: { title: string, color: string, is_stressful: boolean }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingSubject) {
        await supabase.from('subjects').update({ title, color, is_stressful }).eq('subject_id', editingSubject.subject_id);
    } else {
        await supabase.from('subjects').insert({ title, color, is_stressful, user_id: user.id });
    }
    await fetchSubjects(user.id);
    setIsSubjectModalOpen(false);
  }

  const handleDeleteSubject = async (subjectId: number) => {
      if (window.confirm("Are you sure? This will delete the subject and all its chapters and tasks.")) {
          await supabase.from('subjects').delete().eq('subject_id', subjectId);
          const { data: { user } } = await supabase.auth.getUser();
        if (user) await fetchSubjects(user.id);
      }
  }

  const handleSaveUsername = async (username: string) => {
    setIsSavingUsername(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setError("You must be logged in to set a username.");
        setIsSavingUsername(false);
        return;
    }

    const { error } = await supabase
        .from('profiles')
        .upsert({ 
            id: user.id, 
            username, 
            updated_at: new Date().toISOString() 
        })
        .select()

    if (error) {
        setError("Failed to save username. It might already be taken.");
    } else {
        setProfile({ username });
        setIsUsernameModalOpen(false);
    }
    setIsSavingUsername(false);
  }

  if (loading) return (
    <div style={styles.loadingContainer}><div style={styles.loadingSpinner}></div></div>
  )

  if (error) return (
    <div style={styles.errorContainer}><p style={styles.errorText}>{error}</p></div>
  )

  return (
    <>
      <UsernameModal 
        isOpen={isUsernameModalOpen}
        onSave={handleSaveUsername}
        loading={isSavingUsername}
      />
      <SubjectModal 
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSave={handleSaveSubject}
        subjectToEdit={editingSubject}
      />
      <div style={styles.layoutContainer}>
        <Sidebar />
        <div style={styles.mainWrapper}>
          <main style={styles.mainContent}>
            <div style={styles.contentInner}>
              <div style={styles.headerContainer}>
                <h1 style={styles.greeting}>Hi {profile?.username || 'there'} 👋</h1>
                <button onClick={handleOpenAddModal} style={styles.addSubjectButton}>
                    <PlusCircle size={20} />
                    <span>Add Subject</span>
                </button>
              </div>
              <div style={styles.cardsContainer}>
                {subjects.map(subject => (
                  <TaskBox
                    key={subject.subject_id}
                    subject={subject}
                    onEdit={() => handleOpenEditModal(subject)}
                    onDelete={() => handleDeleteSubject(subject.subject_id)}
                  />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  layoutContainer: { display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a' },
  mainWrapper: { flex: 1, marginLeft: '240px', minHeight: '100vh', overflow: 'auto' },
  mainContent: { padding: '2rem', minHeight: '100vh', color: '#ffffff' },
  contentInner: { 
    maxWidth: '1200px', 
    margin: '0 auto', 
  },
  loadingContainer: { minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingSpinner: { width: '40px', height: '40px', border: '3px solid #1e293b', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  errorContainer: { minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#f87171', fontSize: '1rem' },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '3rem',
  },
  greeting: { fontSize: '2.5rem', fontWeight: 600, color: '#f1f5f9' },
  addSubjectButton: {
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      backgroundColor: '#4f46e5', color: 'white',
      padding: '0.75rem 1.25rem', borderRadius: '0.75rem',
      border: 'none', cursor: 'pointer', fontWeight: 600,
  },
  cardsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: '2rem',
  },
}
// hi