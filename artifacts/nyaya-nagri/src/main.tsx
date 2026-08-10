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

createRoot(document.getElementById('root')!).render(<App />);
