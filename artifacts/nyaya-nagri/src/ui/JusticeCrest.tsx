import React from 'react';

/**
 * Justice crest (scales of justice on a gold-rimmed shield) — the Nyaya
 * Nagri emblem. Shared by the onboarding sign-board and the Home screen
 * branding so the mark is identical everywhere.
 */
export function JusticeCrest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 116" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="nnCrestRim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde9a9" />
          <stop offset="55%" stopColor="#e0ac44" />
          <stop offset="100%" stopColor="#b57d1f" />
        </linearGradient>
        <linearGradient id="nnCrestBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f66c9" />
          <stop offset="100%" stopColor="#14306e" />
        </linearGradient>
      </defs>
      <path d="M50 2 6 16v40c0 28 19 48.5 44 58 25-9.5 44-30 44-58V16L50 2z" fill="url(#nnCrestRim)" />
      <path
        d="M50 11 13.5 22v33.5c0 23.5 15.5 40.5 36.5 49 21-8.5 36.5-25.5 36.5-49V22L50 11z"
        fill="url(#nnCrestBody)"
      />
      <g fill="#ffffff">
        <circle cx="50" cy="24" r="4.2" />
        <rect x="47.6" y="26" width="4.8" height="54" rx="2.4" />
        <rect x="24" y="35.4" width="52" height="4.4" rx="2.2" />
        <rect x="25.6" y="39" width="2.8" height="10" rx="1.4" />
        <rect x="71.6" y="39" width="2.8" height="10" rx="1.4" />
        <path d="M14 48a13 13 0 0 0 26 0z" />
        <path d="M60 48a13 13 0 0 0 26 0z" />
        <path d="M32.5 80h35l5.5 10.5H27z" />
      </g>
    </svg>
  );
}
