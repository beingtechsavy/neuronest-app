'use client';

import React from 'react';
import { SOUND_OPTIONS } from '@/lib/soundOptions';
import { useAmbientSound } from '@/contexts/AmbientSoundContext';

export function SoundTestGrid() {
  const { selectSound, state } = useAmbientSound();

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
      <h3 className="text-white font-semibold mb-4">Sound Test Grid</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {SOUND_OPTIONS.map((sound) => {
          const isSelected = state.selectedSound?.id === sound.id;
          const isLoading = state.loadingSounds.has(sound.id);
          
          return (
            <button
              key={sound.id}
              onClick={() => selectSound(sound)}
              disabled={isLoading}
              className={`p-2 rounded border text-left text-sm transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-900/30 text-white'
                  : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span>{sound.icon}</span>
                <div>
                  <div className="font-medium">{sound.name}</div>
                  <div className="text-xs opacity-70">
                    {sound.filePath ? 'File' : sound.frequency ? 'Generated' : 'N/A'}
                  </div>
                </div>
                {isLoading && (
                  <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin ml-auto"></div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {state.error && (
        <div className="mt-4 p-2 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
          {state.error}
        </div>
      )}
      
      {state.isPlaying && state.selectedSound && (
        <div className="mt-4 p-2 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">
          Currently playing: {state.selectedSound.name}
        </div>
      )}
    </div>
  );
}