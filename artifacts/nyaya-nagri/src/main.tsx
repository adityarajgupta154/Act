import { createRoot } from 'react-dom/client';

import App from './App';
import { seedDemoProgress } from './data/demoSeed';

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

// Dev-only: `?demoProgress` seeds sample data so the progress dashboard can
// be inspected without playing through quests. Never active in production.
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('demoProgress')) {
  seedDemoProgress();
}

createRoot(document.getElementById('root')!).render(<App />);
