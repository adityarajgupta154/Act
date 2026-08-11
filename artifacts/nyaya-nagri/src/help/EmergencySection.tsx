import { useState } from 'react';
import { PhoneCall, Siren } from 'lucide-react';
import { useStrings } from '@/i18n/strings';

/**
 * SECTION A of the Get Help Now hub — the real-emergency block.
 *
 * 112 is India's unified emergency number; the button is a real tel: link
 * that must NEVER depend on location, the Places API, or the network
 * (hub spec §15). A single ultra-short confirm step ("Is this a real
 * emergency?") guards against accidental child taps (spec §35) — two taps
 * total, nothing slower. The armed state dies with the dialog unmount, so
 * a reopened hub always starts disarmed.
 */
export function EmergencySection() {
  const t = useStrings();
  const [armed, setArmed] = useState(false);

  return (
    <section
      aria-label={t.realEmergency}
      className="rounded-2xl border border-red-200 bg-red-50 p-4"
    >
      <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-red-600">
        <Siren className="h-4 w-4" aria-hidden />
        {t.realEmergency}
      </span>
      <p className="mt-1 text-sm font-medium text-slate-700">{t.emergencyQuestion}</p>

      {!armed ? (
        <button
          type="button"
          onClick={() => setArmed(true)}
          aria-label={t.call112}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl border-2 border-red-300 bg-white p-3 shadow-sm transition-all hover:border-red-500 active:scale-[0.99] touch-manipulation"
        >
          <span className="shrink-0 rounded-full bg-red-500 p-3">
            <PhoneCall className="h-6 w-6 text-white" aria-hidden />
          </span>
          <span className="font-display text-3xl font-bold text-slate-800 md:text-4xl">112</span>
          <span className="ml-auto text-right text-sm font-bold text-red-600">{t.call112}</span>
        </button>
      ) : (
        <div
          role="group"
          aria-label={t.isThisEmergency}
          className="mt-3 rounded-2xl border-2 border-red-300 bg-white p-3 animate-in fade-in zoom-in-95 duration-150"
        >
          <p className="text-base font-bold text-slate-800">{t.isThisEmergency}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setArmed(false)}
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 touch-manipulation"
            >
              {t.cancel}
            </button>
            <a
              href="tel:112"
              className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-red-500 px-3 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-red-600 active:scale-[0.98] touch-manipulation"
            >
              <PhoneCall className="h-4 w-4" aria-hidden />
              {t.yesCall112}
            </a>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs font-medium text-slate-500">{t.emergencySafetyNote}</p>
    </section>
  );
}
