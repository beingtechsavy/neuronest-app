'use client';

import React, { useState, FormEvent } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Loader2 } from 'lucide-react';

// --- TYPE DEFINITIONS ---
// This interface now correctly includes the 'onSaveSuccess' prop
interface SetUsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (newUsername: string) => void;
}

// --- MAIN COMPONENT ---
export default function SetUsernameModal({ isOpen, onClose, onSaveSuccess }: SetUsernameModalProps) {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      if (!user) throw new Error("User not authenticated.");

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, username: trimmedUsername, updated_at: new Date().toISOString() });
      
      if (upsertError) {
        if (upsertError.message.includes('duplicate key value violates unique constraint')) {
          throw new Error('This username is already taken.');
        }
        throw upsertError;
      }

      onSaveSuccess(trimmedUsername);
      onClose();

    } catch (err: unknown) {
      console.error('Error saving username:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="username-modal-title"
    >
      <div
        className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 text-center"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="username-modal-title" className="text-2xl font-bold text-white mb-2">Welcome to NeuroNest!</h2>
        <p className="text-slate-400 mb-6">Let&apos;s get started by setting up your username.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4 text-left">
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md text-white p-2 text-sm placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              placeholder="e.g., neuro_navigator"
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-2">Must be at least 3 characters long and unique.</p>
          </div>

          {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded-md">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || username.trim().length < 3}
            className="w-full px-4 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? 'Saving...' : 'Save and Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
