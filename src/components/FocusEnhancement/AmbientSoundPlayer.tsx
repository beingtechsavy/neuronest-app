'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, AlertCircle, Plus, Minus, Play, Pause, Square } from 'lucide-react';
import { SOUND_OPTIONS } from '@/lib/soundOptions';
import { useAmbientSound } from '@/contexts/AmbientSoundContext';

interface AmbientSoundPlayerProps {
  isActive?: boolean;
  onToggle?: (isPlaying: boolean) => void;
}

const AmbientSoundPlayer: React.FC<AmbientSoundPlayerProps> = ({
  isActive = false,
  onToggle
}) => {
  const {
    state,
    startPlaying,
    stopPlaying,
    togglePlaying,
    setMasterVolume,
    setMuted,
    selectSound,
    toggleMixingMode,
    addSoundToMix,
    removeSoundFromMix,
    updateMixedSoundVolume,
    toggleMixedSound,
    clearMix,
    savePreset,
    loadPreset,
    deletePreset
  } = useAmbientSound();

  // Local UI state
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showPresetList, setShowPresetList] = useState(false);

  // Handle sound selection with retry logic
  const handleSoundClick = async (sound: any) => {
    // Prevent multiple rapid clicks
    if (state.loadingSounds.has(sound.id)) {
      return;
    }
    
    try {
      if (state.isMixingMode) {
        // In mixing mode, add/remove from mix
        const isInMix = state.mixedSounds.some(ms => ms.soundOption.id === sound.id);
        if (isInMix) {
          await removeSoundFromMix(sound.id);
        } else {
          await addSoundToMix(sound);
        }
      } else {
        // Single sound mode with retry
        try {
          await selectSound(sound);
        } catch (error) {
          // If first attempt fails, wait a moment and try once more
          console.log(`Retrying ${sound.name} after error:`, error);
          await new Promise(resolve => setTimeout(resolve, 500));
          await selectSound(sound);
        }
      }
    } catch (error) {
      console.error('Failed to handle sound click after retry:', error);
    }
  };

  // Handle main play/stop toggle
  const handleMainToggle = async () => {
    await togglePlaying();
    onToggle?.(state.isPlaying);
  };

  // Save current mix as preset
  const handleSavePreset = () => {
    if (!presetName.trim()) {
      return;
    }
    savePreset(presetName);
    setPresetName('');
    setShowPresetModal(false);
  };

  // Get suggested presets (most used)
  const getSuggestedPresets = () => {
    return [...state.presets]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 3);
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
          <h3 className="text-2xl font-light text-white flex items-center gap-3">
            Ambient Sounds
            {state.preloadingProgress > 0 && state.preloadingProgress < 100 && (
              <span className="text-sm text-blue-400 font-normal">Loading {Math.round(state.preloadingProgress)}%</span>
            )}
          </h3>
          <button
            onClick={toggleMixingMode}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              state.isMixingMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {state.isMixingMode ? 'Exit Mix Mode' : 'Mix Mode'}
          </button>
          {state.isMixingMode && state.mixedSounds.length > 0 && (
            <>
              <button
                onClick={() => setShowPresetModal(true)}
                className="px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Save Preset
              </button>
              <button
                onClick={clearMix}
                className="px-3 py-1 rounded-full text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Clear All
              </button>
            </>
          )}
          {state.presets.length > 0 && (
            <button
              onClick={() => setShowPresetList(!showPresetList)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              Presets ({state.presets.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted(!state.isMuted)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            {state.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={state.masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="w-20 accent-blue-500"
            title="Master Volume"
          />
        </div>
      </div>

      {/* Elegant Main Controls */}
      <div className="flex items-center justify-between mb-8 p-6 bg-gradient-to-r from-slate-700/20 to-slate-800/20 border border-slate-600/30 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleMainToggle}
            disabled={state.isLoading}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
              state.isPlaying
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
            } ${state.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {state.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            {state.isPlaying ? 'Stop All Sounds' : 'Start Sounds'}
            {state.isLoading && (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
          </button>
          
          {state.selectedSound && !state.isMixingMode && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span>{state.isPlaying ? 'Playing:' : 'Selected:'}</span>
              <span className="font-medium">{state.selectedSound.name}</span>
              {state.isPlaying && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
          )}
          
          {state.isMixingMode && state.mixedSounds.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span>Mix:</span>
              <span className="font-medium">{state.mixedSounds.length} sounds</span>
              {state.isPlaying && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
          )}
        </div>
        
        <div className="text-xs text-slate-400">
          {state.isMixingMode ? 'Mix Mode Active' : 'Single Sound Mode'}
        </div>
      </div>

      {/* Sound Selection Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {SOUND_OPTIONS.map((sound) => {
          const isInMix = state.mixedSounds.some(ms => ms.soundOption.id === sound.id);
          const isSelected = state.selectedSound?.id === sound.id;
          const isActiveInMix = state.mixedSounds.find(ms => ms.soundOption.id === sound.id)?.isActive;
          const isLoadingThis = state.loadingSounds.has(sound.id);
          
          return (
            <button
              key={sound.id}
              onClick={() => handleSoundClick(sound)}
              disabled={state.isLoading || isLoadingThis}
              className={`p-3 rounded-lg border transition-all duration-200 text-left relative ${
                state.isMixingMode
                  ? isInMix
                    ? 'border-green-500 bg-green-900/30 text-white'
                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700'
                  : isSelected
                    ? 'border-blue-500 bg-blue-900/30 text-white'
                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700'
              } ${(state.isLoading || isLoadingThis) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-2xl mb-1 flex items-center gap-1">
                {sound.icon}
                {isLoadingThis && (
                  <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <div className="text-sm font-medium">{sound.name}</div>
              <div className="text-xs text-slate-400 mt-1">{sound.description}</div>
              
              {/* Indicators */}
              <div className="absolute top-1 right-1 flex flex-col gap-1">
                {(sound.filePath || sound.frequency || sound.type === 'white-noise') && (
                  <div className={`w-2 h-2 rounded-full ${sound.filePath ? 'bg-green-500' : 'bg-yellow-500'}`} 
                       title={sound.filePath ? 'Audio file available' : 'Generated sound available'} />
                )}
                {state.isMixingMode && isInMix && (
                  <div className={`w-2 h-2 rounded-full ${isActiveInMix ? 'bg-blue-500' : 'bg-gray-500'}`} 
                       title={isActiveInMix ? 'Playing in mix' : 'Paused in mix'} />
                )}
              </div>
              
              {/* Mix mode overlay */}
              {state.isMixingMode && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                  {isInMix ? (
                    <Minus className="w-6 h-6 text-red-400" />
                  ) : (
                    <Plus className="w-6 h-6 text-green-400" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-red-300 text-sm">{state.error}</span>
        </div>
      )}

      {/* Mixing Controls */}
      {state.isMixingMode && state.mixedSounds.length > 0 && (
        <div className="mb-6 p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">Active Mix ({state.mixedSounds.length}/4)</h4>
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Individual Controls</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {state.mixedSounds.map((mixedSound) => (
              <div key={mixedSound.soundOption.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <span className="text-xl">{mixedSound.soundOption.icon}</span>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{mixedSound.soundOption.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={mixedSound.volume}
                      onChange={(e) => updateMixedSoundVolume(mixedSound.soundOption.id, parseFloat(e.target.value))}
                      className="flex-1 accent-blue-500"
                    />
                    <span className="text-xs text-slate-400 w-8">{Math.round(mixedSound.volume * 100)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleMixedSound(mixedSound.soundOption.id)}
                    className={`p-1.5 rounded transition-colors ${
                      mixedSound.isActive 
                        ? 'text-green-400 hover:text-green-300' 
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                    title={mixedSound.isActive ? 'Pause' : 'Play'}
                  >
                    {mixedSound.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => removeSoundFromMix(mixedSound.soundOption.id)}
                    className="p-1.5 rounded text-red-400 hover:text-red-300 transition-colors"
                    title="Remove from mix"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Sound Display (Single Mode) */}
      {!state.isMixingMode && state.selectedSound && (
        <div className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-lg mb-4">
          <span className="text-2xl">{state.selectedSound.icon}</span>
          <div>
            <div className="text-white font-medium">{state.selectedSound.name}</div>
            <div className="text-slate-400 text-sm">{state.selectedSound.description}</div>
          </div>
          {state.isPlaying && (
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm">Playing</span>
            </div>
          )}
        </div>
      )}

      {/* Preset Save Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold text-white mb-4">Save Sound Preset</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Preset Name
              </label>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Enter preset name..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <p className="text-sm text-slate-400 mb-2">Sounds in this preset:</p>
              <div className="space-y-1">
                {state.mixedSounds.map((ms) => (
                  <div key={ms.soundOption.id} className="flex items-center gap-2 text-sm text-slate-300">
                    <span>{ms.soundOption.icon}</span>
                    <span>{ms.soundOption.name}</span>
                    <span className="text-slate-500">({Math.round(ms.volume * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Preset
              </button>
              <button
                onClick={() => {
                  setShowPresetModal(false);
                  setPresetName('');
                }}
                className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preset List */}
      {showPresetList && state.presets.length > 0 && (
        <div className="mb-6 p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">Saved Presets</h4>
            <button
              onClick={() => setShowPresetList(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Suggested Presets */}
          {getSuggestedPresets().length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2">Most Used</p>
              <div className="flex flex-wrap gap-2">
                {getSuggestedPresets().map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => loadPreset(preset)}
                    className="px-3 py-1 bg-purple-600/20 border border-purple-500 text-purple-300 rounded-full text-xs hover:bg-purple-600/30 transition-colors"
                  >
                    {preset.name} ({preset.usageCount})
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* All Presets */}
          <div className="space-y-2">
            {state.presets.map((preset) => (
              <div key={preset.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{preset.name}</div>
                  <div className="text-xs text-slate-400">
                    {preset.sounds.length} sound{preset.sounds.length > 1 ? 's' : ''} • 
                    Used {preset.usageCount} time{preset.usageCount !== 1 ? 's' : ''}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {preset.sounds.map((ps) => {
                      const sound = SOUND_OPTIONS.find(s => s.id === ps.soundId);
                      return sound ? (
                        <span key={ps.soundId} className="text-xs text-slate-500">
                          {sound.icon}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => loadPreset(preset)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deletePreset(preset.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-xl">
        <p className="text-blue-300 text-sm leading-relaxed">
          🎵 <strong>Manual Control:</strong> Sounds only play when you click "Start Sounds" - no automatic playback during focus sessions. {state.isMixingMode 
            ? 'Mix Mode: Click sounds to add/remove (max 4). Use individual controls for volumes.'
            : 'Single Mode: Click any sound to play immediately. Enable Mix Mode for combinations.'
          } Binaural beats work best with headphones.
        </p>
        {state.preloadingProgress > 0 && state.preloadingProgress < 100 && (
          <div className="mt-3">
            <div className="w-full bg-blue-800/30 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${state.preloadingProgress}%` }}
              />
            </div>
            <p className="text-xs text-blue-400 mt-2">Loading audio files... {Math.round(state.preloadingProgress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmbientSoundPlayer;