'use client';

interface NeuroNestMarkProps {
  size?: number;
  className?: string;
}

/**
 * NeuroNest's product mark: a protected nest with one small step moving
 * forward. It stays recognizable at favicon size and avoids relying on emoji
 * rendering differences between platforms.
 */
export default function NeuroNestMark({ size = 72, className = '' }: NeuroNestMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      role="img"
      aria-label="NeuroNest mark"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="neuronest-mark-bg" x1="16" y1="12" x2="112" y2="116" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#4C1D95" />
        </linearGradient>
        <linearGradient id="neuronest-mark-line" x1="30" y1="29" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DDD6FE" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="120" height="120" rx="34" fill="url(#neuronest-mark-bg)" />
      <path d="M31 49C37 35 51 27 66 28C83 29 96 40 99 55" stroke="url(#neuronest-mark-line)" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M25 65C31 50 46 42 62 43C77 44 90 53 96 67" stroke="url(#neuronest-mark-line)" strokeWidth="8" strokeLinecap="round" fill="none" opacity=".88" />
      <path d="M30 82C38 69 50 64 64 65C77 66 87 73 94 84" stroke="url(#neuronest-mark-line)" strokeWidth="8" strokeLinecap="round" fill="none" opacity=".72" />
      <path d="M53 99H78" stroke="#C4B5FD" strokeWidth="8" strokeLinecap="round" />
      <path d="M86 91L98 91L98 103" stroke="#FDE68A" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="102" cy="24" r="5" fill="#FDE68A" />
    </svg>
  );
}
