/**
 * Entry flow: every app launch starts on the Home screen — a static
 * illustrated presentation layer (no 3D). "Enter Nyaya Nagri" dismisses it,
 * and the EXISTING logic decides what comes next exactly as before:
 * - new user      → HUD renders OnboardingFlow (language selection first)
 * - returning user → straight into the game world (no repeated onboarding)
 * The flag is deliberately session-local (not persisted): refresh lands on
 * Home again, while onboarding/progress state stays persisted as always.
 *
 * The world tree (Three.js Scene + HUD) is lazy-loaded on enter, so the
 * homepage bundle contains no Three.js (redesign brief §14).
 */
import React, { Suspense, useState } from 'react';
import { HomeScreen } from '@/home/HomeScreen';
import { JusticeCrest } from '@/ui/JusticeCrest';
import { useStrings } from '@/i18n/strings';

const WorldRoot = React.lazy(() => import('./WorldRoot'));

function WorldLoading() {
  const t = useStrings();
  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-3 bg-sky-100">
      <JusticeCrest className="w-16 motion-safe:animate-pulse" />
      <p className="font-display font-semibold text-slate-600">{t.homeLoading}</p>
    </div>
  );
}

export default function HomePage() {
  const [entered, setEntered] = useState(false);

  if (!entered) {
    return <HomeScreen onEnter={() => setEntered(true)} />;
  }

  return (
    <Suspense fallback={<WorldLoading />}>
      <WorldRoot />
    </Suspense>
  );
}
