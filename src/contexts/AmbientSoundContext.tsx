'use client';

import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { getAudioManager, type SoundOption, type ActiveSound } from '@/lib/AudioManager';
import { SOUND_OPTIONS } from '@/lib/soundOptions';

// Types
export interface MixedSound {
  soundOption: SoundOption;
  volume: number;
  isActive: boolean;
}

export interface SoundPreset {
  id: string;
  name: string;
  sounds: {
    soundId: string;
    volume: number;
  }[];
  createdAt: Date;
  usageCount: number;
}

export interface AmbientSoundState {
  // Playback state
  isPlaying: boolean;
  masterVolume: number;
  isMuted: boolean;
  isLoading: boolean;
  
  // Single sound mode
  selectedSound: SoundOption | null;
  
  // Mix mode
  isMixingMode: boolean;
  mixedSounds: MixedSound[];
  
  // Presets
  presets: SoundPreset[];
  
  // UI state
  loadingSounds: Set<string>;
  error: string | null;
  preloadingProgress: number;
}

// Actions
type AmbientSoundAction =
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_MASTER_VOLUME'; payload: number }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SELECTED_SOUND'; payload: SoundOption | null }
  | { type: 'SET_MIXING_MODE'; payload: boolean }
  | { type: 'SET_MIXED_SOUNDS'; payload: MixedSound[] }
  | { type: 'ADD_MIXED_SOUND'; payload: MixedSound }
  | { type: 'REMOVE_MIXED_SOUND'; payload: string }
  | { type: 'UPDATE_MIXED_SOUND'; payload: { soundId: string; updates: Partial<MixedSound> } }
  | { type: 'SET_PRESETS'; payload: SoundPreset[] }
  | { type: 'SET_LOADING_SOUNDS'; payload: Set<string> }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRELOADING_PROGRESS'; payload: number };

// Initial state
const initialState: AmbientSoundState = {
  isPlaying: false,
  masterVolume: 0.7,
  isMuted: false,
  isLoading: false,
  selectedSound: null,
  isMixingMode: false,
  mixedSounds: [],
  presets: [],
  loadingSounds: new Set(),
  error: null,
  preloadingProgress: 0
};

// Reducer
function ambientSoundReducer(state: AmbientSoundState, action: AmbientSoundAction): AmbientSoundState {
  switch (action.type) {
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_MASTER_VOLUME':
      return { ...state, masterVolume: action.payload };
    case 'SET_MUTED':
      return { ...state, isMuted: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SELECTED_SOUND':
      return { ...state, selectedSound: action.payload };
    case 'SET_MIXING_MODE':
      return { ...state, isMixingMode: action.payload };
    case 'SET_MIXED_SOUNDS':
      return { ...state, mixedSounds: action.payload };
    case 'ADD_MIXED_SOUND':
      return { ...state, mixedSounds: [...state.mixedSounds, action.payload] };
    case 'REMOVE_MIXED_SOUND':
      return { 
        ...state, 
        mixedSounds: state.mixedSounds.filter(ms => ms.soundOption.id !== action.payload) 
      };
    case 'UPDATE_MIXED_SOUND':
      return {
        ...state,
        mixedSounds: state.mixedSounds.map(ms =>
          ms.soundOption.id === action.payload.soundId
            ? { ...ms, ...action.payload.updates }
            : ms
        )
      };
    case 'SET_PRESETS':
      return { ...state, presets: action.payload };
    case 'SET_LOADING_SOUNDS':
      return { ...state, loadingSounds: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PRELOADING_PROGRESS':
      return { ...state, preloadingProgress: action.payload };
    default:
      return state;
  }
}

// Context interface
interface AmbientSoundContextType {
  state: AmbientSoundState;
  
  // Playback controls
  startPlaying: () => Promise<void>;
  stopPlaying: () => Promise<void>;
  togglePlaying: () => Promise<void>;
  
  // Volume controls
  setMasterVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  
  // Single sound mode
  selectSound: (sound: SoundOption) => Promise<void>;
  
  // Mix mode
  toggleMixingMode: () => void;
  addSoundToMix: (sound: SoundOption) => Promise<void>;
  removeSoundFromMix: (soundId: string) => Promise<void>;
  updateMixedSoundVolume: (soundId: string, volume: number) => void;
  toggleMixedSound: (soundId: string) => Promise<void>;
  clearMix: () => Promise<void>;
  
  // Presets
  savePreset: (name: string) => void;
  loadPreset: (preset: SoundPreset) => Promise<void>;
  deletePreset: (presetId: string) => void;
  
  // Utility
  getActiveSounds: () => ActiveSound[];
}

const AmbientSoundContext = createContext<AmbientSoundContextType | undefined>(undefined);

// Provider component
interface AmbientSoundProviderProps {
  children: ReactNode;
}

export function AmbientSoundProvider({ children }: AmbientSoundProviderProps) {
  const [state, dispatch] = useReducer(ambientSoundReducer, initialState);
  const { success, warning } = useToast();
  const audioManagerRef = useRef(getAudioManager());

  // Load presets on mount
  useEffect(() => {
    loadPresets();
    preloadAllSounds();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Preload all sounds
  const preloadAllSounds = useCallback(async () => {
    const audioManager = audioManagerRef.current;
    const soundsWithFiles = SOUND_OPTIONS.filter(sound => sound.filePath);
    let loadedCount = 0;
    
    const preloadPromises = soundsWithFiles.map(async (sound) => {
      try {
        await audioManager.preloadAudio(sound.id, sound.filePath!);
        loadedCount++;
        dispatch({ type: 'SET_PRELOADING_PROGRESS', payload: (loadedCount / soundsWithFiles.length) * 100 });
      } catch (error) {
        console.warn(`Failed to preload ${sound.name}:`, error);
        loadedCount++;
        dispatch({ type: 'SET_PRELOADING_PROGRESS', payload: (loadedCount / soundsWithFiles.length) * 100 });
      }
    });
    
    await Promise.allSettled(preloadPromises);
    dispatch({ type: 'SET_PRELOADING_PROGRESS', payload: 100 });
    
    // Hide progress after delay
    setTimeout(() => dispatch({ type: 'SET_PRELOADING_PROGRESS', payload: 0 }), 2000);
  }, []);

  // Load presets from localStorage
  const loadPresets = useCallback(() => {
    try {
      const savedPresets = localStorage.getItem('ambientSoundPresets');
      if (savedPresets) {
        const parsedPresets = JSON.parse(savedPresets);
        dispatch({ type: 'SET_PRESETS', payload: parsedPresets });
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  }, []);

  // Save presets to localStorage
  const savePresets = useCallback((presets: SoundPreset[]) => {
    try {
      localStorage.setItem('ambientSoundPresets', JSON.stringify(presets));
      dispatch({ type: 'SET_PRESETS', payload: presets });
    } catch (error) {
      console.error('Failed to save presets:', error);
      warning('Failed to save presets');
    }
  }, [warning]);

  // Playback controls - reliable and consistent
  const startPlaying = useCallback(async () => {
    const audioManager = audioManagerRef.current;
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Always stop all sounds first for clean state
      await audioManager.stopAllSounds();
      
      // Small delay for clean state
      await new Promise(resolve => setTimeout(resolve, 100));

      if (state.isMixingMode && state.mixedSounds.length > 0) {
        // Start all sounds in mix
        for (const mixedSound of state.mixedSounds) {
          if (mixedSound.isActive) {
            try {
              await audioManager.playSound(mixedSound.soundOption, mixedSound.volume);
            } catch (error) {
              console.warn(`Failed to play ${mixedSound.soundOption.name} in mix:`, error);
            }
          }
        }
      } else if (state.selectedSound) {
        // Start the selected sound
        let soundToPlay = state.selectedSound;
        
        // Ensure generated sounds have proper config
        if (!state.selectedSound.filePath && (state.selectedSound.frequency || state.selectedSound.type === 'white-noise')) {
          soundToPlay = {
            ...state.selectedSound,
            frequency: state.selectedSound.frequency || 440,
            type: state.selectedSound.type === 'white-noise' ? 'white-noise' : state.selectedSound.type
          };
        }
        
        await audioManager.playSound(soundToPlay, soundToPlay.recommendedVolume);
      } else {
        // Default to rain sound if nothing selected
        const rainSound = SOUND_OPTIONS.find(s => s.id === 'rain');
        if (rainSound) {
          try {
            await audioManager.playSound(rainSound, rainSound.recommendedVolume);
            dispatch({ type: 'SET_SELECTED_SOUND', payload: rainSound });
          } catch (error) {
            // Fallback to white noise if rain fails
            const whiteNoiseSound: SoundOption = {
              id: 'white-noise-fallback',
              name: 'White Noise',
              icon: '📻',
              description: 'Generated white noise',
              frequency: 440,
              type: 'white-noise',
              tags: ['noise', 'focus'],
              recommendedVolume: 0.4
            };
            await audioManager.playSound(whiteNoiseSound, whiteNoiseSound.recommendedVolume);
            dispatch({ type: 'SET_SELECTED_SOUND', payload: whiteNoiseSound });
          }
        }
      }
      
      dispatch({ type: 'SET_PLAYING', payload: true });
      success('Sounds started successfully');
    } catch (error) {
      console.error('Failed to start playing:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start audio playback' });
      warning('Failed to start audio playback. Please try again.');
      dispatch({ type: 'SET_PLAYING', payload: false });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.isMixingMode, state.mixedSounds, state.selectedSound, warning, success]);

  const stopPlaying = useCallback(async () => {
    const audioManager = audioManagerRef.current;
    
    try {
      await audioManager.stopAllSounds();
      dispatch({ type: 'SET_PLAYING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to stop playing:', error);
      // Even if stopping fails, update the state
      dispatch({ type: 'SET_PLAYING', payload: false });
    }
  }, []);

  const togglePlaying = useCallback(async () => {
    if (state.isPlaying) {
      await stopPlaying();
    } else {
      await startPlaying();
    }
  }, [state.isPlaying, startPlaying, stopPlaying]);

  // Volume controls
  const setMasterVolume = useCallback((volume: number) => {
    const audioManager = audioManagerRef.current;
    audioManager.setMasterVolume(volume);
    dispatch({ type: 'SET_MASTER_VOLUME', payload: volume });
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    const audioManager = audioManagerRef.current;
    audioManager.setMuted(muted);
    dispatch({ type: 'SET_MUTED', payload: muted });
  }, []);

  // Single sound mode - always works reliably
  const selectSound = useCallback(async (sound: SoundOption) => {
    dispatch({ type: 'SET_SELECTED_SOUND', payload: sound });
    dispatch({ type: 'SET_LOADING_SOUNDS', payload: new Set([sound.id]) });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const audioManager = audioManagerRef.current;
      
      // Always stop all sounds first for clean state
      await audioManager.stopAllSounds();
      
      // Small delay to ensure clean state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to play the sound
      let soundToPlay = sound;
      
      // If it's a generated sound without file, ensure it has proper config
      if (!sound.filePath && (sound.frequency || sound.type === 'white-noise')) {
        soundToPlay = {
          ...sound,
          frequency: sound.frequency || 440,
          type: sound.type === 'white-noise' ? 'white-noise' : sound.type
        };
      }
      
      await audioManager.playSound(soundToPlay, soundToPlay.recommendedVolume);
      dispatch({ type: 'SET_PLAYING', payload: true });
      success(`Now playing: ${sound.name}`);
      
    } catch (error) {
      console.error('Failed to select sound:', error);
      
      // Provide specific error message
      let errorMessage = `Failed to play ${sound.name}`;
      if (error instanceof Error) {
        if (error.message.includes('Failed to load audio')) {
          errorMessage = `${sound.name} audio file not found`;
        } else if (error.message.includes('MediaElementSource')) {
          errorMessage = `${sound.name} audio conflict - trying again`;
        } else if (error.message.includes('Timeout')) {
          errorMessage = `${sound.name} took too long to load`;
        }
      }
      
      // Try fallback for any failed sound
      try {
        console.log(`Trying white noise fallback for ${sound.name}...`);
        const fallbackSound: SoundOption = {
          ...sound,
          frequency: 440,
          type: 'white-noise'
        };
        await audioManagerRef.current.playSound(fallbackSound, fallbackSound.recommendedVolume);
        dispatch({ type: 'SET_PLAYING', payload: true });
        success(`Playing white noise instead of ${sound.name}`);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        warning(errorMessage + '. Please try again.');
        dispatch({ type: 'SET_PLAYING', payload: false });
      }
    } finally {
      dispatch({ type: 'SET_LOADING_SOUNDS', payload: new Set() });
    }
  }, [success, warning]);

  // Mix mode
  const toggleMixingMode = useCallback(() => {
    const newMixingMode = !state.isMixingMode;
    dispatch({ type: 'SET_MIXING_MODE', payload: newMixingMode });
    
    if (!newMixingMode) {
      // Exiting mix mode - clear all mixed sounds
      clearMix();
    }
  }, [state.isMixingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const addSoundToMix = useCallback(async (sound: SoundOption) => {
    if (state.mixedSounds.length >= 4) {
      warning('Maximum 4 sounds can be mixed simultaneously');
      return;
    }

    dispatch({ type: 'SET_LOADING_SOUNDS', payload: new Set([sound.id]) });

    try {
      const audioManager = audioManagerRef.current;
      const volume = sound.recommendedVolume * 0.8; // Slightly lower for mixing
      
      await audioManager.playSound(sound, volume);
      
      const newMixedSound: MixedSound = {
        soundOption: sound,
        volume,
        isActive: true
      };
      
      dispatch({ type: 'ADD_MIXED_SOUND', payload: newMixedSound });
      dispatch({ type: 'SET_PLAYING', payload: true });
      success(`Added ${sound.name} to mix`);
    } catch (error) {
      console.error('Failed to add sound to mix:', error);
      warning(`Could not add ${sound.name} to mix. Please try again.`);
    } finally {
      dispatch({ type: 'SET_LOADING_SOUNDS', payload: new Set() });
    }
  }, [state.mixedSounds.length, success, warning]);

  const removeSoundFromMix = useCallback(async (soundId: string) => {
    try {
      const audioManager = audioManagerRef.current;
      await audioManager.stopSound(soundId);
      
      dispatch({ type: 'REMOVE_MIXED_SOUND', payload: soundId });
      
      const soundName = SOUND_OPTIONS.find(s => s.id === soundId)?.name || 'Sound';
      success(`Removed ${soundName} from mix`);
      
      // If no sounds left, stop playing
      const remainingSounds = state.mixedSounds.filter(ms => ms.soundOption.id !== soundId);
      if (remainingSounds.length === 0) {
        dispatch({ type: 'SET_PLAYING', payload: false });
      }
    } catch (error) {
      console.error('Failed to remove sound from mix:', error);
    }
  }, [state.mixedSounds, success]);

  const updateMixedSoundVolume = useCallback((soundId: string, volume: number) => {
    const audioManager = audioManagerRef.current;
    audioManager.setVolume(soundId, volume);
    dispatch({ 
      type: 'UPDATE_MIXED_SOUND', 
      payload: { soundId, updates: { volume } } 
    });
  }, []);

  const toggleMixedSound = useCallback(async (soundId: string) => {
    const mixedSound = state.mixedSounds.find(ms => ms.soundOption.id === soundId);
    if (!mixedSound) return;

    try {
      const audioManager = audioManagerRef.current;
      
      if (mixedSound.isActive) {
        await audioManager.pauseSound(soundId);
      } else {
        await audioManager.resumeSound(soundId);
      }
      
      dispatch({ 
        type: 'UPDATE_MIXED_SOUND', 
        payload: { soundId, updates: { isActive: !mixedSound.isActive } } 
      });
    } catch (error) {
      console.error('Failed to toggle mixed sound:', error);
    }
  }, [state.mixedSounds]);

  const clearMix = useCallback(async () => {
    try {
      const audioManager = audioManagerRef.current;
      await audioManager.stopAllSounds();
      
      dispatch({ type: 'SET_MIXED_SOUNDS', payload: [] });
      dispatch({ type: 'SET_PLAYING', payload: false });
      success('Cleared all sounds from mix');
    } catch (error) {
      console.error('Failed to clear mix:', error);
    }
  }, [success]);

  // Preset management
  const savePreset = useCallback((name: string) => {
    if (state.mixedSounds.length === 0) {
      warning('No sounds in mix to save');
      return;
    }

    const newPreset: SoundPreset = {
      id: Date.now().toString(),
      name: name.trim(),
      sounds: state.mixedSounds.map(ms => ({
        soundId: ms.soundOption.id,
        volume: ms.volume
      })),
      createdAt: new Date(),
      usageCount: 0
    };

    const updatedPresets = [...state.presets, newPreset];
    savePresets(updatedPresets);
    success(`Preset "${newPreset.name}" saved successfully`);
  }, [state.mixedSounds, state.presets, savePresets, success, warning]);

  const loadPreset = useCallback(async (preset: SoundPreset) => {
    try {
      // Clear current mix
      await clearMix();
      
      // Load sounds from preset
      const newMixedSounds: MixedSound[] = [];
      
      for (const presetSound of preset.sounds) {
        const soundOption = SOUND_OPTIONS.find(s => s.id === presetSound.soundId);
        if (soundOption) {
          const mixedSound: MixedSound = {
            soundOption,
            volume: presetSound.volume,
            isActive: true
          };
          
          await audioManagerRef.current.playSound(soundOption, presetSound.volume);
          newMixedSounds.push(mixedSound);
        }
      }
      
      dispatch({ type: 'SET_MIXED_SOUNDS', payload: newMixedSounds });
      dispatch({ type: 'SET_MIXING_MODE', payload: true });
      dispatch({ type: 'SET_PLAYING', payload: true });
      
      // Update usage count
      const updatedPresets = state.presets.map(p => 
        p.id === preset.id 
          ? { ...p, usageCount: p.usageCount + 1 }
          : p
      );
      savePresets(updatedPresets);
      
      success(`Loaded preset "${preset.name}"`);
    } catch (error) {
      console.error('Failed to load preset:', error);
      warning(`Failed to load preset "${preset.name}"`);
    }
  }, [state.presets, savePresets, success, warning, clearMix]);

  const deletePreset = useCallback((presetId: string) => {
    const preset = state.presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const updatedPresets = state.presets.filter(p => p.id !== presetId);
    savePresets(updatedPresets);
    success(`Deleted preset "${preset.name}"`);
  }, [state.presets, savePresets, success]);

  // Get active sounds
  const getActiveSounds = useCallback(() => {
    return audioManagerRef.current.getActiveSounds();
  }, []);

  const contextValue: AmbientSoundContextType = {
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
    deletePreset,
    getActiveSounds
  };

  return (
    <AmbientSoundContext.Provider value={contextValue}>
      {children}
    </AmbientSoundContext.Provider>
  );
}

// Custom hook
export function useAmbientSound() {
  const context = useContext(AmbientSoundContext);
  if (context === undefined) {
    throw new Error('useAmbientSound must be used within an AmbientSoundProvider');
  }
  return context;
}