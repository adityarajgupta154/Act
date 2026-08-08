/**
 * Nyaya Nagri — 2D animated persona sprites (Task 17, PRD §7.4)
 *
 * Five hand-drawn SVG characters with a gentle CSS idle animation (bob +
 * blink, reduced-motion aware — keyframes live in index.css). Purely
 * cosmetic: no emojis, no external assets, no PII.
 */
import React from 'react';
import type { PersonaId } from '@/quests/schema';

const SKIN = '#e8b88a';
const SKIN_DARK = '#c98f5f';
const HAIR = '#3d2b1f';

/** Shared face: eyes blink via the persona-blink CSS animation. */
function Face({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <g className="persona-blink">
        <ellipse cx={cx - 7} cy={cy} rx={2.2} ry={3} fill="#2b2b2b" />
        <ellipse cx={cx + 7} cy={cy} rx={2.2} ry={3} fill="#2b2b2b" />
      </g>
      <path
        d={`M ${cx - 5} ${cy + 9} Q ${cx} ${cy + 13} ${cx + 5} ${cy + 9}`}
        stroke="#7a4a2b"
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

function PoliceSprite() {
  return (
    <g>
      <rect x={22} y={52} width={36} height={34} rx={10} fill="#1e3a5f" />
      <rect x={36} y={58} width={8} height={12} rx={2} fill="#d4a017" />
      <circle cx={40} cy={34} r={16} fill={SKIN} />
      <Face cx={40} cy={34} />
      <path d="M 22 30 Q 40 12 58 30 L 58 26 Q 40 8 22 26 Z" fill="#14263d" />
      <rect x={20} y={28} width={40} height={5} rx={2.5} fill="#14263d" />
      <circle cx={40} cy={22} r={3.4} fill="#d4a017" />
    </g>
  );
}

function LawyerSprite() {
  return (
    <g>
      <rect x={22} y={52} width={36} height={34} rx={10} fill="#232323" />
      <path d="M 36 52 L 40 66 L 44 52 Z" fill="#ffffff" />
      <rect x={35} y={52} width={4.4} height={9} rx={1.4} fill="#ffffff" />
      <rect x={40.6} y={52} width={4.4} height={9} rx={1.4} fill="#ffffff" />
      <circle cx={40} cy={34} r={16} fill={SKIN_DARK} />
      <Face cx={40} cy={34} />
      <path d="M 24 30 Q 26 16 40 16 Q 54 16 56 30 L 56 24 Q 52 12 40 12 Q 28 12 24 24 Z" fill={HAIR} />
    </g>
  );
}

function TeacherSprite() {
  return (
    <g>
      <rect x={22} y={52} width={36} height={34} rx={10} fill="#2e7d5b" />
      <rect x={46} y={62} width={14} height={18} rx={2} fill="#f5e6c8" stroke="#b08d4f" strokeWidth={1.5} />
      <circle cx={40} cy={34} r={16} fill={SKIN} />
      <Face cx={40} cy={34} />
      <path d="M 24 28 Q 28 14 40 14 Q 52 14 56 28 L 56 36 Q 54 30 50 26 Q 44 20 30 24 Q 26 26 24 34 Z" fill="#4a3627" />
      <circle cx={33} cy={34} r={5.5} fill="none" stroke="#333" strokeWidth={1.6} />
      <circle cx={47} cy={34} r={5.5} fill="none" stroke="#333" strokeWidth={1.6} />
      <line x1={38.5} y1={34} x2={41.5} y2={34} stroke="#333" strokeWidth={1.6} />
    </g>
  );
}

function JudgeSprite() {
  return (
    <g>
      <rect x={20} y={52} width={40} height={34} rx={10} fill="#4a1f2e" />
      <rect x={35} y={52} width={4.4} height={10} rx={1.4} fill="#ffffff" />
      <rect x={40.6} y={52} width={4.4} height={10} rx={1.4} fill="#ffffff" />
      <circle cx={40} cy={34} r={16} fill={SKIN_DARK} />
      <Face cx={40} cy={34} />
      <path d="M 24 30 Q 26 15 40 15 Q 54 15 56 30 L 56 26 Q 53 11 40 11 Q 27 11 24 26 Z" fill="#6b6b6b" />
      <circle cx={56} cy={20} r={4.5} fill="#6b6b6b" />
    </g>
  );
}

function ParentSprite() {
  return (
    <g>
      <rect x={22} y={52} width={36} height={34} rx={10} fill="#b3541e" />
      <path d="M 22 60 Q 40 50 58 66 L 58 60 Q 40 44 22 54 Z" fill="#e08a3c" />
      <circle cx={40} cy={34} r={16} fill={SKIN} />
      <Face cx={40} cy={34} />
      <path d="M 24 30 Q 26 15 40 15 Q 54 15 56 30 L 58 40 Q 58 46 54 48 Q 56 36 52 28 Q 46 20 34 22 Q 26 25 26 40 Z" fill={HAIR} />
      <circle cx={40} cy={25} r={1.8} fill="#c0392b" />
    </g>
  );
}

const SPRITES: Record<PersonaId, () => React.JSX.Element> = {
  police: PoliceSprite,
  lawyer: LawyerSprite,
  teacher: TeacherSprite,
  judge: JudgeSprite,
  parent: ParentSprite,
};

export function PersonaSprite({
  personaId,
  className,
}: {
  personaId: PersonaId;
  className?: string;
}) {
  const Sprite = SPRITES[personaId];
  return (
    <div className={`persona-bob ${className ?? ''}`} aria-hidden="true">
      <svg viewBox="0 0 80 90" className="w-full h-full">
        <Sprite />
      </svg>
    </div>
  );
}
