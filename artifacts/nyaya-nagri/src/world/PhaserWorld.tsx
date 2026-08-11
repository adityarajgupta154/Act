/**
 * Nyaya Nagri — Phaser world mount.
 *
 * React wrapper that owns the Phaser.Game lifecycle. The game reads input
 * from the SAME joystick ref the HUD writes (JoystickContext is untouched)
 * and renders underneath the untouched HTML/CSS HUD overlay. Phaser.AUTO
 * picks WebGL where available and falls back to Canvas 2D elsewhere.
 *
 * Reference-art rebuild (Aug 2026): all world art is cut from the child's
 * own reference painting — Vite resolves the URLs here and the scene
 * preloads them by key.
 */
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useJoystick } from '@/ui/JoystickContext';
import { WorldScene } from './phaser/WorldScene';
import grassPlateUrl from '@/assets/world/village-grass.png';
import plazaDiscUrl from '@/assets/world/plaza-disc.png';
import pathTileUrl from '@/assets/world/path-tile.png';
import monumentPedestalUrl from '@/assets/world/monument-pedestal.png';
import monumentCottageUrl from '@/assets/world/monument-cottage.png';
import monumentChildhoodUrl from '@/assets/world/monument-childhood.png';
import monumentWellUrl from '@/assets/world/monument-well.png';
import monumentObeliskUrl from '@/assets/world/monument-obelisk.png';
import monumentKindnessUrl from '@/assets/world/monument-kindness.png';
import monumentShieldUrl from '@/assets/world/monument-shield.png';
import decorHouseUrl from '@/assets/world/decor-house.png';
import decorTreeAUrl from '@/assets/world/decor-tree-a.png';
import decorTreeBUrl from '@/assets/world/decor-tree-b.png';
import decorFlowersAUrl from '@/assets/world/decor-flowers-a.png';
import decorFlowersBUrl from '@/assets/world/decor-flowers-b.png';
import riverCornerUrl from '@/assets/world/river-corner.png';
import decorRocksUrl from '@/assets/world/decor-rocks.png';
import decorLogUrl from '@/assets/world/decor-log.png';
import decorMushroomUrl from '@/assets/world/decor-mushroom.png';
import decorFenceUrl from '@/assets/world/decor-fence.png';

export function PhaserWorld() {
  const joystickRef = useJoystick();
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      backgroundColor: '#87ae2d', // = GRASS_BASE (village plate edge tone)
      physics: { default: 'arcade' },
      // The world plays zero Phaser audio (story narration + live voice run on
      // their own audio pipelines outside Phaser). Without noAudio, Phaser
      // spins up a WebAudio context that gets closed on every dev-HMR remount,
      // after which its visibility suspend/resume handlers reject with
      // "Cannot suspend/resume a closed AudioContext" (red overlay in dev).
      // disableWebAudio is cosmetic-only here: Phaser's banner checks it (not
      // noAudio) for its "Web Audio" label, so this makes the banner honest.
      audio: { noAudio: true, disableWebAudio: true },
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.NO_CENTER },
      render: { antialias: true },
    });
    game.scene.add('world', WorldScene, true, {
      joystickRef,
      assets: {
        'village-grass': grassPlateUrl,
        'plaza-disc': plazaDiscUrl,
        'path-tile': pathTileUrl,
        'monument-pedestal': monumentPedestalUrl,
        'monument-cottage': monumentCottageUrl,
        'monument-childhood': monumentChildhoodUrl,
        'monument-well': monumentWellUrl,
        'monument-obelisk': monumentObeliskUrl,
        'monument-kindness': monumentKindnessUrl,
        'monument-shield': monumentShieldUrl,
        'decor-house': decorHouseUrl,
        'decor-tree-a': decorTreeAUrl,
        'decor-tree-b': decorTreeBUrl,
        'decor-flowers-a': decorFlowersAUrl,
        'decor-flowers-b': decorFlowersBUrl,
        'river-corner': riverCornerUrl,
        'decor-rocks': decorRocksUrl,
        'decor-log': decorLogUrl,
        'decor-mushroom': decorMushroomUrl,
        'decor-fence': decorFenceUrl,
      },
    });
    return () => {
      game.destroy(true);
    };
  }, [joystickRef]);

  return <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />;
}
