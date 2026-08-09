/**
 * Nyaya Nagri — zone landmark markers (visual redesign, Aug 2026).
 *
 * Seven stone-monument landmarks in the reference's bright low-poly
 * language. STATE CONTRACT (unchanged from the original Map markers):
 *  - `unlocked` drives color desaturation via getColor/getColorSoft,
 *  - locked zones show the floating red padlock,
 *  - unlocked zones show the pulsing gold ActiveRing.
 * Interaction stays proximity-based in Player.tsx/HUD — markers carry no
 * handlers of their own. Emblems are language-neutral symbols (scales,
 * shield, book) instead of baked text so EN/HI parity is automatic.
 */
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* Locked monuments collapse to two grays so the silhouette stays readable
   while clearly reading as "not yet open" (single-gray flattened them). */
export const getColor = (baseColor: string, unlocked: boolean) =>
  unlocked ? baseColor : '#94a3b8';
export const getColorSoft = (baseColor: string, unlocked: boolean) =>
  unlocked ? baseColor : '#b6bdc7';

/* stone/gold palette shared by the monuments */
const STONE = '#b7bdc9';
const STONE_DARK = '#98a1b0';
const PEDESTAL = '#cfd4de';
const GOLD = '#f5b73c';
const NAVY = '#2f4f8f';

export function ActiveRing({ unlocked }: { unlocked: boolean }) {
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
      <meshBasicMaterial color="#fcd34d" transparent opacity={0.55} />
    </mesh>
  );
}

export function LockIcon({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const baseY = position[1];
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = baseY + Math.sin(clock.getElapsedTime() * 1.6) * 0.25;
    }
  });
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.0, 0.85, 0.4]} />
        <meshStandardMaterial color="#e23c3c" />
      </mesh>
      <mesh position={[0, 0, 0.21]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.06, 12]} />
        <meshStandardMaterial color={GOLD} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <torusGeometry args={[0.34, 0.1, 10, 20, Math.PI]} />
        <meshStandardMaterial color="#cfd6df" />
      </mesh>
    </group>
  );
}

/** Gold scales-of-justice emblem on a navy disc (fronts monuments). */
function ScalesEmblem({
  y,
  z,
  unlocked,
  scale = 1,
}: {
  y: number;
  z: number;
  unlocked: boolean;
  scale?: number;
}) {
  return (
    <group position={[0, y, z]} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.08, 20]} />
        <meshStandardMaterial color={getColorSoft(NAVY, unlocked)} />
      </mesh>
      <mesh position={[0, 0.05, 0.06]}>
        <boxGeometry args={[0.06, 0.62, 0.05]} />
        <meshStandardMaterial color={getColorSoft(GOLD, unlocked)} />
      </mesh>
      <mesh position={[0, 0.28, 0.06]}>
        <boxGeometry args={[0.78, 0.06, 0.05]} />
        <meshStandardMaterial color={getColorSoft(GOLD, unlocked)} />
      </mesh>
      <mesh position={[-0.36, 0.1, 0.06]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.16, 0.14, 12]} />
        <meshStandardMaterial color={getColorSoft(GOLD, unlocked)} />
      </mesh>
      <mesh position={[0.36, 0.1, 0.06]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.16, 0.14, 12]} />
        <meshStandardMaterial color={getColorSoft(GOLD, unlocked)} />
      </mesh>
    </group>
  );
}

type MarkerProps = { position: [number, number]; unlocked: boolean };

/** Zone 0 "Know Yourself" — the open Constitution on a carved pedestal. */
export function MarkerZone0({ position, unlocked }: MarkerProps) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.3, 0]} receiveShadow>
        <cylinderGeometry args={[2.4, 2.7, 0.6, 18]} />
        <meshStandardMaterial color={getColorSoft(PEDESTAL, unlocked)} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.5, 1.9, 14]} />
        <meshStandardMaterial color={getColor(STONE, unlocked)} />
      </mesh>
      <mesh position={[0, 2.62, 0]}>
        <boxGeometry args={[0.4, 0.45, 2.3]} />
        <meshStandardMaterial color={getColorSoft('#7c3aed', unlocked)} />
      </mesh>
      <mesh position={[-1.0, 2.95, 0]} rotation={[0, 0, 0.3]} castShadow>
        <boxGeometry args={[2.1, 0.2, 2.3]} />
        <meshStandardMaterial color={getColorSoft('#fdf6e3', unlocked)} />
      </mesh>
      <mesh position={[1.0, 2.95, 0]} rotation={[0, 0, -0.3]} castShadow>
        <boxGeometry args={[2.1, 0.2, 2.3]} />
        <meshStandardMaterial color={getColorSoft('#fdf6e3', unlocked)} />
      </mesh>
      <ActiveRing unlocked={unlocked} />
      {!unlocked && <LockIcon position={[0, 6, 0]} />}
    </group>
  );
}

/** Zone 1 "Safe Zone" — stone obelisk bearing the scales of justice. */
export function MarkerZone1({ position, unlocked }: MarkerProps) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <boxGeometry args={[3.0, 1.0, 3.0]} />
        <meshStandardMaterial color={getColorSoft(PEDESTAL, unlocked)} />
      </mesh>
      <mesh position={[0, 3.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.75, 1.25, 5.0, 4]} />
        <meshStandardMaterial color={getColor(STONE, unlocked)} />
      </mesh>
      <mesh position={[0, 6.4, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.85, 1.1, 4]} />
        <meshStandardMaterial color={getColor(STONE_DARK, unlocked)} />
      </mesh>
      <ScalesEmblem y={3.6} z={0.82} unlocked={unlocked} />
      <ActiveRing unlocked={unlocked} />
      {!unlocked && <LockIcon position={[0, 8.2, 0]} />}
    </group>
  );
}

/** Zone 2 "Right to Childhood" — the wonder crystal on a stone base. */
export function MarkerZone2({ position, unlocked }: MarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.6;
    }
  });
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.45, 0]} receiveShadow>
        <cylinderGeometry args={[1.9, 2.2, 0.9, 16]} />
        <meshStandardMaterial color={getColorSoft(PEDESTAL, unlocked)} />
      </mesh>
      <mesh ref={meshRef} position={[0, 2.7, 0]} scale={[1, 1.35, 1]} castShadow>
        <octahedronGeometry args={[1.6]} />
        <meshStandardMaterial
          color={getColor('#a855f7', unlocked)}
          emissive={unlocked ? '#7c3aed' : '#000000'}
          emissiveIntensity={0.25}
          flatShading
        />
      </mesh>
      <mesh position={[1.1, 0.95, 0.6]} scale={[1, 1.3, 1]}>
        <octahedronGeometry args={[0.42]} />
        <meshStandardMaterial color={getColorSoft('#c084fc', unlocked)} flatShading />
      </mesh>
      <mesh position={[-1.05, 0.9, -0.4]} scale={[1, 1.2, 1]}>
        <octahedronGeometry args={[0.34]} />
        <meshStandardMaterial color={getColorSoft('#c084fc', unlocked)} flatShading />
      </mesh>
      <ActiveRing unlocked={unlocked} />
      {!unlocked && <LockIcon position={[0, 6.3, 0]} />}
    </group>
  );
}

/** Zone 3 "School Rights" — friendly little schoolhouse with a bell. */
export function MarkerZone3({ position, unlocked }: MarkerProps) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 2.4, 3.0]} />
        <meshStandardMaterial color={getColor('#f2e3c9', unlocked)} />
      </mesh>
      <mesh position={[0, 3.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[3.0, 1.7, 4]} />
        <meshStandardMaterial color={getColorSoft('#e0704f', unlocked)} />
      </mesh>
      <mesh position={[0, 0.95, 1.52]}>
        <boxGeometry args={[0.9, 1.5, 0.1]} />
        <meshStandardMaterial color={getColorSoft(NAVY, unlocked)} />
      </mesh>
      <mesh position={[-1.15, 1.5, 1.52]}>
        <boxGeometry args={[0.7, 0.7, 0.08]} />
        <meshStandardMaterial color={getColorSoft('#7dd3fc', unlocked)} />
      </mesh>
      <mesh position={[1.15, 1.5, 1.52]}>
        <boxGeometry args={[0.7, 0.7, 0.08]} />
        <meshStandardMaterial color={getColorSoft('#7dd3fc', unlocked)} />
      </mesh>
      <mesh position={[0, 4.35, 0]}>
        <sphereGeometry args={[0.28, 10, 8]} />
        <meshStandardMaterial color={getColorSoft(GOLD, unlocked)} />
      </mesh>
      <ActiveRing unlocked={unlocked} />
      {!unlocked && <LockIcon position={[0, 6.8, 0]} />}
    </group>
  );
}

/** Zone 4 "Justice System Simulator" — columned courthouse with scales. */
export function MarkerZone4({ position, unlocked }: MarkerProps) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.4, 0]} receiveShadow>
        <boxGeometry args={[4.8, 0.8, 3.6]} />
        <meshStandardMaterial color={getColorSoft(PEDESTAL, unlocked)} />
      </mesh>
      {[-1.7, -0.57, 0.57, 1.7].map((x) => (
        <mesh key={x} position={[x, 2.1, 1.2]}>
          <cylinderGeometry args={[0.26, 0.3, 2.6, 10]} />
          <meshStandardMaterial color={getColor('#e8ebf2', unlocked)} />
        </mesh>
      ))}
      <mesh position={[0, 2.0, -0.4]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 3.0, 2.2]} />
        <meshStandardMaterial color={getColor(STONE, unlocked)} />
      </mesh>
      <mesh position={[0, 3.75, 0.2]} castShadow>
        <boxGeometry args={[5.0, 0.7, 4.0]} />
        <meshStandardMaterial color={getColor('#e8ebf2', unlocked)} />
      </mesh>
      <mesh position={[0, 4.55, 0.2]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.9, 1.2, 4]} />
        <meshStandardMaterial color={getColor(STONE_DARK, unlocked)} />
      </mesh>
      <ScalesEmblem y={2.4} z={2.35} unlocked={unlocked} scale={1.15} />
      <ActiveRing unlocked={unlocked} />
      {!unlocked && <LockIcon position={[0, 7.2, 0]} />}
    </group>
  );
}

/** Zone 5 "Digital Safety" — stone slab with a glowing screen + wifi mark. */
export function MarkerZone5({ position, unlocked }: MarkerProps) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <cylinderGeometry args={[1.6, 2.0, 1.0, 14]} />
        <meshStandardMaterial color={getColorSoft(PEDESTAL, unlocked)} />
      </mesh>
      <mesh position={[0, 2.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 3.7, 0.7]} />
        <meshStandardMaterial color={getColor(STONE, unlocked)} />
      </mesh>
      <mesh position={[0, 3.0, 0.38]}>
        <planeGeometry args={[2.2, 2.6]} />
        <meshStandardMaterial
          color={getColor('#4fc3f7', unlocked)}
          emissive={unlocked ? '#38bdf8' : '#000000'}
          emissiveIntensity={0.45}
        />
      </mesh>
      <mesh position={[0, 2.4, 0.42]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color={getColorSoft('#ffffff', unlocked)} />
      </mesh>
      <mesh position={[0, 2.4, 0.42]}>
        <torusGeometry args={[0.3, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color={getColorSoft('#ffffff', unlocked)} />
      </mesh>
      <mesh position={[0, 2.4, 0.42]}>
        <torusGeometry args={[0.55, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color={getColorSoft('#ffffff', unlocked)} />
      </mesh>
      <ActiveRing unlocked={unlocked} />
      {!unlocked && <LockIcon position={[0, 6.6, 0]} />}
    </group>
  );
}

/** Zone 6 "Family & Community Shield" — the great shield tablet. */
export function MarkerZone6({ position, unlocked }: MarkerProps) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <cylinderGeometry args={[2.6, 3.0, 1.0, 18]} />
        <meshStandardMaterial color={getColorSoft(PEDESTAL, unlocked)} />
      </mesh>
      <mesh position={[0, 2.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 3.8, 0.8]} />
        <meshStandardMaterial color={getColor(STONE, unlocked)} />
      </mesh>
      <mesh position={[0, 4.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.7, 1.7, 0.8, 18, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={getColor(STONE, unlocked)} />
      </mesh>
      {/* shield emblem: navy plate + point, gold band, white heart */}
      <mesh position={[0, 3.3, 0.44]}>
        <boxGeometry args={[1.6, 1.7, 0.14]} />
        <meshStandardMaterial color={getColorSoft(NAVY, unlocked)} />
      </mesh>
      <mesh position={[0, 2.35, 0.44]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[1.15, 1.15, 0.14]} />
        <meshStandardMaterial color={getColorSoft(NAVY, unlocked)} />
      </mesh>
      <mesh position={[0, 4.2, 0.45]}>
        <boxGeometry args={[1.7, 0.24, 0.15]} />
        <meshStandardMaterial color={getColorSoft(GOLD, unlocked)} />
      </mesh>
      <mesh position={[-0.19, 3.35, 0.54]}>
        <sphereGeometry args={[0.24, 12, 10]} />
        <meshStandardMaterial color={getColorSoft('#ffffff', unlocked)} />
      </mesh>
      <mesh position={[0.19, 3.35, 0.54]}>
        <sphereGeometry args={[0.24, 12, 10]} />
        <meshStandardMaterial color={getColorSoft('#ffffff', unlocked)} />
      </mesh>
      <mesh position={[0, 3.08, 0.54]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.36, 0.36, 0.24]} />
        <meshStandardMaterial color={getColorSoft('#ffffff', unlocked)} />
      </mesh>
      <ActiveRing unlocked={unlocked} />
      {!unlocked && <LockIcon position={[0, 7.4, 0]} />}
    </group>
  );
}
