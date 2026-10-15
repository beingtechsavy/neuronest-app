'use client';

import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { User, LogOut, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import SetUsernameModal from './SetUsernameModal';
import { useToastContext } from './ToastProvider';
import PlanBadge from './PlanBadge';

export default function Topbar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const { error: showError } = useToastContext();

  const [username, setUsername] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session) {
        setLoadingProfile(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user?.id)
            .single();
          if (error && error.code !== 'PGRST116') throw error;
          setUsername(data?.username || null);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          showError('Failed to load user profile');
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setUsername(null);
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [session, supabase, showError]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still redirect even if logout fails
      router.push('/');
    }
  };

  // --- CHANGE IS HERE ---
  // If there is no active session, the component will render nothing.
  if (!session) {
    return null;
  }

  return (
    <>
      <SetUsernameModal
        isOpen={isUsernameModalOpen}
        onClose={() => setIsUsernameModalOpen(false)}
        onSaveSuccess={(newUsername) => {
          setUsername(newUsername);
          setIsUsernameModalOpen(false);
        }}
      />

      <nav className="sticky top-0 z-40 flex min-w-0 items-center justify-between gap-2 border-b border-slate-700 bg-slate-900/80 px-3 py-2.5 text-white backdrop-blur-sm sm:gap-4 sm:p-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-200 transition-colors hover:bg-slate-700 lg:hidden"
            aria-label="Open navigation"
            title="Open navigation"
          >
            <Menu size={22} />
          </button>
          {/* Plan Status & Upgrade Button */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Plan Badge */}
            <div className="hidden sm:block">
              <PlanBadge />
            </div>
            
            {/* Upgrade Button */}
            <a
              href="/pricing"
              className="flex min-h-11 items-center whitespace-nowrap rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-2.5 py-2 text-xs font-semibold text-white transition-all duration-200 hover:from-purple-700 hover:to-blue-700 sm:px-4 sm:text-sm"
            >
              <span aria-hidden="true">⚡</span><span className="ml-1">Upgrade</span>
            </a>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* This content is now only shown for logged-in users */}
          <div className="hidden min-w-0 max-w-[14rem] items-center gap-2 text-sm text-slate-300 sm:flex">
            <User size={16} />
            {loadingProfile ? (
              <span className="italic text-slate-400">Loading...</span>
            ) : username ? (
              <span className="truncate font-semibold">{username}</span>
            ) : (
              <button
                onClick={() => setIsUsernameModalOpen(true)}
                className="text-sm bg-green-600 px-3 py-1 rounded-md hover:bg-green-700 transition-colors font-semibold"
              >
                Set Username
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md bg-slate-700 px-2 text-sm transition-colors hover:bg-slate-600 sm:px-3"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
