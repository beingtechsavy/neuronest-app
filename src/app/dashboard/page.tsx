'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';
import TaskBox from '@/components/TaskBox';
import SubjectModal from '@/components/SubjectModal';
import SetUsernameModal from '@/components/SetUsernameModal';
import FocusSessionWidget from '@/components/FocusSessionWidget';
import FloatingHint from '@/components/FloatingHint';
import RecentAIChatSection from '@/components/dashboard/RecentAIChatSection';
import TodayTasksSection from '@/components/dashboard/TodayTasksSection';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useConfirm } from '@/hooks/useConfirm';
import ConfirmModal from '@/components/ConfirmModal';
import { useToastContext } from '@/components/ToastProvider';

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
  const user = useUser();
  const { confirm, confirmState, closeConfirm } = useConfirm();
  const { success, error: showError } = useToastContext();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [showBreakdownHint, setShowBreakdownHint] = useState(false);
  const [hasBreakdownTasks, setHasBreakdownTasks] = useState(false);

  // --- DATA FETCHING ---
  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      // Ensure profile exists with retry logic (handles race conditions)
      const { ensureProfileExists } = await import('@/lib/profileInitializer');
      const profileData = await ensureProfileExists(supabase, user.id, {
        maxRetries: 5,
        retryDelay: 500,
        createIfMissing: true,
      });

      if (!profileData) {
        throw new Error('Failed to initialize user profile. Please try refreshing the page.');
      }

      // Fetch subjects and breakdown tasks in parallel
      const [subjectsRes, breakdownTasksRes] = await Promise.all([
        supabase.from('subjects').select('*').eq('user_id', user.id).order('subject_id'),
        supabase.from('tasks').select('task_id').eq('user_id', user.id).eq('task_status', 'breakdown').limit(1)
      ]);

      if (subjectsRes.error) throw subjectsRes.error;

      if (!profileData.username) {
        setIsUsernameModalOpen(true);
      }
      setProfile({ username: profileData.username || null });
      setSubjects(subjectsRes.data || []);

      // Check if user has breakdown tasks and show hint
      const hasBreakdown = (breakdownTasksRes.data?.length || 0) > 0;
      setHasBreakdownTasks(hasBreakdown);

      // Show hint for first-time users with breakdown tasks
      if (hasBreakdown && !localStorage.getItem('breakdown-hint-dismissed')) {
        setShowBreakdownHint(true);
      }

    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      console.error('Dashboard error:', e);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [router, user]);

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
    const subject = subjects.find(s => s.subject_id === subjectId);
    const confirmed = await confirm({
      title: 'Delete Subject',
      message: `Are you sure you want to delete "${subject?.title}"? This will delete the subject and all its chapters, tasks, AI breakdowns, and progress data. This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger'
    });

    if (confirmed) {
      try {
        // Use SQL function to handle complex cascade deletion
        const { data, error } = await supabase.rpc('delete_subject_cascade', {
          subject_id_param: subjectId
        });

        if (error) throw error;

        if (data) {
          await fetchDashboardData();
          success('Subject and all related data deleted successfully');
        } else {
          throw new Error('Deletion failed');
        }
      } catch (error) {
        console.error('Delete error:', error);
        showError('Failed to delete subject. Please try again.');
      }
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
        userId={user?.id}
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
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/5 space-y-6">
                <RecentAIChatSection />
                <div className="h-px bg-white/10 w-full rounded-full"></div>
                <TodayTasksSection />
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

      {/* Jobs-Style Floating Hint */}
      <FloatingHint
        show={showBreakdownHint}
        message="💡 Hover over any purple task to add it to your schedule"
        onDismiss={() => {
          setShowBreakdownHint(false);
          localStorage.setItem('breakdown-hint-dismissed', 'true');
        }}
        position="bottom"
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </>
  );
}
