import { SoundOption } from './AudioManager';

export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'rain',
    name: 'Rain',
    icon: '🌧️',
    description: 'Gentle rainfall',
    filePath: '/sounds/rain.mp3',
    type: 'nature',
    tags: ['nature', 'calming', 'focus'],
    recommendedVolume: 0.7
  },
  {
    id: 'forest',
    name: 'Forest',
    icon: '🌲',
    description: 'Birds and rustling leaves',
    filePath: '/sounds/forest.mp3',
    type: 'nature',
    tags: ['nature', 'birds', 'peaceful'],
    recommendedVolume: 0.6
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    icon: '🌊',
    description: 'Calming ocean sounds',
    filePath: '/sounds/ocean.mp3',
    type: 'nature',
    tags: ['nature', 'waves', 'relaxing'],
    recommendedVolume: 0.8
  },
  {
    id: 'coffee-shop',
    name: 'Coffee Shop',
    icon: '☕',
    description: 'Ambient café chatter',
    filePath: '/sounds/coffee-shop.mp3',
    type: 'ambient',
    tags: ['ambient', 'social', 'productivity'],
    recommendedVolume: 0.5
  },
  {
    id: 'white-noise',
    name: 'White Noise',
    icon: '📻',
    description: 'Pure white noise',
    frequency: 440,
    type: 'white-noise',
    tags: ['noise', 'masking', 'concentration'],
    recommendedVolume: 0.4
  },
  {
    id: 'brown-noise',
    name: 'Brown Noise',
    icon: '🎵',
    description: 'Deep, rumbling sound',
    filePath: '/sounds/brown-noise.mp3',
    type: 'white-noise',
    tags: ['noise', 'deep', 'focus'],
    recommendedVolume: 0.5
  },
  {
    id: 'pink-noise',
    name: 'Pink Noise',
    icon: '🎶',
    description: 'Balanced frequency noise',
    filePath: '/sounds/pink-noise.mp3',
    type: 'white-noise',
    tags: ['noise', 'balanced', 'sleep'],
    recommendedVolume: 0.4
  },
  {
    id: 'binaural-focus',
    name: 'Focus Beats',
    icon: '🧠',
    description: '40Hz gamma waves for concentration',
    filePath: '/sounds/binaural-focus.mp3',
    type: 'binaural',
    tags: ['binaural', 'focus', 'gamma'],
    recommendedVolume: 0.3
  }
];

export function getSoundById(id: string): SoundOption | undefined {
  return SOUND_OPTIONS.find(sound => sound.id === id);
}