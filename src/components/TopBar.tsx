'use client';

import Link from 'next/link';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import SetUsernameModal from './SetUsernameModal';

export default function Topbar() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();

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
            .eq('id', session.user.id)
            .single();
          if (error && error.code !== 'PGRST116') throw error;
          setUsername(data?.username || null);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setUsername(null);
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [session, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
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

      <nav className="sticky top-0 z-40 p-4 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 text-white flex justify-end items-center">
        <div className="flex items-center gap-4">
          {/* This content is now only shown for logged-in users */}
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <User size={16} />
            {loadingProfile ? (
              <span className="italic text-slate-400">Loading...</span>
            ) : username ? (
              <span className="font-semibold">{username}</span>
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
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm bg-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-600 transition-colors"
            title="Log out"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
