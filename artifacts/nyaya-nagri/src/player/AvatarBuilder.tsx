/**
 * Nyaya Nagri — Avatar builder UI (Task 14, PRD §7.2)
 *
 * Shared by the onboarding step and the Settings "Edit Avatar" overlay.
 * Controlled component: parent owns the draft config. All choices are
 * cartoon asset ids only — there is no photo upload, camera capture, or
 * file input anywhere in this flow, by design (PRD §9.4). The only free
 * text is the game nickname, with explicit "not your real name" guidance
 * (§6.5 rule); the parent gates progress on it being non-blank.
 */
import React from 'react';
import {
  ACCESSORIES,
  BASE_LOOKS,
  HAIR_STYLES,
  MAX_ACCESSORIES,
  NICKNAME_MAX_LENGTH,
  OUTFITS,
  SKIN_TONES,
  type Accessory,
  type PlayerAvatarConfig,
} from './avatarConfig';
import { PlayerAvatar } from './PlayerAvatar';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';

function Pill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'px-4 py-2 rounded-full font-bold text-sm border-2 transition-colors touch-manipulation',
        selected
          ? 'bg-orange-500 text-white border-orange-500'
          : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300',
      )}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{children}</p>
  );
}

export function AvatarBuilder({
  value,
  onChange,
}: {
  value: PlayerAvatarConfig;
  onChange: (config: PlayerAvatarConfig) => void;
}) {
  const t = useStrings();
  const patch = (p: Partial<PlayerAvatarConfig>) => onChange({ ...value, ...p });

  const toggleAccessory = (a: Accessory) => {
    if (value.accessories.includes(a)) {
      patch({ accessories: value.accessories.filter((x) => x !== a) });
    } else if (value.accessories.length < MAX_ACCESSORIES) {
      patch({ accessories: [...value.accessories, a] });
    }
  };

  return (
    <div>
      {/* Live preview */}
      <div className="flex justify-center mb-5">
        <div className="bg-sky-50 border border-sky-100 rounded-2xl px-6 pt-4">
          <PlayerAvatar config={value} size={104} />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <SectionLabel>{t.baseLookLabel}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {BASE_LOOKS.map((b, i) => (
              <Pill key={b} selected={value.base === b} onClick={() => patch({ base: b })}>
                {t.baseLookNames[i]}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>{t.skinToneLabel}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {SKIN_TONES.map((tone, i) => (
              <button
                key={tone}
                type="button"
                onClick={() => patch({ skinTone: tone })}
                aria-pressed={value.skinTone === tone}
                aria-label={`${t.skinToneLabel} ${i + 1}`}
                className={cn(
                  'w-10 h-10 rounded-full border-4 transition-transform touch-manipulation',
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
          <SectionLabel>{t.hairLabel}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {HAIR_STYLES.map((h, i) => (
              <Pill key={h} selected={value.hair === h} onClick={() => patch({ hair: h })}>
                {t.hairStyleNames[i]}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>{t.outfitLabel}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {OUTFITS.map((o, i) => (
              <Pill key={o} selected={value.outfit === o} onClick={() => patch({ outfit: o })}>
                {t.outfitNames[i]}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>{t.accessoriesLabel}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {ACCESSORIES.map((a, i) => {
              const selected = value.accessories.includes(a);
              const full = !selected && value.accessories.length >= MAX_ACCESSORIES;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAccessory(a)}
                  aria-pressed={selected}
                  disabled={full}
                  className={cn(
                    'px-4 py-2 rounded-full font-bold text-sm border-2 transition-colors touch-manipulation',
                    selected
                      ? 'bg-green-600 text-white border-green-600'
                      : full
                        ? 'bg-slate-50 text-slate-300 border-slate-100'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-green-300',
                  )}
                >
                  {t.accessoryNames[i]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel>{t.pickNickname}</SectionLabel>
          <input
            type="text"
            value={value.nickname}
            onChange={(e) => patch({ nickname: e.target.value })}
            maxLength={NICKNAME_MAX_LENGTH}
            placeholder={t.nicknamePlaceholder}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:outline-none font-bold text-slate-700 bg-white"
          />
          <p className="mt-1.5 text-sm font-bold text-amber-600">{t.nicknameHint}</p>
        </div>
      </div>
    </div>
  );
}
