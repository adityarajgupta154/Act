/**
 * State machine for "Find Help Near Me" (Get Help Now hub).
 *
 * API-FREE since Aug 2026 (places-removal task): the Google Places proxy
 * is GONE by explicit spec — no Places API, no Google Maps key, no
 * backend call of any kind. The hook does exactly one thing — obtain a
 * browser geolocation fix — and builds plain Google Maps deep links from
 * it. Google Maps itself performs the nearby search, ratings, phone
 * numbers and directions (task §3/§5: we never invent place data).
 *
 * Rules preserved from the original hub spec:
 *  - Location is requested ONLY from an explicit tap — never on mount,
 *    never polled, never watched.
 *  - Coordinates live in a ref for the current dialog session only and
 *    die with the unmount. Nothing touches localStorage — and nothing
 *    leaves the device: the fix goes only into the Maps URL the child
 *    opens (task §2: no unnecessary backend ever sees it).
 *  - Newest-wins epoch: a stale geolocation callback from a previous
 *    attempt can never overwrite fresher state; duplicate taps harmless.
 *    Unmount invalidates the epoch too, so a callback that resolves
 *    after the dialog closes touches nothing.
 *  - Every geolocation failure is distinct (task §2): denied, timeout,
 *    position-unavailable, unsupported. There are no API failure states
 *    anymore — there is no API.
 *
 * DEV seam (same spirit as ?story=open): `?at=<lat>,<lng>` skips real
 * geolocation so the headless capture browser — which cannot answer a
 * permission prompt — can photograph the located state. Never in prod.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type NearbyHelpStatus =
  | 'idle'
  | 'locating'
  | 'located'
  | 'geo-denied'
  | 'geo-timeout'
  | 'geo-unavailable'
  | 'geo-unsupported';

/** The Google Maps searches the hub offers (task §3/§6). */
export type MapsHelpCategory = 'hospitals' | 'medical' | 'childcare' | 'emergency';

interface Fix {
  lat: number;
  lng: number;
}

/** Task-prescribed API-free query fragments (§3) — the coordinates are
 *  appended as `LAT,LNG`. These are ordinary Google Maps share URLs; the
 *  Maps app/site does the actual nearby lookup. NO key involved. */
const MAPS_QUERY: Record<MapsHelpCategory, string> = {
  hospitals: 'hospitals+near+',
  medical: 'medical+care+near+',
  childcare: 'children%27s+hospital+near+',
  emergency: 'emergency+hospital+near+',
};

/** Structured, dev-only diagnostics; coordinates appear rounded. */
function devLog(event: string, detail: Record<string, unknown>): void {
  if (import.meta.env?.DEV) console.warn('[nearby-help]', event, detail);
}

function devFix(): Fix | null {
  if (!import.meta.env?.DEV) return null;
  const raw = new URLSearchParams(window.location.search).get('at');
  if (!raw) return null;
  const [lat, lng] = raw.split(',').map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export function useNearbyHelp() {
  const [status, setStatus] = useState<NearbyHelpStatus>('idle');
  const fixRef = useRef<Fix | null>(null);
  const epochRef = useRef(0);

  /** Explicit tap → request permission → located / distinct failures.
   *  Also serves as "Allow Location Again" (task §8): when permission was
   *  already granted, getCurrentPosition resolves silently without
   *  re-prompting; when still denied, the browser fails fast again. */
  const allowLocation = useCallback(() => {
    const seeded = devFix();
    if (seeded) {
      fixRef.current = seeded;
      setStatus('located');
      return;
    }
    if (!('geolocation' in navigator)) {
      devLog('geolocation unsupported', {});
      setStatus('geo-unsupported');
      return;
    }
    const epoch = ++epochRef.current;
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (epoch !== epochRef.current) return;
        const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        fixRef.current = fix;
        devLog('location granted', {
          lat: fix.lat.toFixed(4),
          lng: fix.lng.toFixed(4),
          accuracyM: Math.round(pos.coords.accuracy),
        });
        setStatus('located');
      },
      (err) => {
        if (epoch !== epochRef.current) return;
        const next =
          err.code === err.PERMISSION_DENIED
            ? 'geo-denied'
            : err.code === err.TIMEOUT
              ? 'geo-timeout'
              : 'geo-unavailable';
        devLog('geolocation failed', { geoErrorCode: err.code, mapped: next });
        setStatus(next);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  /** DEV seam part 2: with ?at=<lat,lng> present, land in the located
   *  state on mount — the capture browser cannot click. Compiled OUT of
   *  prod builds (import.meta.env.DEV inside devFix). */
  useEffect(() => {
    if (devFix()) allowLocation();
    /** Unmount: invalidate the epoch so a geolocation callback that
     *  resolves after the dialog closes can never touch ref or state. */
    return () => {
      epochRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only seam
  }, []);

  /** Category search link (task §3) — null until a fix exists. 4-decimal
   *  coordinates (~11 m) are plenty for a "near me" search. */
  const mapsCategoryUrl = useCallback((category: MapsHelpCategory): string | null => {
    const fix = fixRef.current;
    if (!fix) return null;
    return `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY[category]}${fix.lat.toFixed(4)},${fix.lng.toFixed(4)}`;
  }, []);

  /** Generic Maps fallback — meaningful even WITHOUT a fix (denied /
   *  unavailable states, task §8): Maps then uses its own location. */
  const mapsSearchUrl = useCallback(
    () =>
      mapsCategoryUrl('hospitals') ??
      'https://www.google.com/maps/search/?api=1&query=hospitals+near+me',
    [mapsCategoryUrl],
  );

  return { status, allowLocation, mapsCategoryUrl, mapsSearchUrl };
}
