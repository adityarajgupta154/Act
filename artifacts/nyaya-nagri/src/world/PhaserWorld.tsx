/**
 * Nyaya Nagri — Phaser world mount (Task 25 visual engine migration).
 *
 * React wrapper that owns the Phaser.Game lifecycle. The game reads input
 * from the SAME joystick ref the HUD writes (JoystickContext is untouched)
 * and renders underneath the untouched HTML/CSS HUD overlay. Phaser.AUTO
 * picks WebGL where available and falls back to Canvas 2D elsewhere.
 */
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useJoystick } from '@/ui/JoystickContext';
import { WorldScene } from './phaser/WorldScene';
import territoryUrl from '@/assets/world/zone0-territory.png';
import monumentUrl from '@/assets/world/zone0-monument.png';

export function PhaserWorld() {
  const joystickRef = useJoystick();
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      backgroundColor: '#8cba51', // = GRASS_BASE (sampled from zone art edge)
      physics: { default: 'arcade' },
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.NO_CENTER },
      render: { antialias: true },
    });
    game.scene.add('world', WorldScene, true, {
      joystickRef,
      territoryUrl,
      monumentUrl,
    });
    return () => {
      game.destroy(true);
    };
  }, [joystickRef]);

  return <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />;
}
