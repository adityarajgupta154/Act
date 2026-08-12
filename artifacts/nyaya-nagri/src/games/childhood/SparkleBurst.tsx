/**
 * Small sparkle burst for a correct drop — deliberately SUBTLE (spec §4:
 * "small stars… do NOT use excessive confetti"). Pure CSS pieces riding
 * the `ch-sparkle` keyframe; no canvas, no library.
 */
import React, { useMemo } from 'react';

const PIECES = 10;
const COLORS = ['#fbbf24', '#ffffff', '#f472b6', '#34d399', '#a78bfa'];

export function SparkleBurst({ active }: { active: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => {
        const angle = (i / PIECES) * Math.PI * 2 + Math.random() * 0.6;
        const dist = 34 + Math.random() * 30;
        return {
          dx: `${Math.cos(angle) * dist}px`,
          dy: `${Math.sin(angle) * dist - 14}px`,
          rot: `${Math.floor(Math.random() * 260 - 130)}deg`,
          color: COLORS[i % COLORS.length],
          round: i % 3 === 0,
          delay: `${(i % 4) * 0.03}s`,
        };
      }),
    // Regenerate spread on every mount (parent keys the burst per drop).
    [],
  );

  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`absolute ch-sparkle ${p.round ? 'rounded-full' : 'rounded-[2px]'}`}
          style={
            {
              width: p.round ? 7 : 9,
              height: p.round ? 7 : 9,
              backgroundColor: p.color,
              animationDelay: p.delay,
              '--ch-dx': p.dx,
              '--ch-dy': p.dy,
              '--ch-rot': p.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
