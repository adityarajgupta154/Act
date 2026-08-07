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
      <Canvas shadows camera={{ position: [0, 15, 20], fov: 45 }}>
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
