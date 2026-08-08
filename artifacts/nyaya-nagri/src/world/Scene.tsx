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
      */}
      <Canvas
        shadows
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        camera={{ position: [0, 15, 20], fov: 45 }}
      >
        <color attach="background" args={['#e0f2fe']} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[20, 30, 20]} 
          castShadow 
          intensity={1.2}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        <Map />
        <Player />
      </Canvas>
    </KeyboardControls>
  );
}
