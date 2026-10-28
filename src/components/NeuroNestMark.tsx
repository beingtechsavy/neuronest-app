'use client';

interface NeuroNestMarkProps {
  size?: number;
  className?: string;
  variant?: 'tile' | 'transparent';
}

/**
 * NeuroNest's product mark: "The Haven N"
 * An architectural N framing a protective inner cradle that shelters a calm intention seed.
 * Delivers emotional containment and focus scaffolding without clinical or generic tropes.
 */
export default function NeuroNestMark({
  size = 72,
  className = '',
  variant = 'tile',
}: NeuroNestMarkProps) {
  if (variant === 'transparent') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        role="img"
        aria-label="NeuroNest mark"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <rect x="44" y="36" width="44" height="184" rx="12" fill="#F8FAFC" />
        <rect x="168" y="36" width="44" height="184" rx="12" fill="#F8FAFC" />
        <path
          d="M 88 56 C 108 64, 128 92, 142 128 C 156 164, 164 190, 168 204 L 168 174 C 156 142, 142 112, 126 84 C 114 62, 102 48, 88 40 Z"
          fill="#14B8A6"
        />
        <circle cx="128" cy="116" r="18" fill="#2DD4BF" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      role="img"
      aria-label="NeuroNest mark"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <defs>
        <linearGradient id="nn-tile-bg" x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2B2D31" />
          <stop offset="100%" stopColor="#1E1F22" />
        </linearGradient>
      </defs>

      {/* Deep Obsidian Squircle Container (22.5% radius) */}
      <rect width="256" height="256" rx="58" fill="url(#nn-tile-bg)" />

      {/* The Haven N Symbol */}
      <g transform="translate(48.6, 48.6) scale(0.62)">
        <rect x="44" y="36" width="44" height="184" rx="12" fill="#F8FAFC" />
        <rect x="168" y="36" width="44" height="184" rx="12" fill="#F8FAFC" />
        <path
          d="M 88 56 C 108 64, 128 92, 142 128 C 156 164, 164 190, 168 204 L 168 174 C 156 142, 142 112, 126 84 C 114 62, 102 48, 88 40 Z"
          fill="#14B8A6"
        />
        <circle cx="128" cy="116" r="18" fill="#2DD4BF" />
      </g>
    </svg>
  );
}
