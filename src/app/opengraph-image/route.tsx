import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * Social preview card. Renders "The Haven N" mark so link previews match the
 * product brand rather than the retired purple mark.
 */
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1E1F22 0%, #141517 100%)',
          color: '#F2F3F5',
          padding: '72px 88px',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div
          style={{
            width: 210,
            height: 210,
            borderRadius: 46,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#2B2D31',
            border: '2px solid #383A40',
            marginRight: 72,
          }}
        >
          <svg width="150" height="150" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="44" y="36" width="44" height="184" rx="12" fill="#F2F3F5" />
            <rect x="168" y="36" width="44" height="184" rx="12" fill="#F2F3F5" />
            <path
              d="M 88 56 C 108 64, 128 92, 142 128 C 156 164, 164 190, 168 204 L 168 174 C 156 142, 142 112, 126 84 C 114 62, 102 48, 88 40 Z"
              fill="#14B8A6"
            />
            <circle cx="128" cy="116" r="18" fill="#2DD4BF" />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 82, fontWeight: 700, letterSpacing: '-2px' }}>
            <span>Neuro</span>
            <span style={{ color: '#2DD4BF' }}>Nest</span>
          </div>
          <div style={{ fontSize: 36, color: '#DBDEE1', marginTop: 20 }}>
            One small next action. Then begin.
          </div>
          <div style={{ fontSize: 25, color: '#949BA4', marginTop: 28 }}>
            A task-initiation tool for the moment when starting feels inaccessible.
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
