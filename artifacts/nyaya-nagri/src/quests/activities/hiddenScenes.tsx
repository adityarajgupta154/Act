/**
 * Nyaya Nagri — Hidden-object scenes (Task 18, 8-11 band only)
 *
 * Static, hand-drawn SVG scenes in the app's flat, friendly cartoon style
 * (rounded shapes, sky/orange/amber palette — same language as the persona
 * sprites and zone map). Never AI-generated (PRD §9.8), and deliberately
 * gentle per the Task 4 trauma-sensitivity rules: the working children are
 * drawn neutrally — tired, not hurt; nothing graphic, no distress on faces.
 *
 * Scenes are keyed by HiddenSceneKey; cue geometry lives in content JSON as
 * percent coordinates over the 100 x 62.5 viewBox (x: 0-100 of width,
 * y: 0-100 of height => svg y = y * 0.625).
 */
import React from 'react';
import type { HiddenSceneKey } from '../schema';

/** A small, neutral child figure (shirt color varies). */
function Child({
  x,
  y,
  shirt,
  skin = '#D5A17A',
}: {
  x: number;
  y: number;
  shirt: string;
  skin?: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={0} cy={-6.2} r={2.1} fill={skin} />
      <path d="M -2.1 -7.2 A 2.1 2.1 0 0 1 2.1 -7.2 L 1.6 -6.6 L -1.6 -6.6 Z" fill="#3F3F46" />
      <rect x={-1.9} y={-4.2} width={3.8} height={5.2} rx={1.4} fill={shirt} />
      <rect x={-1.7} y={0.8} width={1.4} height={3.4} rx={0.7} fill="#475569" />
      <rect x={0.3} y={0.8} width={1.4} height={3.4} rx={0.7} fill="#475569" />
      <circle cx={-0.7} cy={-6.4} r={0.28} fill="#27272A" />
      <circle cx={0.7} cy={-6.4} r={0.28} fill="#27272A" />
    </g>
  );
}

/**
 * Market street on a school morning. Three gentle "not right for a child"
 * cues (positions must match the content JSON):
 *  - tea_tray       (~21, 42): boy carrying a loaded tea tray at the stall
 *  - heavy_sack     (~52, 46): small girl lifting a sack bigger than her
 *  - tools_workshop (~82, 44): child working with a wrench at cycle repair
 * Safe context: children with school bags walking to the school at the back.
 */
function MarketStreetScene() {
  return (
    <g>
      {/* Sky, sun, clouds */}
      <rect x={0} y={0} width={100} height={40} fill="#E0F2FE" />
      <circle cx={9} cy={8} r={4.5} fill="#FCD34D" />
      <ellipse cx={30} cy={7} rx={6} ry={2.2} fill="#FFFFFF" />
      <ellipse cx={70} cy={5} rx={7} ry={2.4} fill="#FFFFFF" />

      {/* School building at the back (children belong THERE at this hour) */}
      <g>
        <rect x={58} y={14} width={26} height={16} rx={1.2} fill="#FDE68A" />
        <rect x={67} y={22} width={7} height={8} rx={0.8} fill="#B45309" />
        <rect x={60.5} y={17} width={5} height={4} rx={0.6} fill="#FFFFFF" />
        <rect x={76} y={17} width={5} height={4} rx={0.6} fill="#FFFFFF" />
        <path d="M 56.5 14.5 L 70.5 8 L 85.5 14.5 Z" fill="#FB923C" />
        <rect x={69.9} y={4} width={0.8} height={5.5} fill="#78716C" />
        <path d="M 70.7 4.2 L 75 5.4 L 70.7 6.6 Z" fill="#F97316" />
        <text
          x={71}
          y={20.3}
          textAnchor="middle"
          fontSize={2.6}
          fontFamily="sans-serif"
          fontWeight={700}
          fill="#92400E"
        >
          SCHOOL
        </text>
      </g>
      {/* Two children walking to school with bags (the safe, happy contrast) */}
      <Child x={63} y={35} shirt="#38BDF8" />
      <rect x={64.4} y={30} width={2} height={2.8} rx={0.7} fill="#F472B6" />
      <Child x={68.5} y={35.5} shirt="#4ADE80" skin="#B98153" />
      <rect x={69.9} y={30.5} width={2} height={2.8} rx={0.7} fill="#FACC15" />

      {/* Ground and road */}
      <rect x={0} y={38} width={100} height={24.5} fill="#FEF3C7" />
      <rect x={0} y={52} width={100} height={10.5} fill="#E7E5E4" />
      <rect x={4} y={56.6} width={7} height={1.1} rx={0.55} fill="#FFFFFF" />
      <rect x={24} y={56.6} width={7} height={1.1} rx={0.55} fill="#FFFFFF" />
      <rect x={44} y={56.6} width={7} height={1.1} rx={0.55} fill="#FFFFFF" />
      <rect x={64} y={56.6} width={7} height={1.1} rx={0.55} fill="#FFFFFF" />
      <rect x={84} y={56.6} width={7} height={1.1} rx={0.55} fill="#FFFFFF" />

      {/* ---- Tea stall (left) with the tea-tray boy (CUE ~21,42) ---- */}
      <g>
        <rect x={8} y={30} width={16} height={12} rx={1} fill="#FDBA74" />
        <path d="M 6.8 30.5 L 16 25.5 L 25.2 30.5 Z" fill="#F97316" />
        <rect x={9.5} y={33} width={13} height={4.5} rx={0.8} fill="#FFF7ED" />
        {/* kettle on the counter */}
        <ellipse cx={13} cy={32.4} rx={1.7} ry={1.3} fill="#94A3B8" />
        <path d="M 14.5 31.9 q 1.4 0 1.4 1" stroke="#94A3B8" strokeWidth={0.5} fill="none" />
        {/* adult stall owner (neutral) */}
        <g transform="translate(19.5 31.5)">
          <circle cx={0} cy={-4.6} r={1.7} fill="#B98153" />
          <rect x={-1.6} y={-2.9} width={3.2} height={4.4} rx={1.2} fill="#78716C" />
        </g>
        {/* the boy: slightly bent, carrying a tray loaded with glasses */}
        <g transform="translate(21 46.5)">
          <circle cx={0} cy={-7.8} r={2.2} fill="#D5A17A" />
          <path d="M -2.2 -8.8 A 2.2 2.2 0 0 1 2.2 -8.8 L 1.7 -8.1 L -1.7 -8.1 Z" fill="#3F3F46" />
          <circle cx={-0.7} cy={-8} r={0.3} fill="#27272A" />
          <circle cx={0.7} cy={-8} r={0.3} fill="#27272A" />
          <rect x={-2} y={-5.6} width={4} height={5.6} rx={1.4} fill="#F59E0B" transform="rotate(6)" />
          <rect x={-1.8} y={-0.2} width={1.5} height={3.8} rx={0.7} fill="#57534E" />
          <rect x={0.4} y={-0.2} width={1.5} height={3.8} rx={0.7} fill="#57534E" />
          {/* outstretched arms holding a wide tray of tea glasses */}
          <rect x={1.2} y={-5} width={4.6} height={1} rx={0.5} fill="#D5A17A" />
          <rect x={1} y={-6.2} width={6.4} height={1} rx={0.4} fill="#92400E" />
          <rect x={1.9} y={-7.5} width={1} height={1.4} rx={0.3} fill="#FDE68A" />
          <rect x={3.4} y={-7.5} width={1} height={1.4} rx={0.3} fill="#FDE68A" />
          <rect x={4.9} y={-7.5} width={1} height={1.4} rx={0.3} fill="#FDE68A" />
        </g>
      </g>

      {/* ---- Vegetable stall (center) with the sack girl (CUE ~52,46) ---- */}
      <g>
        <rect x={40} y={31} width={17} height={11} rx={1} fill="#86EFAC" />
        <path d="M 38.8 31.5 L 48.5 26.5 L 58.2 31.5 Z" fill="#22C55E" />
        <rect x={41.5} y={34} width={14} height={4} rx={0.8} fill="#FFF7ED" />
        <circle cx={44} cy={33.4} r={1} fill="#F97316" />
        <circle cx={46.3} cy={33.4} r={1} fill="#EF4444" />
        <circle cx={48.6} cy={33.4} r={1} fill="#84CC16" />
        {/* adult vendor */}
        <g transform="translate(43 31)">
          <circle cx={0} cy={-4.6} r={1.7} fill="#D5A17A" />
          <rect x={-1.6} y={-2.9} width={3.2} height={4.4} rx={1.2} fill="#0EA5E9" />
        </g>
        {/* the girl: small, bent forward under a big sack on her back */}
        <g transform="translate(52 50)">
          <circle cx={-1.6} cy={-6.6} r={2.1} fill="#B98153" />
          <path d="M -3.6 -7.4 A 2.1 2.1 0 0 1 0.4 -7.6 L 0 -6.9 L -3.2 -6.7 Z" fill="#3F3F46" />
          <rect x={-3.4} y={-8.4} width={1} height={2.4} rx={0.5} fill="#3F3F46" />
          <circle cx={-2.2} cy={-6.8} r={0.28} fill="#27272A" />
          <circle cx={-0.9} cy={-6.8} r={0.28} fill="#27272A" />
          <rect x={-3} y={-4.8} width={3.6} height={4.8} rx={1.3} fill="#F472B6" transform="rotate(14)" />
          <rect x={-2.4} y={-0.1} width={1.4} height={3.4} rx={0.7} fill="#57534E" />
          <rect x={-0.4} y={-0.1} width={1.4} height={3.4} rx={0.7} fill="#57534E" />
          {/* the sack — clearly bigger than she is */}
          <ellipse cx={1.8} cy={-7.6} rx={3.6} ry={4.4} fill="#A16207" transform="rotate(18)" />
          <path d="M 0.4 -11.2 q 1.6 -1 3 0" stroke="#854D0E" strokeWidth={0.6} fill="none" />
          <path d="M -0.6 -6.2 q 2.4 0.8 4.6 0" stroke="#854D0E" strokeWidth={0.45} fill="none" />
        </g>
      </g>

      {/* ---- Cycle-repair corner (right) with working child (CUE ~82,44) ---- */}
      <g>
        <rect x={74} y={32} width={16} height={10} rx={1} fill="#CBD5E1" />
        <path d="M 72.8 32.5 L 82 28 L 91.2 32.5 Z" fill="#64748B" />
        {/* upside-down bicycle being repaired */}
        <circle cx={78.5} cy={38} r={2.6} fill="none" stroke="#334155" strokeWidth={0.7} />
        <circle cx={85.5} cy={38} r={2.6} fill="none" stroke="#334155" strokeWidth={0.7} />
        <path d="M 78.5 38 L 82 34.6 L 85.5 38 M 82 34.6 L 82 38" stroke="#334155" strokeWidth={0.7} fill="none" />
        {/* the child: kneeling at the wheel with a wrench, tool box beside */}
        <g transform="translate(82 48.5)">
          <circle cx={0} cy={-6.4} r={2.1} fill="#D5A17A" />
          <path d="M -2.1 -7.4 A 2.1 2.1 0 0 1 2.1 -7.4 L 1.6 -6.7 L -1.6 -6.7 Z" fill="#3F3F46" />
          <circle cx={-0.7} cy={-6.6} r={0.28} fill="#27272A" />
          <circle cx={0.7} cy={-6.6} r={0.28} fill="#27272A" />
          <rect x={-1.9} y={-4.4} width={3.8} height={4.6} rx={1.3} fill="#38BDF8" />
          <rect x={-1.9} y={0} width={3.8} height={1.6} rx={0.8} fill="#57534E" />
          {/* arm holding a wrench up toward the wheel */}
          <rect x={1.4} y={-5.4} width={3.2} height={1} rx={0.5} fill="#D5A17A" transform="rotate(-24)" />
          <path
            d="M 3.6 -7.2 l 1.6 -1.2 m -1.6 1.2 l 0.5 1.9"
            stroke="#475569"
            strokeWidth={0.8}
            strokeLinecap="round"
            fill="none"
          />
          {/* small toolbox */}
          <rect x={-5.6} y={0.4} width={3} height={1.8} rx={0.4} fill="#DC2626" />
          <rect x={-4.7} y={-0.2} width={1.2} height={0.7} rx={0.3} fill="#DC2626" />
        </g>
      </g>
    </g>
  );
}

const SCENES: Record<HiddenSceneKey, () => React.JSX.Element> = {
  market_street: MarketStreetScene,
};

export function HiddenScene({ sceneKey }: { sceneKey: HiddenSceneKey }) {
  const Scene = SCENES[sceneKey];
  return <Scene />;
}
