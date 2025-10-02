'use client';

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAmbientSound } from '@/contexts/AmbientSoundContext';

interface AmbientSoundToggleProps {
  className?: string;
}

export function AmbientSoundToggle({ className = '' }: AmbientSoundToggleProps) {
  const { state, togglePlaying } = useAmbientSound();

  const handleToggle = async () => {
    await togglePlaying();
  };

  return (
    <button
      onClick={handleToggle}
      disabled={state.isLoading}
      className={`w-full px-4 py-3 rounded-lg transition-colors text-left flex items-center gap-2 ${
        state.isPlaying
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-green-600 hover:bg-green-700 text-white'
      } ${state.isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {state.isPlaying ? (
        <>
          <VolumeX className="w-4 h-4" />
          🔇 Stop Sounds
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4" />
          🎵 Start Sounds
        </>
      )}
      {state.isLoading && (
        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin ml-auto"></div>
      )}
    </button>
  );
}