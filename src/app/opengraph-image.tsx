import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'NeuroNest — One small next action. Then begin.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)',
          color: '#ffffff',
          padding: '72px 88px',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div
          style={{
            width: 210,
            height: 210,
            borderRadius: 58,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #a78bfa 0%, #6d28d9 100%)',
            marginRight: 72,
          }}
        >
          <svg width="150" height="150" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M31 49C37 35 51 27 66 28C83 29 96 40 99 55" stroke="white" strokeWidth="8" strokeLinecap="round" />
            <path d="M25 65C31 50 46 42 62 43C77 44 90 53 96 67" stroke="white" strokeWidth="8" strokeLinecap="round" opacity=".88" />
            <path d="M30 82C38 69 50 64 64 65C77 66 87 73 94 84" stroke="white" strokeWidth="8" strokeLinecap="round" opacity=".72" />
            <path d="M53 99H78" stroke="#C4B5FD" strokeWidth="8" strokeLinecap="round" />
            <path d="M86 91H98V103" stroke="#FDE68A" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="102" cy="24" r="5" fill="#FDE68A" />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 82, fontWeight: 700, letterSpacing: '-2px' }}>NeuroNest</div>
          <div style={{ fontSize: 36, color: '#c4b5fd', marginTop: 20 }}>One small next action. Then begin.</div>
          <div style={{ fontSize: 25, color: '#94a3b8', marginTop: 28 }}>A task-initiation tool for the moment when starting feels inaccessible.</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
