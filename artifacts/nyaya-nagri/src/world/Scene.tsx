import React from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { Player } from './Player';
import { Map } from './Map';

export function Scene() {
  return (
    <KeyboardControls
      map={[
        { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
        { name: 'back', keys: ['ArrowDown', 'KeyS'] },
        { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
        { name: 'right', keys: ['ArrowRight', 'KeyD'] },
        { name: 'interact', keys: ['KeyE'] },
      ]}
    >
      {/*
        Mid/low-end device budget (PRD v1.0 §7 non-functional requirement):
        clamp the render resolution to at most 1.5x CSS pixels so a 3x-DPR
        phone does not pay for ~4x the fragment work, and let R3F drop the
        resolution further (down to 0.5x) when frames get expensive.
        Shadow map stays at 1024 for the same reason — the wider frustum
        (±48 covers the redesigned scenery) trades crispness for coverage.
      */}
      <Canvas
        shadows
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        camera={{ position: [0, 15, 20], fov: 45 }}
      >
        {/* Bright daytime sky; fog melts the distant skyline into it. */}
        <color attach="background" args={['#7cc4f8']} />
        <fog attach="fog" args={['#cfe9ff', 70, 170]} />

        <ambientLight intensity={0.35} />
        <hemisphereLight args={['#bfe0ff', '#89c96a', 0.55]} />
        <directionalLight
          position={[24, 38, 14]}
          color="#fff3d9"
          castShadow
          intensity={1.3}
          shadow-camera-left={-48}
          shadow-camera-right={48}
          shadow-camera-top={48}
          shadow-camera-bottom={-48}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0005}
        />

        <Map />
        <Player />
      </Canvas>
    </KeyboardControls>
  );
}
