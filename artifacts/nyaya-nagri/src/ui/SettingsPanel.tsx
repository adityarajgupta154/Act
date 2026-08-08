/**
 * Nyaya Nagri — Settings panel (Task 10, PRD §6.4)
 *
 * Language (English/Hindi), audio narration, dyslexia-friendly font, high
 * contrast, and text size. All settings persist on this device only (no
 * PII). Rendered as an overlay wired to the HUD settings button.
 */
import React, { useEffect } from 'react';
import { X, Languages, Volume2, Type, Contrast, ALargeSmall, Music, UserRound } from 'lucide-react';
import { useUIStore, closeSettings, openAvatarEdit } from './uiStore';
import { useSettings, settingsStore, type TextSize, type Language } from '@/data/settingsStore';
import { useStrings } from '@/i18n/strings';
import { narrationSupported, speak, stopSpeaking } from '@/a11y/narrator';
import { cn } from '@/lib/utils';

function ToggleRow({
  icon,
  label,
  hint,
  checked,
  onChange,
  onLabel,
  offLabel,
  disabled,
  disabledHint,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  onLabel: string;
  offLabel: string;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-b-0">
      <div className="flex items-start gap-3 min-w-0">
        <div className="bg-amber-100 text-amber-600 p-2 rounded-xl shrink-0 mt-0.5">{icon}</div>
        <div className="min-w-0">
          <p className="font-bold text-slate-800">{label}</p>
          <p className="text-sm text-slate-500 font-medium">
            {disabled && disabledHint ? disabledHint : hint}
          </p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'shrink-0 px-4 py-2 rounded-full font-bold text-sm border-2 transition-colors touch-manipulation',
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : checked
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300',
        )}
      >
        {checked ? onLabel : offLabel}
      </button>
    </div>
  );
}

export function SettingsPanel() {
  const { settingsOpen } = useUIStore();
  const settings = useSettings();
  const t = useStrings();
  const speechOk = narrationSupported();

  // Baseline keyboard support: Escape closes the panel.
  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettings();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen]);

  if (!settingsOpen) return null;

  const setLanguage = (language: Language) => {
    settingsStore.update({ language });
    stopSpeaking();
  };

  const setNarration = (narration: boolean) => {
    settingsStore.update({ narration });
    if (narration) {
      // Short spoken confirmation so a non-reader knows it worked.
      speak(getConfirmation(settingsStore.getState().language), settingsStore.getState().language);
    } else {
      stopSpeaking();
    }
  };

  const sizes: Array<{ value: TextSize; label: string }> = [
    { value: 'small', label: t.textSizeSmall },
    { value: 'medium', label: t.textSizeMedium },
    { value: 'large', label: t.textSizeLarge },
  ];

  return (
    <div
      className="absolute inset-0 z-30 pointer-events-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={t.settingsTitle}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display font-bold text-2xl text-slate-800">{t.settingsTitle}</h2>
          <button
            onClick={closeSettings}
            className="p-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors touch-manipulation"
            aria-label={t.close}
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Language */}
        <div className="py-3 border-b border-slate-100">
          <div className="flex items-start gap-3 mb-3">
            <div className="bg-amber-100 text-amber-600 p-2 rounded-xl shrink-0">
              <Languages className="w-5 h-5" />
            </div>
            <p className="font-bold text-slate-800 mt-1.5">{t.languageLabel}</p>
          </div>
          <div className="flex gap-2 pl-12">
            <button
              onClick={() => setLanguage('en')}
              aria-pressed={settings.language === 'en'}
              className={cn(
                'px-5 py-2.5 rounded-full font-bold border-2 transition-colors touch-manipulation',
                settings.language === 'en'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300',
              )}
              lang="en"
            >
              {t.languageEnglish}
            </button>
            <button
              onClick={() => setLanguage('hi')}
              aria-pressed={settings.language === 'hi'}
              className={cn(
                'px-5 py-2.5 rounded-full font-bold border-2 transition-colors touch-manipulation',
                settings.language === 'hi'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300',
              )}
              lang="hi"
            >
              {t.languageHindi}
            </button>
          </div>
        </div>

        {/* Narration */}
        <ToggleRow
          icon={<Volume2 className="w-5 h-5" />}
          label={t.narrationLabel}
          hint={t.narrationHint}
          checked={settings.narration && speechOk}
          onChange={setNarration}
          onLabel={t.on}
          offLabel={t.off}
          disabled={!speechOk}
          disabledHint={t.narrationUnsupported}
        />

        {/* Ambient background music (Task 13) */}
        <ToggleRow
          icon={<Music className="w-5 h-5" />}
          label={t.ambientLabel}
          hint={t.ambientHint}
          checked={settings.ambientSound}
          onChange={(v) => settingsStore.update({ ambientSound: v })}
          onLabel={t.on}
          offLabel={t.off}
        />

        {/* Dyslexia-friendly font */}
        <ToggleRow
          icon={<Type className="w-5 h-5" />}
          label={t.dyslexiaLabel}
          hint={t.dyslexiaHint}
          checked={settings.dyslexiaFont}
          onChange={(v) => settingsStore.update({ dyslexiaFont: v })}
          onLabel={t.on}
          offLabel={t.off}
        />

        {/* High contrast */}
        <ToggleRow
          icon={<Contrast className="w-5 h-5" />}
          label={t.contrastLabel}
          hint={t.contrastHint}
          checked={settings.highContrast}
          onChange={(v) => settingsStore.update({ highContrast: v })}
          onLabel={t.on}
          offLabel={t.off}
        />

        {/* Text size */}
        <div className="py-3">
          <div className="flex items-start gap-3 mb-3">
            <div className="bg-amber-100 text-amber-600 p-2 rounded-xl shrink-0">
              <ALargeSmall className="w-5 h-5" />
            </div>
            <p className="font-bold text-slate-800 mt-1.5">{t.textSizeLabel}</p>
          </div>
          <div className="flex gap-2 pl-12" role="group" aria-label={t.textSizeLabel}>
            {sizes.map((s) => (
              <button
                key={s.value}
                onClick={() => settingsStore.update({ textSize: s.value })}
                aria-pressed={settings.textSize === s.value}
                className={cn(
                  'px-4 py-2.5 rounded-full font-bold border-2 transition-colors touch-manipulation',
                  settings.textSize === s.value
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Edit Avatar (Task 14, PRD §7.2 "editable later from Settings") */}
        <button
          onClick={openAvatarEdit}
          className="mt-6 w-full bg-white border-2 border-sky-200 text-sky-600 hover:bg-sky-50 px-8 py-3.5 rounded-full font-bold text-lg transition-colors active:scale-95 shadow-sm touch-manipulation flex items-center justify-center gap-2"
        >
          <UserRound className="w-5 h-5" />
          {t.editAvatar}
        </button>

        <button
          onClick={closeSettings}
          className="mt-4 w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-md touch-manipulation"
        >
          {t.done}
        </button>
      </div>
    </div>
  );
}

/** Hard-coded narration-on confirmations (never AI-generated). */
function getConfirmation(language: Language): string {
  return language === 'hi'
    ? 'आवाज़ में सुनाना चालू हो गया।'
    : 'Audio narration is on.';
}
