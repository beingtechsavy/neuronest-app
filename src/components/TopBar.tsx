'use client';

import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import Link from 'next/link';
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

      <nav className="sticky top-0 z-40 flex min-w-0 items-center justify-between gap-2 border-b border-[#383A40] bg-[#2B2D31] px-3 py-2 text-[#F2F3F5] sm:gap-4 sm:px-6 sm:py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[#DBDEE1] transition-colors hover:bg-[#383A40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
          {/* Plan Status & Upgrade Button */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Plan Badge */}
            <div className="hidden sm:block">
              <PlanBadge />
            </div>
            
            {/* Upgrade is a secondary action in the bar: it sits beside every
                page's real primary button, so a filled teal here competed with
                whatever the page actually wanted the user to do. */}
            <Link
              href="/pricing"
              className="flex min-h-11 items-center whitespace-nowrap rounded-xl border border-[#14B8A6]/40 px-3 text-sm font-semibold text-[#2DD4BF] transition-colors hover:border-[#14B8A6] hover:bg-[#14B8A6]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
            >
              Upgrade
            </Link>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* This content is now only shown for logged-in users */}
          <div className="hidden min-w-0 max-w-[14rem] items-center gap-2 text-sm text-[#DBDEE1] sm:flex">
            <User size={16} aria-hidden="true" />
            {loadingProfile ? (
              <span className="text-[#949BA4]">Loading…</span>
            ) : username ? (
              <span className="truncate font-semibold">{username}</span>
            ) : (
              <button
                type="button"
                onClick={() => setIsUsernameModalOpen(true)}
                className="min-h-11 rounded-lg bg-[#0D9488] px-3 text-sm font-semibold text-[#F2F3F5] transition-colors hover:bg-[#14B8A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
              >
                Set Username
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#3F4147] px-3 text-sm text-[#DBDEE1] transition-colors hover:border-[#ED4245]/50 hover:bg-[#ED4245]/10 hover:text-[#FF6B6B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B6B]"
            aria-label="Log out"
          >
            <LogOut size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
