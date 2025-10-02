/**
 * AudioManager - Handles real audio file loading, playback, and mixing
 * Replaces Web Audio API generation with HTML5 audio elements for file-based sounds
 */

export interface SoundOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  filePath?: string; // Path to actual audio file
  frequency?: number; // For generated sounds (white noise, binaural)
  type: 'nature' | 'white-noise' | 'binaural' | 'ambient';
  tags: string[];
  recommendedVolume: number;
}

export interface ActiveSound {
  id: string;
  name: string;
  volume: number;
  audioElement?: HTMLAudioElement;
  sourceNode?: MediaElementAudioSourceNode;
  gainNode?: GainNode;
  isPlaying: boolean;
  isLoading: boolean;
  isPaused: boolean;
  error?: string;
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

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private sourceNodes: Map<string, MediaElementAudioSourceNode> = new Map();
  private soundNodes: Map<string, GainNode> = new Map();
  private activeSounds: Map<string, ActiveSound> = new Map();
  private preloadedAudio: Map<string, HTMLAudioElement> = new Map();
  private masterVolume: number = 0.7;
  private isMuted: boolean = false;

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.connect(this.audioContext.destination);
        this.masterGainNode.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
      }
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }

  /**
   * Preload audio file for instant playback (simplified - just check if file exists)
   */
  async preloadAudio(soundId: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Simple check if audio file is accessible
      const audio = new Audio();
      
      const handleLoad = () => {
        audio.removeEventListener('canplaythrough', handleLoad);
        audio.removeEventListener('error', handleError);
        // Don't store the audio element, just verify it loads
        audio.src = '';
        resolve();
      };

      const handleError = () => {
        audio.removeEventListener('canplaythrough', handleLoad);
        audio.removeEventListener('error', handleError);
        reject(new Error(`Failed to load audio file: ${filePath}`));
      };

      audio.addEventListener('canplaythrough', handleLoad);
      audio.addEventListener('error', handleError);
      
      audio.src = filePath;
    });
  }

  /**
   * Play a sound with specified volume
   */
  async playSound(soundOption: SoundOption, volume: number = 0.7): Promise<void> {
    try {
      // Resume audio context if suspended
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Handle file-based sounds first
      if (soundOption.filePath) {
        try {
          await this.playFileBasedSound(soundOption, volume);
        } catch (fileError) {
          console.warn(`File-based sound failed for ${soundOption.id}, trying generated sound:`, fileError);
          // Fallback to generated sound if file fails
          if (soundOption.frequency || soundOption.type === 'white-noise') {
            await this.playGeneratedSound(soundOption, volume);
          } else {
            throw fileError;
          }
        }
      } else if (soundOption.frequency || soundOption.type === 'white-noise') {
        // Handle generated sounds (white noise, binaural beats)
        await this.playGeneratedSound(soundOption, volume);
      } else {
        throw new Error(`No audio source available for sound ${soundOption.id}`);
      }
    } catch (error) {
      console.error(`Failed to play sound ${soundOption.id}:`, error);
      throw error;
    }
  }

  private async playFileBasedSound(soundOption: SoundOption, volume: number): Promise<void> {
    if (!soundOption.filePath || !this.audioContext || !this.masterGainNode) {
      throw new Error('Audio context not initialized or no file path provided');
    }

    // Always stop any existing sound with this ID first for clean state
    const existingSound = this.activeSounds.get(soundOption.id);
    if (existingSound) {
      await this.stopSound(soundOption.id);
    }

    // Always create a fresh audio element to avoid MediaElementSource conflicts
    const audioElement = new Audio(soundOption.filePath);
    audioElement.loop = true;
    audioElement.preload = 'auto';
    
    // Wait for audio to be ready
    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        audioElement.removeEventListener('canplaythrough', handleLoad);
        audioElement.removeEventListener('error', handleError);
        reject(new Error(`Timeout loading audio: ${soundOption.filePath}`));
      }, 10000); // 10 second timeout

      const handleLoad = () => {
        clearTimeout(timeoutId);
        audioElement.removeEventListener('canplaythrough', handleLoad);
        audioElement.removeEventListener('error', handleError);
        resolve(void 0);
      };

      const handleError = (e: any) => {
        clearTimeout(timeoutId);
        audioElement.removeEventListener('canplaythrough', handleLoad);
        audioElement.removeEventListener('error', handleError);
        reject(new Error(`Failed to load audio: ${soundOption.filePath} - ${e.message || 'Unknown error'}`));
      };

      audioElement.addEventListener('canplaythrough', handleLoad);
      audioElement.addEventListener('error', handleError);
      
      // Also try loadeddata as fallback
      audioElement.addEventListener('loadeddata', handleLoad);
    });

    // Create audio source and gain node for Web Audio API integration
    let sourceNode: MediaElementAudioSourceNode;
    let gainNode: GainNode;
    
    try {
      sourceNode = this.audioContext.createMediaElementSource(audioElement);
      gainNode = this.audioContext.createGain();
      
      sourceNode.connect(gainNode);
      gainNode.connect(this.masterGainNode);
      
      // Set volume
      const adjustedVolume = this.isMuted ? 0 : volume * soundOption.recommendedVolume;
      gainNode.gain.setValueAtTime(adjustedVolume, this.audioContext.currentTime);
    } catch (error) {
      throw new Error(`Failed to create audio nodes: ${error}`);
    }

    // Store references
    this.audioElements.set(soundOption.id, audioElement);
    this.sourceNodes.set(soundOption.id, sourceNode);
    this.soundNodes.set(soundOption.id, gainNode);
    
    const activeSound: ActiveSound = {
      id: soundOption.id,
      name: soundOption.name,
      volume,
      audioElement,
      sourceNode,
      gainNode,
      isPlaying: true,
      isLoading: false,
      isPaused: false
    };
    
    this.activeSounds.set(soundOption.id, activeSound);

    // Start playback with error handling
    try {
      await audioElement.play();
    } catch (playError) {
      // Clean up if play fails
      await this.stopSound(soundOption.id);
      throw new Error(`Failed to start playback: ${playError}`);
    }
  }

  private async resumeExistingSound(activeSound: ActiveSound): Promise<void> {
    if (!activeSound.audioElement) return;

    try {
      await activeSound.audioElement.play();
      activeSound.isPlaying = true;
      activeSound.isPaused = false;
      this.activeSounds.set(activeSound.id, activeSound);
    } catch (error) {
      console.error(`Failed to resume sound ${activeSound.id}:`, error);
      throw error;
    }
  }

  private async playGeneratedSound(soundOption: SoundOption, volume: number): Promise<void> {
    if (!this.audioContext || !this.masterGainNode) {
      throw new Error('Audio context not initialized');
    }

    // Stop any existing sound with this ID first
    const existingSound = this.activeSounds.get(soundOption.id);
    if (existingSound) {
      await this.stopSound(soundOption.id);
    }

    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.masterGainNode);

    let sourceNode: OscillatorNode | AudioBufferSourceNode;

    switch (soundOption.type) {
      case 'white-noise':
        sourceNode = this.createNoiseSource(soundOption.id);
        break;
      case 'binaural':
        if (soundOption.frequency) {
          sourceNode = this.createBinauralBeats(soundOption.frequency);
        } else {
          sourceNode = this.createNoiseSource(soundOption.id); // Fallback to white noise
        }
        break;
      default:
        if (soundOption.frequency) {
          sourceNode = this.audioContext.createOscillator();
          (sourceNode as OscillatorNode).type = 'sine';
          (sourceNode as OscillatorNode).frequency.setValueAtTime(
            soundOption.frequency, 
            this.audioContext.currentTime
          );
        } else {
          // Fallback to white noise if no frequency
          sourceNode = this.createNoiseSource(soundOption.id);
        }
    }

    sourceNode.connect(gainNode);
    
    // Set volume
    const adjustedVolume = this.isMuted ? 0 : volume * soundOption.recommendedVolume;
    gainNode.gain.setValueAtTime(adjustedVolume, this.audioContext.currentTime);

    // Store references
    this.soundNodes.set(soundOption.id, gainNode);
    
    const activeSound: ActiveSound = {
      id: soundOption.id,
      name: soundOption.name,
      volume,
      gainNode,
      isPlaying: true,
      isLoading: false,
      isPaused: false
    };
    
    this.activeSounds.set(soundOption.id, activeSound);

    // Start the sound
    if ('start' in sourceNode) {
      (sourceNode as OscillatorNode | AudioBufferSourceNode).start();
    }
  }

  private createNoiseSource(soundId: string): AudioBufferSourceNode {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate noise based on sound type
    for (let i = 0; i < bufferSize; i++) {
      if (soundId.includes('white')) {
        data[i] = Math.random() * 2 - 1;
      } else if (soundId.includes('pink')) {
        // Pink noise approximation
        data[i] = (Math.random() * 2 - 1) * Math.pow(0.5, i / bufferSize);
      } else if (soundId.includes('brown')) {
        // Brown noise approximation
        data[i] = (Math.random() * 2 - 1) * Math.pow(0.25, i / bufferSize);
      } else {
        data[i] = Math.random() * 2 - 1;
      }
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    return source;
  }

  private createBinauralBeats(baseFrequency: number): OscillatorNode {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    // Create stereo binaural beats
    const leftOsc = this.audioContext.createOscillator();
    const rightOsc = this.audioContext.createOscillator();
    const merger = this.audioContext.createChannelMerger(2);

    leftOsc.frequency.setValueAtTime(baseFrequency, this.audioContext.currentTime);
    rightOsc.frequency.setValueAtTime(baseFrequency + 10, this.audioContext.currentTime); // 10Hz difference

    leftOsc.connect(merger, 0, 0);
    rightOsc.connect(merger, 0, 1);

    leftOsc.start();
    rightOsc.start();

    return leftOsc; // Return one for reference (both will be managed together)
  }

  /**
   * Pause a specific sound (can be resumed)
   */
  async pauseSound(soundId: string): Promise<void> {
    const activeSound = this.activeSounds.get(soundId);
    if (!activeSound) return;

    try {
      if (activeSound.audioElement) {
        activeSound.audioElement.pause();
      }

      // Update the active sound state but keep references for resuming
      activeSound.isPlaying = false;
      activeSound.isPaused = true;
      this.activeSounds.set(soundId, activeSound);
    } catch (error) {
      console.error(`Error pausing sound ${soundId}:`, error);
    }
  }

  /**
   * Resume a specific sound
   */
  async resumeSound(soundId: string): Promise<void> {
    const activeSound = this.activeSounds.get(soundId);
    if (!activeSound) return;

    try {
      // Resume audio context if suspended
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (activeSound.audioElement) {
        await activeSound.audioElement.play();
      }

      // Update the active sound state
      activeSound.isPlaying = true;
      activeSound.isPaused = false;
      this.activeSounds.set(soundId, activeSound);
    } catch (error) {
      console.error(`Error resuming sound ${soundId}:`, error);
      throw error;
    }
  }

  /**
   * Stop a specific sound (completely stops and cleans up)
   */
  async stopSound(soundId: string): Promise<void> {
    const activeSound = this.activeSounds.get(soundId);
    if (!activeSound) return;

    try {
      // Stop and clean up audio element
      if (activeSound.audioElement) {
        activeSound.audioElement.pause();
        activeSound.audioElement.currentTime = 0;
        // Remove all event listeners to prevent memory leaks
        activeSound.audioElement.removeEventListener('canplaythrough', () => {});
        activeSound.audioElement.removeEventListener('error', () => {});
        activeSound.audioElement.removeEventListener('loadeddata', () => {});
        // Set src to empty to release the file
        activeSound.audioElement.src = '';
        activeSound.audioElement.load();
      }

      // Disconnect Web Audio nodes
      if (activeSound.sourceNode) {
        try {
          activeSound.sourceNode.disconnect();
        } catch (e) {
          // Node might already be disconnected
        }
      }

      if (activeSound.gainNode) {
        try {
          activeSound.gainNode.disconnect();
        } catch (e) {
          // Node might already be disconnected
        }
      }

      // Clean up all references
      this.activeSounds.delete(soundId);
      this.audioElements.delete(soundId);
      this.sourceNodes.delete(soundId);
      this.soundNodes.delete(soundId);
    } catch (error) {
      console.error(`Error stopping sound ${soundId}:`, error);
      // Force cleanup even if there are errors
      this.activeSounds.delete(soundId);
      this.audioElements.delete(soundId);
      this.sourceNodes.delete(soundId);
      this.soundNodes.delete(soundId);
    }
  }

  /**
   * Stop all sounds
   */
  async stopAllSounds(): Promise<void> {
    const soundIds = Array.from(this.activeSounds.keys());
    
    // Stop all sounds in parallel but handle errors individually
    const stopPromises = soundIds.map(async (id) => {
      try {
        await this.stopSound(id);
      } catch (error) {
        console.error(`Failed to stop sound ${id}:`, error);
      }
    });
    
    await Promise.allSettled(stopPromises);
    
    // Force clear all maps in case some cleanup failed
    this.activeSounds.clear();
    this.audioElements.clear();
    this.sourceNodes.clear();
    this.soundNodes.clear();
  }

  /**
   * Adjust volume for a specific sound
   */
  setVolume(soundId: string, volume: number): void {
    const activeSound = this.activeSounds.get(soundId);
    if (!activeSound || !activeSound.gainNode || !this.audioContext) return;

    activeSound.volume = volume;
    const adjustedVolume = this.isMuted ? 0 : volume;
    activeSound.gainNode.gain.setValueAtTime(adjustedVolume, this.audioContext.currentTime);
  }

  /**
   * Set master volume for all sounds
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    if (this.masterGainNode && this.audioContext) {
      const adjustedVolume = this.isMuted ? 0 : this.masterVolume;
      this.masterGainNode.gain.setValueAtTime(adjustedVolume, this.audioContext.currentTime);
    }
  }

  /**
   * Mute/unmute all sounds
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    
    if (this.masterGainNode && this.audioContext) {
      const volume = muted ? 0 : this.masterVolume;
      this.masterGainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    }
  }

  /**
   * Crossfade between two sounds
   */
  async crossfadeToSound(fromSoundId: string, toSoundOption: SoundOption, duration: number = 2): Promise<void> {
    if (!this.audioContext) return;

    const fromSound = this.activeSounds.get(fromSoundId);
    
    // Start the new sound at zero volume
    await this.playSound(toSoundOption, 0);
    const toSound = this.activeSounds.get(toSoundOption.id);
    
    if (!fromSound?.gainNode || !toSound?.gainNode) return;

    const currentTime = this.audioContext.currentTime;
    
    // Fade out the old sound
    fromSound.gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);
    
    // Fade in the new sound
    toSound.gainNode.gain.linearRampToValueAtTime(
      toSoundOption.recommendedVolume, 
      currentTime + duration
    );

    // Stop the old sound after fade completes
    setTimeout(() => {
      this.stopSound(fromSoundId);
    }, duration * 1000);
  }

  /**
   * Mix multiple sounds with individual volumes
   */
  mixSounds(sounds: { soundOption: SoundOption; volume: number }[]): void {
    // Stop all current sounds first
    this.stopAllSounds();
    
    // Start each sound in the mix
    sounds.forEach(({ soundOption, volume }) => {
      this.playSound(soundOption, volume).catch(error => {
        console.error(`Failed to play sound in mix: ${soundOption.id}`, error);
      });
    });
  }

  /**
   * Get currently active sounds
   */
  getActiveSounds(): ActiveSound[] {
    return Array.from(this.activeSounds.values());
  }

  /**
   * Check if a sound is currently playing
   */
  isPlaying(soundId: string): boolean {
    const activeSound = this.activeSounds.get(soundId);
    return activeSound ? activeSound.isPlaying : false;
  }

  /**
   * Check if a sound is paused (exists but not playing)
   */
  isPaused(soundId: string): boolean {
    const activeSound = this.activeSounds.get(soundId);
    return activeSound ? activeSound.isPaused : false;
  }

  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Get mute state
   */
  isMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * Cleanup all resources
   */
  dispose(): void {
    this.stopAllSounds();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.audioElements.clear();
    this.sourceNodes.clear();
    this.soundNodes.clear();
    this.activeSounds.clear();
    this.preloadedAudio.clear();
  }

  /**
   * Preload multiple audio files
   */
  async preloadMultipleAudio(sounds: SoundOption[]): Promise<void> {
    const preloadPromises = sounds
      .filter(sound => sound.filePath)
      .map(sound => this.preloadAudio(sound.id, sound.filePath!));
    
    await Promise.allSettled(preloadPromises);
  }
}

// Singleton instance
let audioManagerInstance: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager();
  }
  return audioManagerInstance;
}