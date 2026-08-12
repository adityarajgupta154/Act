/**
 * Lightweight CSS-only confetti burst for correct picks.
 * No canvas, no library — 12 tiny divs launched with CSS custom properties.
 * The CSS keyframe (`rw-confetti`) and the `rw-pop` bounce live in index.css.
 */
import React, { useMemo } from 'react';

const COLOURS = [
  '#f87171', // red-400
  '#fbbf24', // amber-400
  '#34d399', // emerald-400
  '#60a5fa', // blue-400
  '#c084fc', // purple-400
  '#f472b6', // pink-400
];

interface Props {
  /** When true the animation replays (use a key-change to re-trigger). */
  active: boolean;
}

export function ConfettiPop({ active }: Props) {
  const pieces = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      colour: COLOURS[i % COLOURS.length],
      dx: `${(Math.random() * 120 - 60).toFixed(0)}px`,
      dy: `${-(40 + Math.random() * 80).toFixed(0)}px`,
      rot: `${(Math.random() * 360).toFixed(0)}deg`,
      delay: `${(Math.random() * 0.18).toFixed(2)}s`,
      size: `${8 + Math.floor(Math.random() * 8)}px`,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible z-20" aria-hidden>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="rw-confetti absolute left-1/2 top-1/2 rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            background: p.colour,
            '--rw-dx': p.dx,
            '--rw-dy': p.dy,
            '--rw-rot': p.rot,
            animationDelay: p.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
