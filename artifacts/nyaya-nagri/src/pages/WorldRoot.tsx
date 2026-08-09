/**
 * Nyaya Nagri — the full game experience tree (2D world + HUD/onboarding).
 * Split out of HomePage so the game engine bundle is LAZY-LOADED only
 * after the child enters from the Home screen (redesign brief §14) — the
 * landing page itself ships no engine code. Task 25 swapped the world
 * layer from Three.js to the illustrated Phaser 2D world; the HUD overlay
 * and everything above it are untouched.
 */
import React from 'react';
import { PhaserWorld } from '@/world/PhaserWorld';
import { HUD } from '@/ui/HUD';
import { JoystickProvider } from '@/ui/JoystickContext';

export default function WorldRoot() {
  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden bg-sky-100 touch-none">
      <JoystickProvider>
        {/* 2D World Layer */}
        <div className="absolute inset-0 z-0">
          <PhaserWorld />
        </div>

        {/* UI Overlay Layer */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <HUD />
        </div>
      </JoystickProvider>
    </div>
  );
}
