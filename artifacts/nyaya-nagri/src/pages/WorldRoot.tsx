/**
 * Nyaya Nagri — the full game experience tree (3D world + HUD/onboarding).
 * Split out of HomePage so the Three.js bundle is LAZY-LOADED only after
 * the child enters from the Home screen (redesign brief §14) — the landing
 * page itself ships no 3D code.
 */
import React from 'react';
import { Scene } from '@/world/Scene';
import { HUD } from '@/ui/HUD';
import { JoystickProvider } from '@/ui/JoystickContext';

export default function WorldRoot() {
  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden bg-sky-100 touch-none">
      <JoystickProvider>
        {/* 3D World Layer */}
        <div className="absolute inset-0 z-0">
          <Scene />
        </div>

        {/* UI Overlay Layer */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <HUD />
        </div>
      </JoystickProvider>
    </div>
  );
}
