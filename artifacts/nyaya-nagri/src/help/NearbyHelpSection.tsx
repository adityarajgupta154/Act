import type { ReactNode } from 'react';
import {
  Baby,
  CheckCircle2,
  Crosshair,
  ExternalLink,
  Hospital,
  Loader2,
  MapPin,
  PhoneCall,
  Siren,
  Stethoscope,
} from 'lucide-react';
import { useStrings } from '@/i18n/strings';
import { useNearbyHelp, type MapsHelpCategory } from './useNearbyHelp';

/**
 * SECTION B of the Get Help Now hub — "Find Help Near Me".
 *
 * API-FREE rewrite (Aug 2026 places-removal task): no Places API, no
 * place cards, no invented data (task §5). Flow (task §13):
 * explicit Use My Location tap → browser geolocation → "Location found" →
 * three Google Maps search buttons (hospitals / medical care / child
 * care) plus an emergency search — each opens Google Maps externally in a
 * new tab, where Maps itself finds real places, ratings and directions.
 *
 * Every location failure renders its OWN message (task §2/§8): denied,
 * timeout, unavailable, unsupported. No API error states exist anymore.
 *
 * The Call 112 action appears in EVERY state — idle, loading, failures,
 * located — so emergency help never depends on geolocation or the
 * network. All state (including the temporary coordinates) dies with the
 * dialog unmount.
 */
export function NearbyHelpSection() {
  const t = useStrings();
  const help = useNearbyHelp();

  const call112 = (
    <a
      href="tel:112"
      aria-label={t.call112}
      className="flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600 touch-manipulation"
    >
      <PhoneCall className="h-4 w-4" aria-hidden />
      112
    </a>
  );

  /** Failure action row (task §8) — 112 stays reachable in every state. */
  const fallbackRow = (opts: { retry?: boolean }) => (
    <div className="mt-3 flex flex-wrap gap-2">
      {opts.retry && (
        <button
          type="button"
          onClick={help.allowLocation}
          className="rounded-xl border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 touch-manipulation"
        >
          {t.allowLocationAgain}
        </button>
      )}
      <a
        href={help.mapsSearchUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-xl border-2 border-sky-300 bg-white px-3 py-2.5 text-sm font-bold text-sky-700 transition-colors hover:bg-sky-50 touch-manipulation"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        {t.openMaps}
      </a>
      {call112}
    </div>
  );

  /** Location lookup progress — 112 stays reachable mid-lookup (a slow
   *  permission prompt must never hide emergency dialing). */
  const spinnerRow = (label: string) => (
    <>
      <div role="status" aria-live="polite" className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" aria-hidden />
        {label}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">{t.emergencyAssistNote}</span>
        {call112}
      </div>
    </>
  );

  const message = (text: ReactNode) => (
    <p role="status" className="mt-2 text-sm font-semibold text-slate-700">{text}</p>
  );

  /** One Google Maps search button (task §6/§10): a plain external link —
   *  Maps performs the real nearby search, no API key anywhere. */
  const mapsButton = (category: MapsHelpCategory, icon: ReactNode, label: string) => {
    const url = help.mapsCategoryUrl(category);
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 rounded-2xl border-2 border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800 shadow-sm transition-all hover:border-emerald-400 hover:bg-emerald-50 active:scale-[0.99] touch-manipulation"
      >
        <span className="grid h-8 w-8 shrink-0 place-content-center rounded-full bg-emerald-100 text-emerald-700">
          {icon}
        </span>
        {label}
        <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
      </a>
    );
  };

  return (
    <section aria-label={t.findHelpNearMe} className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
      <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-700">
        <MapPin className="h-4 w-4" aria-hidden />
        {t.findHelpNearMe}
      </span>

      {help.status === 'idle' && (
        <>
          <p className="mt-1 text-sm font-medium text-slate-600">{t.findHelpIntro}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={help.allowLocation}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-[0.99] touch-manipulation"
            >
              <Crosshair className="h-5 w-5" aria-hidden />
              {t.allowLocation}
            </button>
            <a
              href="tel:112"
              aria-label={t.call112}
              className="flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-red-600 active:scale-[0.99] touch-manipulation"
            >
              <PhoneCall className="h-5 w-5" aria-hidden />
              {t.call112}
            </a>
          </div>
          <p className="mt-2 text-xs font-medium text-emerald-700">{t.locationPrivacyNote}</p>
        </>
      )}

      {help.status === 'locating' && spinnerRow(t.findingLocation)}

      {help.status === 'located' && (
        <>
          <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-green-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {t.locationFound}
          </div>
          {message(t.locationReady)}
          <p className="mt-2 text-xs font-semibold text-slate-500">{t.chooseHelpType}</p>
          <div className="mt-2 flex flex-col gap-2">
            {mapsButton('hospitals', <Hospital className="h-[18px] w-[18px]" aria-hidden />, t.findHospitals)}
            {mapsButton('medical', <Stethoscope className="h-[18px] w-[18px]" aria-hidden />, t.findMedicalCare)}
            {mapsButton('childcare', <Baby className="h-[18px] w-[18px]" aria-hidden />, t.findChildCare)}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-emerald-100 pt-3">
            <a
              href={help.mapsCategoryUrl('emergency') ?? help.mapsSearchUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border-2 border-red-300 bg-white px-3 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 touch-manipulation"
            >
              <Siren className="h-4 w-4" aria-hidden />
              {t.emergencySearchLabel}
            </a>
            {call112}
          </div>
          <p className="mt-2 text-xs font-medium text-emerald-700">{t.locationPrivacyNote}</p>
        </>
      )}

      {(help.status === 'geo-denied' ||
        help.status === 'geo-timeout' ||
        help.status === 'geo-unavailable' ||
        help.status === 'geo-unsupported') && (
        <>
          {message(
            help.status === 'geo-denied'
              ? t.locationDenied
              : help.status === 'geo-timeout'
                ? t.locationTimeout
                : help.status === 'geo-unavailable'
                  ? t.locationUnavailable
                  : t.locationUnsupported,
          )}
          {help.status === 'geo-denied' && (
            <p className="mt-1 text-xs font-medium text-slate-500">{t.locationSettingsHint}</p>
          )}
          {fallbackRow({ retry: help.status !== 'geo-unsupported' })}
        </>
      )}
    </section>
  );
}
