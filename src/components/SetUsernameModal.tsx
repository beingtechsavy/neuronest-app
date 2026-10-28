'use client';

import React, { useState, FormEvent } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Loader2 } from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Welcome to NeuroNest"
      description="Pick a username so your work follows you between devices."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. neuro_navigator"
          hint="At least 3 characters, and not already taken."
          autoFocus
          maxLength={40}
          autoComplete="username"
          error={error ?? undefined}
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={isLoading || username.trim().length < 3}
        >
          {isLoading && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {isLoading ? 'Saving…' : 'Save and continue'}
        </Button>
      </form>
    </Modal>
  );
}
