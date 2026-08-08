/**
 * Nyaya Nagri — "Edit Avatar" overlay (Task 14, PRD §7.2 "editable later
 * from Settings"). Opened from the Settings panel via uiStore; edits a
 * draft copy and only saves to progressStore when the child taps Save.
 */
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { AvatarBuilder } from './AvatarBuilder';
import { createDefaultAvatar, sanitizeAvatar, type PlayerAvatarConfig } from './avatarConfig';
import { progressStore } from '@/data/progressStore';
import { useStrings } from '@/i18n/strings';
import { closeAvatarEdit, useUIStore } from '@/ui/uiStore';

export function AvatarEditOverlay() {
  const { avatarEditOpen } = useUIStore();
  const t = useStrings();
  const [draft, setDraft] = useState<PlayerAvatarConfig | null>(null);

  // (Re)seed the draft from the saved config each time the overlay opens —
  // sanitized, so a malformed persisted config falls back to a fresh
  // default instead of crashing the renderer.
  useEffect(() => {
    if (avatarEditOpen) {
      setDraft(sanitizeAvatar(progressStore.getState().avatar) ?? createDefaultAvatar());
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

  if (!avatarEditOpen || !draft) return null;

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

        <AvatarBuilder value={draft} onChange={setDraft} />

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
