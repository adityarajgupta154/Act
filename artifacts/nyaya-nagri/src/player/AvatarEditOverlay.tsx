/**
 * Nyaya Nagri — "Edit Avatar" overlay (Task 14, PRD §7.2 "editable later
 * from Settings"). Opened from the Settings panel via uiStore; edits a
 * draft copy and only saves to progressStore when the child taps Save.
 */
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { AvatarBuilder } from './AvatarBuilder';
import {
  createDefaultAvatar,
  FREE_ACCESSORIES,
  sanitizeAvatar,
  SHOP_ACCESSORIES,
  type CharacterType,
  type PlayerAvatarConfig,
} from './avatarConfig';
import { progressStore } from '@/data/progressStore';
import { useStrings } from '@/i18n/strings';
import { closeAvatarEdit, useUIStore } from '@/ui/uiStore';

export function AvatarEditOverlay() {
  const { avatarEditOpen } = useUIStore();
  const t = useStrings();
  const [drafts, setDrafts] = useState<Record<CharacterType, PlayerAvatarConfig> | null>(null);
  const [character, setCharacter] = useState<CharacterType>('boy');

  // (Re)seed the drafts from the saved config each time the overlay opens —
  // sanitized, so a malformed persisted config falls back to a fresh
  // default instead of crashing the renderer. The OTHER hero starts from
  // its default look (sharing the one game nickname), so the child can
  // switch characters here too and both drafts survive switching.
  useEffect(() => {
    if (avatarEditOpen) {
      const saved = sanitizeAvatar(progressStore.getState().avatar) ?? createDefaultAvatar();
      const other: CharacterType = saved.character === 'girl' ? 'boy' : 'girl';
      setDrafts({
        [saved.character]: saved,
        [other]: { ...createDefaultAvatar(other), nickname: saved.nickname },
      } as Record<CharacterType, PlayerAvatarConfig>);
      setCharacter(saved.character);
    }
  }, [avatarEditOpen]);

  useEffect(() => {
    if (!avatarEditOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAvatarEdit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [avatarEditOpen]);

  if (!avatarEditOpen || !drafts) return null;
  const draft = drafts[character];
  const setDraft = (config: PlayerAvatarConfig) =>
    setDrafts((d) => (d ? { ...d, [character]: config } : d));
  const selectCharacter = (c: CharacterType) => {
    if (c === character) return;
    // Keep both drafts; only the shared nickname travels across.
    setDrafts((d) => (d ? { ...d, [c]: { ...d[c], nickname: d[character].nickname } } : d));
    setCharacter(c);
  };

  // Task 16: offer the free starter set plus OWNED shop cosmetics only —
  // un-bought shop items never appear here (and the store's ownership
  // filter would drop them on save anyway).
  const owned = progressStore.getState().ownedAccessories;
  const accessoryOptions = [
    ...FREE_ACCESSORIES,
    ...SHOP_ACCESSORIES.filter((a) => owned.includes(a)),
  ];

  const canSave = draft.nickname.trim().length > 0;
  const save = () => {
    if (!canSave) return;
    progressStore.setAvatar({ ...draft, nickname: draft.nickname.trim() });
    closeAvatarEdit();
  };

  return (
    <div className="absolute inset-0 z-30 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display font-bold text-2xl text-slate-800">{t.editAvatar}</h2>
          <button
            onClick={closeAvatarEdit}
            aria-label={t.close}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AvatarBuilder
          value={draft}
          onChange={setDraft}
          onSelectCharacter={selectCharacter}
          drafts={drafts}
          accessoryOptions={accessoryOptions}
        />

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={closeAvatarEdit}
            className="px-6 py-3 rounded-full font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95 touch-manipulation"
          >
            {t.cancel}
          </button>
          <button
            onClick={save}
            disabled={!canSave}
            className="px-7 py-3 rounded-full font-bold text-lg text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-slate-200 disabled:text-slate-400 shadow-md transition-transform active:scale-95 touch-manipulation"
          >
            {t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
}
