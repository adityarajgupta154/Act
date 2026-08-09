/**
 * Nyaya Nagri — Player avatar renderer (Task 14, PRD §7.2)
 *
 * Pure SVG cartoon renderer driven entirely by PlayerAvatarConfig ids —
 * illustrated assets only, no image/photo data path exists. Two variants:
 *  - "full": head + torso (avatar builder preview)
 *  - "face": head crop (HUD chip, minimap marker)
 * Purely cosmetic; renders the same for every age band and never touches
 * gameplay state.
 *
 * Boy/Girl heroes: `config.character === 'girl'` draws her OWN art — girl
 * hair styles (bob, side curls, long braids, ponytail, bun with wisps),
 * lashes, and female outfit silhouettes (kurti with flared hem, A-line
 * dress) — never just the boy recolored.
 */
import React from 'react';
import type { Accessory, PlayerAvatarConfig } from './avatarConfig';

const HAIR = '#3B2A20';

const OUTFIT_COLORS: Record<PlayerAvatarConfig['outfit'], { main: string; accent: string }> = {
  kurta: { main: '#F97316', accent: '#FFEDD5' },
  tshirt: { main: '#0EA5E9', accent: '#E0F2FE' },
  kameez: { main: '#22C55E', accent: '#DCFCE7' },
  hoodie: { main: '#8B5CF6', accent: '#EDE9FE' },
  kurti: { main: '#EC4899', accent: '#FCE7F3' },
  dress: { main: '#14B8A6', accent: '#CCFBF1' },
};

function has(config: PlayerAvatarConfig, a: Accessory): boolean {
  return config.accessories.includes(a);
}

export function PlayerAvatar({
  config,
  size = 96,
  variant = 'full',
  className,
}: {
  config: PlayerAvatarConfig;
  size?: number;
  variant?: 'full' | 'face';
  className?: string;
}) {
  const outfit = OUTFIT_COLORS[config.outfit];
  const girl = config.character === 'girl';
  const face = variant === 'face';
  // Full figure lives in 0..100 x 0..120; face variant crops to the head.
  const viewBox = face ? '18 8 64 64' : '0 0 100 120';
  const height = face ? size : Math.round(size * 1.2);

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={height}
      className={className}
      role="img"
      aria-label={config.nickname || 'player avatar'}
    >
      {!face && (
        <g>
          {/* Cape (Task 16 shop cosmetic) — drawn BEHIND the torso */}
          {has(config, 'cape') && (
            <path
              d="M27,82 Q14,100 22,118 L34,112 L34,84 Z M73,82 Q86,100 78,118 L66,112 L66,84 Z"
              fill="#DC2626"
              stroke="#B91C1C"
              strokeWidth="1.5"
            />
          )}
          {/* Torso — the dress swaps the whole silhouette for an A-line */}
          {config.outfit === 'dress' ? (
            <path
              d="M28,120 Q24,98 36,82 Q43,76 50,76 Q57,76 64,82 Q76,98 72,120 Z"
              fill={outfit.main}
            />
          ) : (
            <path d="M25,120 V96 Q25,78 50,78 Q75,78 75,96 V120 Z" fill={outfit.main} />
          )}
          {config.outfit === 'dress' && (
            <>
              <path d="M43,78 Q50,84 57,78" fill="none" stroke={outfit.accent} strokeWidth="3" strokeLinecap="round" />
              <path d="M31,110 Q50,117 69,110" fill="none" stroke={outfit.accent} strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
          {config.outfit === 'kurti' && (
            <>
              {/* Flared hem panels + neckline + hem stitch */}
              <path d="M25,104 Q19,114 23,120 L25,120 Z" fill={outfit.main} />
              <path d="M75,104 Q81,114 77,120 L75,120 Z" fill={outfit.main} />
              <path d="M44,79 L50,88 L56,79" fill="none" stroke={outfit.accent} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M28,108 Q50,114 72,108" fill="none" stroke={outfit.accent} strokeWidth="2" strokeLinecap="round" />
            </>
          )}
          {config.outfit === 'kurta' && (
            <>
              <line x1="50" y1="82" x2="50" y2="104" stroke={outfit.accent} strokeWidth="2.5" />
              <circle cx="50" cy="86" r="1.6" fill={outfit.accent} />
              <circle cx="50" cy="93" r="1.6" fill={outfit.accent} />
            </>
          )}
          {config.outfit === 'tshirt' && (
            <path d="M42,79 Q50,86 58,79" fill="none" stroke={outfit.accent} strokeWidth="3" strokeLinecap="round" />
          )}
          {config.outfit === 'kameez' && (
            <path d="M44,79 L50,90 L56,79" fill="none" stroke={outfit.accent} strokeWidth="2.5" strokeLinecap="round" />
          )}
          {config.outfit === 'hoodie' && (
            <>
              <line x1="45" y1="84" x2="45" y2="96" stroke={outfit.accent} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="55" y1="84" x2="55" y2="96" stroke={outfit.accent} strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
          {has(config, 'backpack') && (
            <>
              <line x1="34" y1="82" x2="34" y2="118" stroke="#7C5E3C" strokeWidth="6" strokeLinecap="round" />
              <line x1="66" y1="82" x2="66" y2="118" stroke="#7C5E3C" strokeWidth="6" strokeLinecap="round" />
            </>
          )}
          {has(config, 'scarf') && <rect x="31" y="74" width="38" height="9" rx="4.5" fill="#FACC15" />}
          {has(config, 'star') && (
            <path
              d="M38 90 l1.9 3.9 4.3 .6 -3.1 3 .7 4.2 -3.8 -2 -3.8 2 .7 -4.2 -3.1 -3 4.3 -.6 Z"
              fill="#FDE047"
              stroke="#F59E0B"
              strokeWidth="1"
            />
          )}
          {/* Medal (Task 16 shop cosmetic) — ribbon + disc on the chest */}
          {has(config, 'medal') && (
            <g>
              <path d="M58,80 L62,92 L66,80 Z" fill="#3B82F6" />
              <circle cx="62" cy="96" r="5.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
              <circle cx="62" cy="96" r="2.2" fill="#FDE68A" />
            </g>
          )}
        </g>
      )}

      {/* Head */}
      <circle cx="50" cy="45" r="24" fill={config.skinTone} />

      {/* Hair — the girl draws her OWN styles (bob, side curls, long
          braids, ponytail, bun with wisps); the boy keeps his original set */}
      <g fill={HAIR}>
        <path d="M26,45 A24,24 0 0 1 74,45 L74,40 A24,20 0 0 0 26,40 Z" />
        <path d="M26,45 A24,24 0 0 1 74,45" stroke={HAIR} strokeWidth="4" fill="none" />
        {girl ? (
          <>
            {config.hair === 'short' && (
              <>
                <path d="M26,40 Q35,22 50,22 Q65,22 74,40 Q60,27 50,27 Q40,27 26,40 Z" />
                <path d="M26,38 Q21,54 27,66 Q33,63 34,54 Q30,46 31,38 Z" />
                <path d="M74,38 Q79,54 73,66 Q67,63 66,54 Q70,46 69,38 Z" />
              </>
            )}
            {config.hair === 'curly' && (
              <>
                <circle cx="31" cy="29" r="8" />
                <circle cx="50" cy="21" r="9" />
                <circle cx="69" cy="29" r="8" />
                <circle cx="27" cy="45" r="7" />
                <circle cx="73" cy="45" r="7" />
                <circle cx="30" cy="57" r="6" />
                <circle cx="70" cy="57" r="6" />
              </>
            )}
            {config.hair === 'braids' && (
              <>
                <rect x="15" y="42" width="9" height="30" rx="4.5" />
                <rect x="76" y="42" width="9" height="30" rx="4.5" />
                <circle cx="19.5" cy="72" r="3" fill="#F472B6" />
                <circle cx="80.5" cy="72" r="3" fill="#F472B6" />
              </>
            )}
            {config.hair === 'ponytail' && (
              <>
                <circle cx="64" cy="15" r="5.5" />
                <path d="M66,17 Q84,28 79,52 Q76,62 71,60 Q77,42 62,24 Z" />
                <circle cx="64" cy="15" r="2.2" fill="#F472B6" />
              </>
            )}
            {config.hair === 'bun' && (
              <>
                <circle cx="50" cy="16" r="9" />
                <path d="M28,38 Q25,48 29,56 Q32,53 32,46 Z" />
                <path d="M72,38 Q75,48 71,56 Q68,53 68,46 Z" />
              </>
            )}
          </>
        ) : (
          <>
            {config.hair === 'curly' && (
              <>
                <circle cx="31" cy="29" r="8" />
                <circle cx="50" cy="21" r="9" />
                <circle cx="69" cy="29" r="8" />
              </>
            )}
            {config.hair === 'braids' && (
              <>
                <rect x="17" y="42" width="9" height="24" rx="4.5" />
                <rect x="74" y="42" width="9" height="24" rx="4.5" />
                <circle cx="21.5" cy="66" r="3" fill="#F472B6" />
                <circle cx="78.5" cy="66" r="3" fill="#F472B6" />
              </>
            )}
            {config.hair === 'bun' && <circle cx="50" cy="16" r="9" />}
            {config.hair === 'short' && <path d="M26,40 Q35,24 50,24 Q65,24 74,40 Q62,30 50,30 Q38,30 26,40 Z" />}
          </>
        )}
      </g>

      {/* Face */}
      {config.base === 'sunny' ? (
        <g>
          <circle cx="41" cy="46" r="2.6" fill="#1F2937" />
          <circle cx="59" cy="46" r="2.6" fill="#1F2937" />
          <path d="M42,55 Q50,63 58,55" fill="none" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <ellipse cx="41" cy="46" rx="3" ry="2.2" fill="#1F2937" />
          <ellipse cx="59" cy="46" rx="3" ry="2.2" fill="#1F2937" />
          <path d="M36,40 L45,38" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
          <path d="M55,38 L64,40" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
          <path d="M43,56 Q52,61 58,54" fill="none" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
      {girl && (
        <g stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round">
          <path d="M34,41.5 L30.5,39.5" />
          <path d="M66,41.5 L69.5,39.5" />
        </g>
      )}
      <circle cx="34" cy="52" r="3" fill="#F87171" opacity="0.3" />
      <circle cx="66" cy="52" r="3" fill="#F87171" opacity="0.3" />

      {/* Head accessories */}
      {has(config, 'glasses') && (
        <g stroke="#334155" strokeWidth="2" fill="rgba(255,255,255,0.35)">
          <circle cx="41" cy="46" r="6.5" />
          <circle cx="59" cy="46" r="6.5" />
          <line x1="47.5" y1="46" x2="52.5" y2="46" />
        </g>
      )}
      {has(config, 'cap') && (
        <g>
          <path d="M29,31 A21,15 0 0 1 71,31 L71,34 L29,34 Z" fill="#0284C7" />
          <rect x="24" y="32" width="52" height="6" rx="3" fill="#0369A1" />
        </g>
      )}
      {has(config, 'flower') && (
        <g>
          <circle cx="25" cy="34" r="3" fill="#F472B6" />
          <circle cx="31" cy="34" r="3" fill="#F472B6" />
          <circle cx="28" cy="31" r="3" fill="#F472B6" />
          <circle cx="28" cy="37" r="3" fill="#F472B6" />
          <circle cx="28" cy="34" r="2.2" fill="#FDE047" />
        </g>
      )}
      {/* Crown (Task 16 shop cosmetic) — sits on top of any hair style */}
      {has(config, 'crown') && (
        <g>
          <path
            d="M36,24 L38,12 L45,19 L50,9 L55,19 L62,12 L64,24 Z"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="1.5"
          />
          <circle cx="50" cy="15" r="1.8" fill="#F87171" />
        </g>
      )}
      {/* Hair bow (Task 16 shop cosmetic) */}
      {has(config, 'bow') && (
        <g>
          <path d="M69,29 L78,24 L78,34 Z" fill="#F472B6" stroke="#DB2777" strokeWidth="1" />
          <path d="M69,29 L60,24 L60,34 Z" fill="#F472B6" stroke="#DB2777" strokeWidth="1" />
          <circle cx="69" cy="29" r="2.4" fill="#FDE047" />
        </g>
      )}
    </svg>
  );
}
