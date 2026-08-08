import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ZONES, getZoneStates } from './zones';
import { progressStore } from '@/data/progressStore';
import * as THREE from 'three';

// Hook to get zone states without spamming renders
function useZoneStatesLive() {
  const [states, setStates] = React.useState(getZoneStates());
  React.useEffect(() => {
    return progressStore.subscribe(() => {
      setStates(getZoneStates());
    });
  }, []);
  return states;
}

const getColor = (baseColor: string, unlocked: boolean) => unlocked ? baseColor : "#94a3b8";

function LockIcon({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[1, 0.8, 0.4]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <torusGeometry args={[0.3, 0.1, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
    </group>
  );
}

function ActiveRing({ unlocked }: { unlocked: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ringRef.current && unlocked) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.5;
      const scale = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.1;
      ringRef.current.scale.set(scale, scale, scale);
    }
  });
  if (!unlocked) return null;
  return (
    <mesh ref={ringRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[3.5, 4.5, 32]} />
      <meshBasicMaterial color="#fcd34d" transparent opacity={0.6} />
    </mesh>
  );
}

function MarkerZone0({ position, unlocked }: { position: [number, number]; unlocked: boolean }) {
  // Open book (the Constitution) on a pedestal — the city's foundation stone.
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.4, 1.8, 2, 16]} />
        <meshStandardMaterial color={getColor("#c4b5fd", unlocked)} />
      </mesh>
      <mesh position={[0, 2.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.5, 2.4]} />
        <meshStandardMaterial color={getColor("#7c3aed", unlocked)} />
      </mesh>
      <mesh position={[-1.05, 2.7, 0]} rotation={[0, 0, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.22, 2.4]} />
        <meshStandardMaterial color={getColor("#fdf2f8", unlocked)} />
      </mesh>
      <mesh position={[1.05, 2.7, 0]} rotation={[0, 0, -0.3]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.22, 2.4]} />
        <meshStandardMaterial color={getColor("#fdf2f8", unlocked)} />
      </mesh>
      <ActiveRing unlocked={unlocked} />
      {!unlocked && <LockIcon position={[0, 6, 0]} />}
    </group>
  );
}

function MarkerZone1({ position, unlocked }: { position: [number, number]; unlocked: boolean }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 4, 5]} />
        <meshStandardMaterial color={getColor("#fef3c7", unlocked)} />
      </mesh>
      <mesh position={[0, 5.5, 0]} castShadow receiveShadow rotation={[0, Math.PI/4, 0]}>
        <coneGeometry args={[4.5, 3, 4]} />
        <meshStandardMaterial color={getColor("#f59e0b", unlocked)} />
      </mesh>
      <ActiveRing unlocked={unlocked} />
      {!unlocked && <LockIcon position={[0, 9, 0]} />}
    </group>
  );
}

function MarkerZone2({ position, unlocked }: { position: [number, number]; unlocked: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime();
      meshRef.current.position.y = 4 + Math.sin(clock.getElapsedTime() * 2) * 0.5;
    }
  });
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <octahedronGeometry args={[3]} />
        <meshStandardMaterial color={getColor("#38bdf8", unlocked)} flatShading />
      </mesh>
      <ActiveRing unlocked={unlocked} />
      {!unlocked && <LockIcon position={[0, 8, 0]} />}
    </group>
  );
}

function MarkerZone3({ position, unlocked }: { position: [number, number]; unlocked: boolean }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 6, 6]} />
        <meshStandardMaterial color={getColor("#fbbf24", unlocked)} />
      </mesh>
      <mesh position={[0, 7, 0]} castShadow receiveShadow>
        <coneGeometry args={[1, 2, 6]} />
        <meshStandardMaterial color={getColor("#fef3c7", unlocked)} />
      </mesh>
      <mesh position={[0, 7.8, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.3, 0.6, 6]} />
        <meshStandardMaterial color={getColor("#334155", unlocked)} />
      </mesh>
      <ActiveRing unlocked={unlocked} />
      {!unlocked && <LockIcon position={[0, 10, 0]} />}
    </group>
  );
}

function MarkerZone4({ position, unlocked }: { position: [number, number]; unlocked: boolean }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 2, 5]} />
        <meshStandardMaterial color={getColor("#e2e8f0", unlocked)} />
      </mesh>
      <mesh position={[0, 5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 6, 16]} />
        <meshStandardMaterial color={getColor("#f8fafc", unlocked)} />
      </mesh>
      <mesh position={[0, 8.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.5, 1, 4.5]} />
        <meshStandardMaterial color={getColor("#e2e8f0", unlocked)} />
      </mesh>
      <ActiveRing unlocked={unlocked} />
      {!unlocked && <LockIcon position={[0, 11, 0]} />}
    </group>
  );
}

function MarkerZone5({ position, unlocked }: { position: [number, number]; unlocked: boolean }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 2, 3]} />
        <meshStandardMaterial color={getColor("#94a3b8", unlocked)} />
      </mesh>
      <mesh position={[0, 5.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 5, 2]} />
        <meshStandardMaterial color={getColor("#cbd5e1", unlocked)} />
      </mesh>
      <mesh position={[0, 5.5, 1.05]} castShadow receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color={getColor("#38bdf8", unlocked)} />
      </mesh>
      <ActiveRing unlocked={unlocked} />
      {!unlocked && <LockIcon position={[0, 10, 0]} />}
    </group>
  );
}

// Zone 6 — Family & Community Shield: a large shield with a heart at its
// centre on a warm pedestal (family safety = protection wrapped around care).
function MarkerZone6({ position, unlocked }: { position: [number, number]; unlocked: boolean }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.2, 2.6, 1.2, 24]} />
        <meshStandardMaterial color={getColor("#99f6e4", unlocked)} />
      </mesh>
      {/* Shield body; the rotated cube below reads as the shield's point */}
      <mesh position={[0, 3.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 2.6, 0.5]} />
        <meshStandardMaterial color={getColor("#0d9488", unlocked)} />
      </mesh>
      <mesh position={[0, 1.9, 0]} rotation={[0, 0, Math.PI / 4]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 2.0, 0.5]} />
        <meshStandardMaterial color={getColor("#0d9488", unlocked)} />
      </mesh>
      <mesh position={[0, 4.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 0.4, 0.55]} />
        <meshStandardMaterial color={getColor("#f0fdfa", unlocked)} />
      </mesh>
      {/* Heart at the shield's centre: two spheres + one rotated cube */}
      <mesh position={[-0.34, 3.55, 0.3]} castShadow>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshStandardMaterial color={getColor("#fb7185", unlocked)} />
      </mesh>
      <mesh position={[0.34, 3.55, 0.3]} castShadow>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshStandardMaterial color={getColor("#fb7185", unlocked)} />
      </mesh>
      <mesh position={[0, 3.1, 0.3]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[0.62, 0.62, 0.5]} />
        <meshStandardMaterial color={getColor("#fb7185", unlocked)} />
      </mesh>
      <ActiveRing unlocked={unlocked} />
      {!unlocked && <LockIcon position={[0, 8, 0]} />}
    </group>
  );
}

export function Map() {
  const states = useZoneStatesLive();

  return (
    <group>
      {/* Main Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#bbf7d0" /> 
      </mesh>
      
      {/* Zone Markers */}
      {states.map((zone) => {
        const props = { position: zone.position, unlocked: zone.unlocked };
        switch (zone.id) {
          case 'zone0': return <MarkerZone0 key={zone.id} {...props} />;
          case 'zone1': return <MarkerZone1 key={zone.id} {...props} />;
          case 'zone2': return <MarkerZone2 key={zone.id} {...props} />;
          case 'zone3': return <MarkerZone3 key={zone.id} {...props} />;
          case 'zone4': return <MarkerZone4 key={zone.id} {...props} />;
          case 'zone5': return <MarkerZone5 key={zone.id} {...props} />;
          case 'zone6': return <MarkerZone6 key={zone.id} {...props} />;
          default: return null;
        }
      })}
      
      {/* Scattered rocks and hills from foundation */}
      <mesh position={[10, 0, -15]} receiveShadow castShadow>
        <cylinderGeometry args={[4, 8, 2, 16]} />
        <meshStandardMaterial color="#86efac" />
      </mesh>

      <group position={[5, 0, -10]}>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.5, 0.6, 3]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[0, 4, 0]} castShadow receiveShadow>
          <icosahedronGeometry args={[2.5, 1]} />
          <meshStandardMaterial color="#22c55e" flatShading />
        </mesh>
      </group>

      <mesh position={[-8, 0.5, -15]} castShadow receiveShadow rotation={[Math.PI/4, Math.PI/3, 0]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#94a3b8" flatShading />
      </mesh>
    </group>
  );
}
