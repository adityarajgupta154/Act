/**
 * Nyaya Nagri — Avatar builder UI (Task 14, PRD §7.2)
 *
 * Shared by the onboarding step and the Settings "Edit Avatar" overlay.
 * Controlled component: parent owns the draft config. All choices are
 * cartoon asset ids only — there is no photo upload, camera capture, or
 * file input anywhere in this flow, by design (PRD §9.4). The only free
 * text is the game nickname, with explicit "not your real name" guidance
 * (§6.5 rule); the parent gates progress on it being non-blank.
 *
 * Boy/Girl heroes: the parent owns BOTH drafts and switches which one is
 * `value` (so each character's customization survives switching).
 * Hair/clothes rows are gender-aware via HAIR_STYLES_FOR / OUTFITS_FOR.
 *
 * Two presentations, ONE source of row logic (`variant` prop):
 *   card  — the original compact white-card layout (Settings overlay).
 *   scene — the "Make your hero" plaza reference frame: tall live-preview
 *           panel on the left with the real-time note, option rows with
 *           small glyphs on the right, cream/gold pill styling. Same
 *           state, handlers, gating and aria semantics in both.
 */
import React from 'react';
import { RefreshCw, Star } from 'lucide-react';
import {
  ACCESSORIES,
  BASE_LOOKS,
  CHARACTERS,
  createDefaultAvatar,
  FREE_ACCESSORIES,
  HAIR_STYLES,
  HAIR_STYLES_FOR,
  MAX_ACCESSORIES,
  NICKNAME_MAX_LENGTH,
  OUTFITS,
  OUTFITS_FOR,
  SKIN_TONES,
  type Accessory,
  type CharacterType,
  type PlayerAvatarConfig,
} from './avatarConfig';
import { PlayerAvatar } from './PlayerAvatar';
import {
  ACCESSORY_GLYPHS,
  HAIR_GLYPHS,
  LOOK_GLYPHS,
  OUTFIT_GLYPHS,
} from './avatarGlyphs';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';

type Variant = 'card' | 'scene';

/** Decorative pill glyph — scene variant only, scales with the pill text. */
function Glyph({
  scene,
  component: Component,
}: {
  scene: boolean;
  component?: React.ComponentType<{ className?: string }>;
}) {
  if (!scene || !Component) return null;
  return <Component className="h-[1.15em] w-[1.15em] shrink-0" />;
}

export function AvatarBuilder({
  value,
  onChange,
  onSelectCharacter,
  drafts,
  accessoryOptions = FREE_ACCESSORIES,
  variant = 'card',
}: {
  value: PlayerAvatarConfig;
  onChange: (config: PlayerAvatarConfig) => void;
  /**
   * Boy/Girl card tapped. The parent swaps `value` to that character's
   * own draft — this component never resets anything itself.
   */
  onSelectCharacter: (character: CharacterType) => void;
  /**
   * Each character's current draft, used for the card previews so the
   * un-selected hero still shows how the child last customized them.
   * Falls back to that character's default look.
   */
  drafts?: Partial<Record<CharacterType, PlayerAvatarConfig>>;
  /**
   * Which accessories to offer (Task 16): defaults to the free starter
   * set (onboarding). The Settings editor passes free + OWNED shop items,
   * so un-bought shop cosmetics never even appear as choices.
   */
  accessoryOptions?: readonly Accessory[];
  /** Presentation only — 'card' (overlay, default) or 'scene' (plaza frame). */
  variant?: Variant;
}) {
  const t = useStrings();
  const scene = variant === 'scene';
  const patch = (p: Partial<PlayerAvatarConfig>) => onChange({ ...value, ...p });

  const toggleAccessory = (a: Accessory) => {
    if (value.accessories.includes(a)) {
      patch({ accessories: value.accessories.filter((x) => x !== a) });
    } else if (value.accessories.length < MAX_ACCESSORIES) {
      patch({ accessories: [...value.accessories, a] });
    }
  };

  /* ------------------------- variant style tokens ------------------------ */

  const sectionLabel = scene
    ? 'mb-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-[#c2410c] lg:mb-[clamp(0.18rem,0.45vh,0.4rem)] lg:text-[clamp(0.6rem,1.3vh,0.82rem)]'
    : 'text-xs font-bold text-slate-500 uppercase tracking-wider mb-2';

  const pillBase = scene
    ? 'inline-flex items-center gap-1.5 rounded-full border font-bold transition-all touch-manipulation px-3.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:gap-[clamp(0.24rem,0.55vh,0.45rem)] lg:px-[clamp(0.58rem,1.05vh,0.95rem)] lg:py-[clamp(0.22rem,0.62vh,0.5rem)] lg:text-[clamp(0.75rem,1.6vh,0.98rem)]'
    : 'px-4 py-2 rounded-full font-bold text-sm border-2 transition-colors touch-manipulation';
  const pillOn = scene
    ? 'border-orange-400 bg-gradient-to-b from-[#ffa03f] to-[#f0711a] text-white shadow-[0_7px_13px_-7px_rgba(194,65,12,0.85)] ring-1 ring-white/40'
    : 'bg-orange-500 text-white border-orange-500';
  const pillOff = scene
    ? 'border-[#eadbb8] bg-white/95 text-[#21406b] shadow-[0_4px_10px_-7px_rgba(101,67,10,0.55)] hover:border-amber-300'
    : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300';

  /* Programmatic name for the sole text input (a11y): the visible heading is
     a real <label> bound to the input via this id. */
  const nicknameId = React.useId();

  /* Extras row: six pills must share one lg row (reference layout), so the
     scene variant slims ONLY their px/text — same pill height as the rest. */
  const extrasBase = scene
    ? 'inline-flex items-center gap-1.5 rounded-full border font-bold transition-all touch-manipulation px-3.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:gap-[clamp(0.2rem,0.45vh,0.38rem)] lg:px-[clamp(0.5rem,0.85vh,0.78rem)] lg:py-[clamp(0.22rem,0.62vh,0.5rem)] lg:text-[clamp(0.72rem,1.5vh,0.92rem)]'
    : pillBase;

  /* extras keep their green "equipped" tone in the overlay; the plaza
     reference styles selected extras exactly like other selected pills */
  const extraOn = scene ? pillOn : 'bg-green-600 text-white border-green-600';
  const extraOff = scene
    ? pillOff
    : 'bg-white text-slate-600 border-slate-200 hover:border-green-300';
  const extraFull = scene
    ? 'border-[#efe6cf] bg-[#faf3e2] text-[#bcab8a] shadow-none'
    : 'bg-slate-50 text-slate-300 border-slate-100';

  /* --------------------------------- rows -------------------------------- */

  const rows = (
    <div
      className={cn(
        scene
          ? 'flex min-w-0 flex-col gap-3.5 lg:min-h-0 lg:flex-1 lg:justify-between lg:gap-[clamp(0.28rem,0.82vh,0.65rem)]'
          : 'space-y-4',
      )}
    >
      <div>
        <p className={sectionLabel}>{t.characterLabel}</p>
        <div
          className={cn(
            'grid grid-cols-2',
            scene ? 'max-w-[22rem] gap-2 lg:gap-[clamp(0.4rem,1vh,0.8rem)]' : 'gap-3',
          )}
        >
          {CHARACTERS.map((c, i) => {
            const selected = value.character === c;
            const preview = selected ? value : (drafts?.[c] ?? createDefaultAvatar(c));
            return scene ? (
              <button
                key={c}
                type="button"
                onClick={() => onSelectCharacter(c)}
                aria-pressed={selected}
                className={cn(
                  pillBase,
                  selected ? pillOn : pillOff,
                  'justify-center gap-2 lg:gap-[clamp(0.35rem,0.85vh,0.65rem)]',
                )}
              >
                <span
                  className={cn(
                    'grid shrink-0 place-items-center overflow-hidden rounded-full ring-1',
                    'h-[1.7em] w-[1.7em]',
                    selected ? 'bg-white/90 ring-white/70' : 'bg-sky-50 ring-[#e5d5ae]',
                  )}
                  aria-hidden="true"
                >
                  <PlayerAvatar config={preview} size={26} variant="face" />
                </span>
                {t.characterNames[i]}
              </button>
            ) : (
              <button
                key={c}
                type="button"
                onClick={() => onSelectCharacter(c)}
                aria-pressed={selected}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl border-2 pt-3 pb-2 transition-all touch-manipulation',
                  selected
                    ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-300 shadow-md'
                    : 'border-slate-200 bg-white opacity-80 hover:opacity-100 hover:border-orange-300',
                )}
              >
                <PlayerAvatar config={preview} size={60} />
                <span
                  className={cn(
                    'font-bold text-sm',
                    selected ? 'text-orange-600' : 'text-slate-500',
                  )}
                >
                  {t.characterNames[i]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className={sectionLabel}>{t.baseLookLabel}</p>
        <div className="flex flex-wrap gap-2 lg:gap-[clamp(0.35rem,0.75vh,0.6rem)]">
          {BASE_LOOKS.map((b, i) => (
            <button
              key={b}
              type="button"
              onClick={() => patch({ base: b })}
              aria-pressed={value.base === b}
              className={cn(pillBase, value.base === b ? pillOn : pillOff)}
            >
              <Glyph scene={scene} component={LOOK_GLYPHS[b]} />
              {t.baseLookNames[i]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={sectionLabel}>{t.skinToneLabel}</p>
        <div className="flex flex-wrap gap-2 lg:gap-[clamp(0.45rem,1.1vh,0.85rem)]">
          {SKIN_TONES.map((tone, i) => (
            <button
              key={tone}
              type="button"
              onClick={() => patch({ skinTone: tone })}
              aria-pressed={value.skinTone === tone}
              aria-label={`${t.skinToneLabel} ${i + 1}`}
              className={cn(
                'rounded-full border-4 transition-transform touch-manipulation',
                scene
                  ? 'h-9 w-9 lg:h-[clamp(1.6rem,3.7vh,2.4rem)] lg:w-[clamp(1.6rem,3.7vh,2.4rem)]'
                  : 'w-10 h-10',
                value.skinTone === tone
                  ? 'border-orange-400 scale-110 shadow-md'
                  : 'border-white shadow-sm hover:scale-105',
              )}
              style={{ backgroundColor: tone }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className={sectionLabel}>{t.hairLabel}</p>
        <div className="flex flex-wrap gap-2 lg:gap-[clamp(0.35rem,0.75vh,0.6rem)]">
          {HAIR_STYLES_FOR[value.character].map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => patch({ hair: h })}
              aria-pressed={value.hair === h}
              className={cn(pillBase, value.hair === h ? pillOn : pillOff)}
            >
              <Glyph scene={scene} component={HAIR_GLYPHS[h]} />
              {t.hairStyleNames[HAIR_STYLES.indexOf(h)]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={sectionLabel}>{t.outfitLabel}</p>
        <div className="flex flex-wrap gap-2 lg:gap-[clamp(0.35rem,0.75vh,0.6rem)]">
          {OUTFITS_FOR[value.character].map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => patch({ outfit: o })}
              aria-pressed={value.outfit === o}
              className={cn(pillBase, value.outfit === o ? pillOn : pillOff)}
            >
              <Glyph scene={scene} component={OUTFIT_GLYPHS[o]} />
              {t.outfitNames[OUTFITS.indexOf(o)]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={sectionLabel}>{t.accessoriesLabel}</p>
        <div className="flex flex-wrap gap-2 lg:gap-[clamp(0.35rem,0.75vh,0.6rem)]">
          {accessoryOptions.map((a) => {
            const i = ACCESSORIES.indexOf(a);
            const selected = value.accessories.includes(a);
            const full = !selected && value.accessories.length >= MAX_ACCESSORIES;
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAccessory(a)}
                aria-pressed={selected}
                disabled={full}
                className={cn(extrasBase, selected ? extraOn : full ? extraFull : extraOff)}
              >
                <Glyph scene={scene} component={ACCESSORY_GLYPHS[a]} />
                {t.accessoryNames[i]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor={nicknameId} className={cn(sectionLabel, 'block')}>
          {t.pickNickname}
        </label>
        <div className="relative">
          <input
            id={nicknameId}
            type="text"
            value={value.nickname}
            onChange={(e) => patch({ nickname: e.target.value })}
            maxLength={NICKNAME_MAX_LENGTH}
            placeholder={t.nicknamePlaceholder}
            className={cn(
              'w-full font-bold text-slate-700 bg-white focus:outline-none',
              scene
                ? 'rounded-xl border-2 border-[#eadbb8] px-4 py-2.5 pr-10 focus:border-orange-400 lg:rounded-[clamp(0.6rem,1.5vh,0.95rem)] lg:px-[clamp(0.8rem,1.8vh,1.25rem)] lg:py-[clamp(0.32rem,0.95vh,0.7rem)] lg:pr-[clamp(2rem,4.2vh,2.9rem)] lg:text-[clamp(0.82rem,1.8vh,1.1rem)]'
                : 'px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-400',
            )}
          />
          {scene && (
            <Star
              className="pointer-events-none absolute right-3 top-1/2 h-[1.15rem] w-[1.15rem] -translate-y-1/2 fill-amber-400 text-amber-500 lg:right-[clamp(0.7rem,1.5vh,1.05rem)] lg:h-[clamp(0.95rem,2.1vh,1.35rem)] lg:w-[clamp(0.95rem,2.1vh,1.35rem)]"
              aria-hidden="true"
            />
          )}
        </div>
        <p
          className={cn(
            'font-bold',
            scene
              ? 'mt-1 text-xs text-[#e8590c] lg:mt-[clamp(0.2rem,0.65vh,0.5rem)] lg:text-[clamp(0.7rem,1.55vh,0.98rem)]'
              : 'mt-1.5 text-sm text-amber-600',
          )}
        >
          {t.nicknameHint}
        </p>
      </div>
    </div>
  );

  /* ------------------------------ layouts -------------------------------- */

  if (!scene) {
    return (
      <div>
        {/* Live preview */}
        <div className="flex justify-center mb-5">
          <div className="bg-sky-50 border border-sky-100 rounded-2xl px-6 pt-4">
            <PlayerAvatar config={value} size={104} />
          </div>
        </div>
        {rows}
      </div>
    );
  }

  return (
    <div className="flex-1 lg:grid lg:min-h-0 lg:grid-cols-[clamp(9.5rem,13vw,16rem)_minmax(0,1fr)] lg:items-stretch lg:gap-[clamp(0.9rem,1.2vw,1.7rem)]">
      {/* Live preview panel — the hero inside updates with every choice */}
      <div className="mb-4 flex justify-center lg:mb-0 lg:block lg:min-h-0">
        <div className="flex w-full max-w-[15rem] flex-col lg:h-full lg:max-w-none">
          <div className="relative flex min-h-[11rem] flex-1 items-end justify-center overflow-hidden rounded-[1.3rem] bg-gradient-to-b from-[#e6f3fd] to-[#cde5f9] px-[8%] pb-[6%] pt-[7%] shadow-[inset_0_2px_8px_rgba(125,170,235,0.3)] ring-1 ring-sky-200/80 lg:rounded-[clamp(1rem,2.3vh,1.7rem)]">
            <div className="w-full [&_svg]:block [&_svg]:h-auto [&_svg]:w-full">
              <PlayerAvatar config={value} size={340} />
            </div>
          </div>
          <p className="mt-2 flex items-start justify-center gap-1.5 text-center text-xs font-semibold leading-snug text-[#33517d] lg:mt-[clamp(0.4rem,1.1vh,0.85rem)] lg:text-[clamp(0.66rem,1.5vh,0.94rem)]">
            <RefreshCw
              className="mt-[0.15em] h-[1.15em] w-[1.15em] shrink-0 text-[#2e6bd8]"
              aria-hidden="true"
            />
            <span>{t.avatarLiveNote}</span>
          </p>
        </div>
      </div>

      {rows}
    </div>
  );
}
