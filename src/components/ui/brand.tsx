export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="sp-sea" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0E7490" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#sp-sea)" />
      <path
        d="M15 18c3-2.8 6-2.8 9 0s6 2.8 9 0 6-2.8 9 0 5.5 2.6 8 .8"
        fill="none"
        stroke="#FBF9F4"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M14 32c6-3.4 11.5-3.4 18 0 6.5-3.4 12-3.4 18 0v14c-6-3.4-11.5-3.4-18 0-6.5-3.4-12-3.4-18 0Z"
        fill="#FBF9F4"
        opacity="0.95"
      />
      <path d="M32 32v14" stroke="#0E7490" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="text-[16px] font-semibold tracking-tight text-ink">
      Sea<span className="text-accent">Pub</span>
    </span>
  )
}

/** Calm shoreline illustration for the empty library. */
export function ShoreIllustration() {
  return (
    <svg
      viewBox="0 0 260 170"
      className="w-64 text-accent"
      role="img"
      aria-label="An open book resting by gentle waves"
    >
      <defs>
        <linearGradient id="sp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38BDF8" stopOpacity="0.16" />
          <stop offset="1" stopColor="#38BDF8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* soft sky */}
      <rect x="0" y="0" width="260" height="170" rx="20" fill="url(#sp-sky)" />
      {/* sun */}
      <circle cx="186" cy="46" r="20" fill="#F0C98C" opacity="0.75" />
      <circle cx="186" cy="46" r="30" fill="#F0C98C" opacity="0.18" />
      {/* gulls */}
      <path d="M64 38c3-2.4 5-2.4 8 0" stroke="#5C6672" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.55" />
      <path d="M84 30c2.4-2 4-2 6.4 0" stroke="#5C6672" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
      {/* waves */}
      <path
        d="M18 96c10-6 20-6 30 0s20 6 30 0 20-6 30 0 20 6 30 0 20-6 30 0 20 6 30 0 20-6 30 0"
        stroke="#0E7490"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M30 112c10-6 20-6 30 0s20 6 30 0 20-6 30 0 20 6 30 0 20-6 30 0 20 6 30 0"
        stroke="#0E7490"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.28"
      />
      {/* open book */}
      <g transform="translate(130 128)">
        <path
          d="M-56 -18c16-9 30-9 47 0 1.8 1 3.2 1 5 0 17-9 31-9 47 0v26c-16-9-30-9-47 0-1.8 1-3.2 1-5 0-17-9-31-9-47 0Z"
          fill="var(--sp-surface)"
          stroke="var(--sp-border-strong)"
          strokeWidth="1.5"
        />
        <path d="M4 -18v26" stroke="var(--sp-border-strong)" strokeWidth="1.5" />
        <path d="M-46 -8c11-5 21-5 32 0M-46 2c11-5 21-5 32 0M14 -8c11-5 21-5 32 0M14 2c11-5 21-5 32 0"
          stroke="var(--sp-border-strong)" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      </g>
      {/* sand */}
      <path d="M0 152c40-8 90-8 130 0s90 8 130 0v18H0Z" fill="#EFE6D8" opacity="0.7" />
    </svg>
  )
}
