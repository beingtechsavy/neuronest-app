'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface SoundOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  frequency?: number; // For generated sounds
  type: 'nature' | 'white-noise' | 'binaural' | 'ambient';
}

const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'rain',
    name: 'Rain',
    icon: '🌧️',
    description: 'Gentle rainfall',
    type: 'nature'
  },
  {
    id: 'forest',
    name: 'Forest',
    icon: '🌲',
    description: 'Birds and rustling leaves',
    type: 'nature'
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    icon: '🌊',
    description: 'Calming ocean sounds',
    type: 'nature'
  },
  {
    id: 'coffee-shop',
    name: 'Coffee Shop',
    icon: '☕',
    description: 'Ambient café chatter',
    type: 'ambient'
  },
  {
    id: 'white-noise',
    name: 'White Noise',
    icon: '📻',
    description: 'Pure white noise',
    frequency: 440,
    type: 'white-noise'
  },
  {
    id: 'brown-noise',
    name: 'Brown Noise',
    icon: '🎵',
    description: 'Deep, rumbling sound',
    frequency: 220,
    type: 'white-noise'
  },
  {
    id: 'pink-noise',
    name: 'Pink Noise',
    icon: '🎶',
    description: 'Balanced frequency noise',
    frequency: 330,
    type: 'white-noise'
  },
  {
    id: 'binaural-focus',
    name: 'Focus Beats',
    icon: '🧠',
    description: '40Hz gamma waves for concentration',
    frequency: 40,
    type: 'binaural'
  }
];

interface AmbientSoundPlayerProps {
  isActive?: boolean;
  onToggle?: (isPlaying: boolean) => void;
}

const AmbientSoundPlayer: React.FC<AmbientSoundPlayerProps> = ({
  isActive = false,
  onToggle
}) => {
  const [selectedSound, setSelectedSound] = useState<SoundOption | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Web Audio API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    return () => {
      stopSound();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Generate procedural sounds
  const generateSound = (soundOption: SoundOption) => {
    if (!audioContextRef.current || !soundOption.frequency) return;

    const audioContext = audioContextRef.current;
    
    // Resume audio context if suspended (required by browsers)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Create oscillator and gain nodes
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configure based on sound type
    switch (soundOption.type) {
      case 'white-noise':
        // Create white noise using buffer
        const bufferSize = audioContext.sampleRate * 2;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(isMuted ? 0 : volume * 0.3, audioContext.currentTime);
        source.start();
        
        // Store reference for cleanup
        oscillatorRef.current = source as any;
        break;
        
      case 'binaural':
        // Create binaural beats
        const leftOsc = audioContext.createOscillator();
        const rightOsc = audioContext.createOscillator();
        const leftGain = audioContext.createGain();
        const rightGain = audioContext.createGain();
        const merger = audioContext.createChannelMerger(2);
        
        leftOsc.frequency.setValueAtTime(soundOption.frequency!, audioContext.currentTime);
        rightOsc.frequency.setValueAtTime(soundOption.frequency! + 10, audioContext.currentTime); // 10Hz difference
        
        leftOsc.connect(leftGain);
        rightOsc.connect(rightGain);
        leftGain.connect(merger, 0, 0);
        rightGain.connect(merger, 0, 1);
        merger.connect(audioContext.destination);
        
        leftGain.gain.setValueAtTime(isMuted ? 0 : volume * 0.1, audioContext.currentTime);
        rightGain.gain.setValueAtTime(isMuted ? 0 : volume * 0.1, audioContext.currentTime);
        
        leftOsc.start();
        rightOsc.start();
        
        oscillatorRef.current = leftOsc;
        break;
        
      default:
        // Simple tone
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(soundOption.frequency!, audioContext.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(isMuted ? 0 : volume * 0.1, audioContext.currentTime);
        oscillator.start();
        
        oscillatorRef.current = oscillator;
    }
    
    gainNodeRef.current = gainNode;
  };

  // Play nature/ambient sounds (would use actual audio files in production)
  const playAmbientSound = (soundOption: SoundOption) => {
    // For now, we'll simulate with generated sounds
    // In production, you'd load actual audio files here
    const simulatedFrequencies: { [key: string]: number } = {
      'rain': 200,
      'forest': 300,
      'ocean': 150,
      'coffee-shop': 250
    };
    
    const frequency = simulatedFrequencies[soundOption.id] || 200;
    generateSound({ ...soundOption, frequency, type: 'white-noise' });
  };

  const stopSound = () => {
    if (oscillatorRef.current) {
      try {
        if ('stop' in oscillatorRef.current && typeof oscillatorRef.current.stop === 'function') {
          oscillatorRef.current.stop();
        }
        if ('disconnect' in oscillatorRef.current && typeof oscillatorRef.current.disconnect === 'function') {
          (oscillatorRef.current as any).disconnect();
        }
      } catch (e) {
        // Ignore errors when stopping
      }
      oscillatorRef.current = null;
    }
    
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
  };

  const togglePlayback = () => {
    if (!selectedSound) return;

    if (isPlaying) {
      stopSound();
      setIsPlaying(false);
      onToggle?.(false);
    } else {
      if (selectedSound.frequency || selectedSound.type === 'white-noise' || selectedSound.type === 'binaural') {
        generateSound(selectedSound);
      } else {
        playAmbientSound(selectedSound);
      }
      setIsPlaying(true);
      onToggle?.(true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (gainNodeRef.current && !isMuted) {
      const adjustedVolume = selectedSound?.type === 'binaural' ? newVolume * 0.1 : newVolume * 0.3;
      gainNodeRef.current.gain.setValueAtTime(adjustedVolume, audioContextRef.current?.currentTime || 0);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (gainNodeRef.current) {
      const targetVolume = newMuted ? 0 : (selectedSound?.type === 'binaural' ? volume * 0.1 : volume * 0.3);
      gainNodeRef.current.gain.setValueAtTime(targetVolume, audioContextRef.current?.currentTime || 0);
    }
  };

  const selectSound = (sound: SoundOption) => {
    if (isPlaying) {
      stopSound();
    }
    setSelectedSound(sound);
    setIsPlaying(false);
    onToggle?.(false);
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🎵 Ambient Sounds
        </h3>
        {selectedSound && (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 accent-blue-500"
            />
          </div>
        )}
      </div>

      {/* Sound Selection Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {SOUND_OPTIONS.map((sound) => (
          <button
            key={sound.id}
            onClick={() => selectSound(sound)}
            className={`p-3 rounded-lg border transition-all duration-200 text-left ${
              selectedSound?.id === sound.id
                ? 'border-blue-500 bg-blue-900/30 text-white'
                : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700'
            }`}
          >
            <div className="text-2xl mb-1">{sound.icon}</div>
            <div className="text-sm font-medium">{sound.name}</div>
            <div className="text-xs text-slate-400 mt-1">{sound.description}</div>
          </button>
        ))}
      </div>

      {/* Playback Controls */}
      {selectedSound && (
        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedSound.icon}</span>
            <div>
              <div className="text-white font-medium">{selectedSound.name}</div>
              <div className="text-slate-400 text-sm">{selectedSound.description}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                stopSound();
                setIsPlaying(false);
                onToggle?.(false);
              }}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Stop"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button
              onClick={togglePlayback}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isPlaying
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
        <p className="text-blue-300 text-sm">
          💡 <strong>Tip:</strong> Binaural beats work best with headphones. Nature sounds help mask distracting noises.
        </p>
      </div>
    </div>
  );
};

export default AmbientSoundPlayer;