import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json({
    name: 'NeuroNest',
    short_name: 'NeuroNest',
    description: 'One small next action for the task you are resisting.',
    start_url: '/rescue',
    display: 'standalone',
    background_color: '#0B0F19',
    theme_color: '#0D9488',
    icons: [{ src: '/neuronest-mark.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' }],
  }, {
    headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
