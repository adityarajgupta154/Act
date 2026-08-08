import { createRoot } from 'react-dom/client';

import App from './App';
import { seedDemoProgress } from './data/demoSeed';

import './index.css';

// Dev-only: `?demoProgress` seeds sample data so the progress dashboard can
// be inspected without playing through quests. Never active in production.
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('demoProgress')) {
  seedDemoProgress();
}

createRoot(document.getElementById('root')!).render(<App />);
