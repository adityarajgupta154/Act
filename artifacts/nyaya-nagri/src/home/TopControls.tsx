/**
 * Nyaya Nagri — Home top-right pill controls: About / Accessibility / Settings.
 * Accessibility + Settings both open the EXISTING SettingsPanel (accessibility
 * controls live inside Settings — no duplicate systems, redesign brief §7).
 */
import React from 'react';
import { Accessibility, Info, Settings as SettingsIcon } from 'lucide-react';
import { useStrings } from '@/i18n/strings';
import { openSettings } from '@/ui/uiStore';

function TopControl({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-2 md:px-4 text-sm font-bold text-slate-700 ring-1 ring-white/70 shadow-md backdrop-blur transition-colors hover:bg-white active:scale-95 touch-manipulation"
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function TopControls({ onAbout }: { onAbout: () => void }) {
  const t = useStrings();

  return (
    <nav className="absolute right-3 top-3 z-20 flex gap-2 md:right-5 md:top-5" aria-label={t.settings}>
      <TopControl label={t.homeAbout} onClick={onAbout}>
        <Info className="h-4 w-4 text-blue-700" />
      </TopControl>
      <TopControl label={t.homeAccessibility} onClick={openSettings}>
        <Accessibility className="h-4 w-4 text-blue-700" />
      </TopControl>
      <TopControl label={t.settings} onClick={openSettings}>
        <SettingsIcon className="h-4 w-4 text-blue-700" />
      </TopControl>
    </nav>
  );
}
