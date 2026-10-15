import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NeuroNest',
    short_name: 'NeuroNest',
    description: 'One small next action for the task you are resisting.',
    start_url: '/rescue',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    icons: [{ src: '/neuronest-mark.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' }],
  };
}
