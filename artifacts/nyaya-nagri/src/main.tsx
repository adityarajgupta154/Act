import { createRoot } from 'react-dom/client';

import App from './App';
import { seedDemoProgress } from './data/demoSeed';
import { progressStore } from './data/progressStore';

import './index.css';
// Dyslexia-friendly font (Task 10): bundled locally so the easy-reading
// mode works offline and adds no third-party request.
import '@fontsource/lexend/400.css';
import '@fontsource/lexend/500.css';
import '@fontsource/lexend/600.css';
import '@fontsource/lexend/700.css';
// Importing the settings store applies persisted language/accessibility
// attributes to <html> before first render.
import '@/data/settingsStore';
import { initAmbientAudio } from '@/audio/ambient';
import { openHelp, enterZone } from './ui/uiStore';
import { ZONES } from './world/zones';

// Calm, mutable ambient loop (Task 13) — starts after the first user
// gesture (browser autoplay policy); toggled from Settings.
initAmbientAudio();

// Dev-only: `?demoProgress` seeds sample data so the progress dashboard can
// be inspected without playing through quests. Never active in production.
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('demoProgress')) {
  seedDemoProgress();
}

// Dev-only screenshot/e2e seam (same spirit as `?demoProgress`): `?map=open`
// boots an onboarded child with two zones complete — and HomePage skips the
// landing screen for the same param — so the headless capture browser, which
// cannot click, can photograph the Map modal with real completed / unlocked /
// locked node states. Never active in production builds.
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('map') === 'open') {
  progressStore.update({
    onboarded: true,
    ageBand: '12-15',
    completedZones: { zone0: true, zone1: true },
  });
}

// Dev-only screenshot/e2e seam (same spirit): `?story=open` boots an
// onboarded child so the Story Adventure surfaces — the overlay (own seam,
// `&level=<id>&slide=N&pick=correct|wrong`) or the level map
// (`&view=map[&celebrate=<id>]`) — can be photographed headlessly.
// `&done=<id,id>` pre-completes story levels so locked/completed map states
// and Level 2+ slides are reachable; the lock rule itself stays fail-closed.
// HomePage skips the landing screen for this param too. Never in production.
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('story') === 'open') {
  const doneIds = (new URLSearchParams(window.location.search).get('done') ?? '')
    .split(',')
    .filter(Boolean);
  const zoneIds = (new URLSearchParams(window.location.search).get('zones') ?? '')
    .split(',')
    .filter(Boolean);
  const watchedIds = (new URLSearchParams(window.location.search).get('watched') ?? '')
    .split(',')
    .filter(Boolean);
  progressStore.update({
    onboarded: true,
    ageBand: '12-15',
    storyProgress: Object.fromEntries(doneIds.map((id) => [id, true])),
    completedZones: Object.fromEntries(zoneIds.map((id) => [id, true])),
    videosWatched: Object.fromEntries(watchedIds.map((id) => [id, true])),
  });
}

// Dev-only screenshot/e2e seam (same spirit): `?help=open` boots an
// onboarded child with the Get Help Now hub already open. Combine with
// `&at=<lat>,<lng>` (read inside useNearbyHelp) to skip real geolocation
// and land in the located state, since the headless capture browser
// cannot answer a permission prompt. Never active in production builds.
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('help') === 'open') {
  progressStore.update({ onboarded: true, ageBand: '12-15' });
  openHelp();
}

// Dev-only screenshot/e2e seam (same spirit): `?profile=open` boots an
// onboarded child, and PlayerProfile.tsx boots its dropdown expanded, so
// the headless capture browser (which cannot click) can photograph the
// expanded profile panel over the map. Never active in production builds.
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('profile') === 'open') {
  progressStore.update({ onboarded: true, ageBand: '12-15' });
}

// Dev-only screenshot/e2e seam (same spirit): `?zone=<id>` boots an
// onboarded child straight INSIDE a zone interior — the headless capture
// browser cannot render WebGL, so it cannot walk the 3D world to a gate.
// Lets the video-first castle flow (VIDEO → quiz) be photographed.
// HomePage skips the landing screen for this param too. Never in production.
{
  const zoneSeam = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get('zone')
    : null;
  if (zoneSeam) {
    // enterZone validates the zone-unlock rule (seams cannot bypass locks),
    // so complete every zone BEFORE the target — same as a real playthrough.
    const before = ZONES.slice(
      0,
      Math.max(0, ZONES.findIndex((z) => z.id === zoneSeam)),
    );
    progressStore.update({
      onboarded: true,
      ageBand: '12-15',
      completedZones: Object.fromEntries(before.map((z) => [z.id, true])),
    });
    enterZone(zoneSeam);
  }
}

createRoot(document.getElementById('root')!).render(<App />);
