'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import TaskBox from '@/components/TaskBox';
import SubjectModal from '@/components/SubjectModal';
import SetUsernameModal from '@/components/SetUsernameModal';
import FocusSessionWidget from '@/components/FocusSessionWidget';
import { PlusCircle, Loader2 } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface Subject {
  subject_id: number;
  title: string;
  color: string;
  is_stressful: boolean;
}

interface Profile {
  username: string | null;
}

// --- MAIN COMPONENT ---
export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);

  // --- DATA FETCHING ---
  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      // Fetch profile and subjects in parallel
      const [profileRes, subjectsRes] = await Promise.all([
        supabase.from('profiles').select('username').eq('id', user.id).single(),
        supabase.from('subjects').select('*').eq('user_id', user.id).order('subject_id')
      ]);

      if (profileRes.error && profileRes.error.code !== 'PGRST116') throw profileRes.error;
      if (subjectsRes.error) throw subjectsRes.error;

      if (!profileRes.data || !profileRes.data.username) {
        setIsUsernameModalOpen(true);
      }
      setProfile(profileRes.data);
      setSubjects(subjectsRes.data || []);

    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      console.error('Dashboard error:', e);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- EVENT HANDLERS ---
  const handleSaveSubject = async ({ title, color, is_stressful }: Omit<Subject, 'subject_id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const subjectData = { title, color, is_stressful, user_id: user.id };
    
    if (editingSubject) {
      await supabase.from('subjects').update(subjectData).eq('subject_id', editingSubject.subject_id);
    } else {
      await supabase.from('subjects').insert(subjectData);
    }
    await fetchDashboardData();
    setIsSubjectModalOpen(false);
    setEditingSubject(null);
  };

  const handleDeleteSubject = async (subjectId: number) => {
    // Note: window.confirm is often replaced with a custom modal in production apps
    if (window.confirm("Are you sure? This will delete the subject and all its chapters and tasks.")) {
      await supabase.from('subjects').delete().eq('subject_id', subjectId);
      await fetchDashboardData();
    }
  };

  const handleSaveUsernameSuccess = (newUsername: string) => {
    setProfile({ username: newUsername });
    setIsUsernameModalOpen(false);
  };

  // --- RENDER LOGIC ---
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      <SetUsernameModal 
        isOpen={isUsernameModalOpen}
        onClose={() => setIsUsernameModalOpen(false)}
        onSaveSuccess={handleSaveUsernameSuccess}
      />
      <SubjectModal 
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSave={handleSaveSubject}
        subjectToEdit={editingSubject}
      />
      
      {/* Main content area */}
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-12">
            <h1 className="text-4xl font-bold text-white">
              Hi {profile?.username || 'there'} 👋
            </h1>
            <button
              onClick={() => { setEditingSubject(null); setIsSubjectModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors"
            >
              <PlusCircle size={20} />
              <span>Add Subject</span>
            </button>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Focus Session Widget */}
            <div className="lg:col-span-1">
              <FocusSessionWidget />
            </div>
            
            {/* Quick Stats */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Quick Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{subjects.length}</div>
                    <div className="text-sm opacity-80">Subjects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {subjects.filter(s => s.is_stressful).length}
                    </div>
                    <div className="text-sm opacity-80">High Priority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">5</div>
                    <div className="text-sm opacity-80">Focus Sessions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-2 gap-6">
            {subjects.map(subject => (
              <TaskBox
                key={subject.subject_id}
                subject={subject}
                onEdit={() => { setEditingSubject(subject); setIsSubjectModalOpen(true); }}
                onDelete={() => handleDeleteSubject(subject.subject_id)}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
