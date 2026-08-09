import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useJoystick } from '@/ui/JoystickContext';
import { ZONES, getZoneStates } from './zones';
import { uiStore, playerPosition, enterZone } from '@/ui/uiStore';

/* Boy explorer palette (reference redesign): blue hoodie, amber backpack. */
const SKIN = '#f0bd8e';
const HAIR = '#241d1a';
const HOODIE = '#3b82f6';
const HOODIE_DARK = '#2f6fe4';
const SHORTS = '#33415c';
const PACK = '#f5a623';
const PACK_DARK = '#e0951c';

export function Player() {
  const group = useRef<THREE.Group>(null);
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const joystickRef = useJoystick();

  const speed = 12;
  const capsuleHeight = 2;
  const targetPosition = useRef(new THREE.Vector3(0, capsuleHeight / 2, 0));

  // Scratch vectors reused every frame — allocating inside useFrame creates
  // ~240 short-lived Vector3s per second, which shows up as GC stutter on the
  // low-end device profile (PRD v1.0 §7).
  const moveDir = useRef(new THREE.Vector3());
  const desiredCameraPos = useRef(new THREE.Vector3());
  const lookAtTarget = useRef(new THREE.Vector3());
  
  // Listen for the interact key ('E')
  useEffect(() => {
    return subscribeKeys(
      (state) => state.interact,
      (pressed) => {
        if (pressed) {
          const { nearbyZoneId, activeZoneId, isTransitioning } = uiStore.getState();
          if (nearbyZoneId && !activeZoneId && !isTransitioning) {
            const zoneState = getZoneStates().find(z => z.id === nearbyZoneId);
            if (zoneState?.unlocked) {
              enterZone(nearbyZoneId);
            }
          }
        }
      }
    );
  }, [subscribeKeys]);

  useFrame((state, delta) => {
    if (!group.current) return;
    
    // Freeze player input if we are inside a zone or transitioning
    const { activeZoneId, isTransitioning } = uiStore.getState();
    if (activeZoneId || isTransitioning) return;
    
    // 1. Gather Input
    const { forward, back, left, right } = getKeys();
    const move = moveDir.current.set(0, 0, 0);
    
    if (forward) move.z -= 1;
    if (back) move.z += 1;
    if (left) move.x -= 1;
    if (right) move.x += 1;
    
    // Mix joystick if active
    if (joystickRef.current.active) {
      move.x = joystickRef.current.x;
      move.z = joystickRef.current.y;
    }
    
    // 2. Apply Movement
    if (move.lengthSq() > 0) {
      if (move.lengthSq() > 1) {
        move.normalize();
      }
      
      targetPosition.current.x += move.x * speed * delta;
      targetPosition.current.z += move.z * speed * delta;
      
      const targetRotation = Math.atan2(move.x, move.z);
      const currentRotation = group.current.rotation.y;
      
      let diff = targetRotation - currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      group.current.rotation.y += diff * 10 * delta;
    }
    
    targetPosition.current.y = capsuleHeight / 2;
    group.current.position.lerp(targetPosition.current, 15 * delta);
    
    // Publish player position for minimap (avoids React renders)
    playerPosition.x = targetPosition.current.x;
    playerPosition.z = targetPosition.current.z;
    
    // 3. Update Camera
    desiredCameraPos.current.set(
      targetPosition.current.x,
      targetPosition.current.y + 15,
      targetPosition.current.z + 20,
    );
    state.camera.position.lerp(desiredCameraPos.current, 5 * delta);
    
    lookAtTarget.current.set(
      targetPosition.current.x,
      targetPosition.current.y + 2,
      targetPosition.current.z - 2,
    );
    state.camera.lookAt(lookAtTarget.current);

    // 4. Proximity Check
    let closest: string | null = null;
    for (const z of ZONES) {
      const dx = targetPosition.current.x - z.position[0];
      const dz = targetPosition.current.z - z.position[1];
      if (dx * dx + dz * dz < 36) { // Distance < 6 units
        closest = z.id;
        break;
      }
    }
    if (uiStore.getState().nearbyZoneId !== closest) {
      uiStore.set({ nearbyZoneId: closest });
    }
  });

  /*
   * Low-poly boy built from primitives (visual redesign, Aug 2026).
   * Group origin stays at world y = capsuleHeight/2 = 1 (movement contract
   * above is untouched), so feet must reach local y = -1 to stand on the
   * ground. Face (eyes/fringe) is on +z, backpack on -z — matching the
   * original facing convention used by the rotation code. The initial
   * rotation faces away from the camera like the reference framing; the
   * movement code takes over from the first input.
   *
   * PERF: only the three big hull pieces cast shadows (torso, head,
   * backpack) — the small parts add shadow-pass draws without changing
   * the blob on the ground.
   */
  return (
    <group ref={group} rotation={[0, Math.PI, 0]}>
      {/* shoes */}
      <mesh position={[-0.18, -0.885, 0.06]}>
        <boxGeometry args={[0.3, 0.23, 0.52]} />
        <meshStandardMaterial color={HOODIE_DARK} />
      </mesh>
      <mesh position={[0.18, -0.885, 0.06]}>
        <boxGeometry args={[0.3, 0.23, 0.52]} />
        <meshStandardMaterial color={HOODIE_DARK} />
      </mesh>
      <mesh position={[-0.18, -0.93, 0.31]}>
        <boxGeometry args={[0.31, 0.1, 0.12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.18, -0.93, 0.31]}>
        <boxGeometry args={[0.31, 0.1, 0.12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* socks + legs */}
      <mesh position={[-0.18, -0.72, 0]}>
        <cylinderGeometry args={[0.1, 0.11, 0.14, 10]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.18, -0.72, 0]}>
        <cylinderGeometry args={[0.1, 0.11, 0.14, 10]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.18, -0.5, 0]}>
        <cylinderGeometry args={[0.11, 0.12, 0.34, 10]} />
        <meshStandardMaterial color={SKIN} />
      </mesh>
      <mesh position={[0.18, -0.5, 0]}>
        <cylinderGeometry args={[0.11, 0.12, 0.34, 10]} />
        <meshStandardMaterial color={SKIN} />
      </mesh>
      {/* shorts */}
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[0.6, 0.34, 0.42]} />
        <meshStandardMaterial color={SHORTS} />
      </mesh>
      {/* hoodie torso + kangaroo pocket + hood roll */}
      <mesh castShadow position={[0, 0.16, 0]}>
        <boxGeometry args={[0.7, 0.66, 0.44]} />
        <meshStandardMaterial color={HOODIE} />
      </mesh>
      <mesh position={[0, 0.0, 0.235]}>
        <boxGeometry args={[0.32, 0.16, 0.05]} />
        <meshStandardMaterial color={HOODIE_DARK} />
      </mesh>
      <mesh position={[0, 0.42, -0.26]}>
        <boxGeometry args={[0.46, 0.14, 0.18]} />
        <meshStandardMaterial color={HOODIE_DARK} />
      </mesh>
      {/* arms + hands */}
      <mesh position={[-0.44, 0.14, 0]} rotation={[0, 0, 0.18]}>
        <cylinderGeometry args={[0.095, 0.105, 0.5, 10]} />
        <meshStandardMaterial color={HOODIE} />
      </mesh>
      <mesh position={[0.44, 0.14, 0]} rotation={[0, 0, -0.18]}>
        <cylinderGeometry args={[0.095, 0.105, 0.5, 10]} />
        <meshStandardMaterial color={HOODIE} />
      </mesh>
      <mesh position={[-0.5, -0.14, 0]}>
        <sphereGeometry args={[0.095, 10, 8]} />
        <meshStandardMaterial color={SKIN} />
      </mesh>
      <mesh position={[0.5, -0.14, 0]}>
        <sphereGeometry args={[0.095, 10, 8]} />
        <meshStandardMaterial color={SKIN} />
      </mesh>
      {/* head, hair, face */}
      <mesh castShadow position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.33, 16, 14]} />
        <meshStandardMaterial color={SKIN} />
      </mesh>
      <mesh position={[0, 0.86, -0.02]} scale={[1.06, 0.8, 1.06]}>
        <sphereGeometry args={[0.35, 16, 14]} />
        <meshStandardMaterial color={HAIR} />
      </mesh>
      <mesh position={[0, 0.88, 0.24]}>
        <boxGeometry args={[0.46, 0.1, 0.14]} />
        <meshStandardMaterial color={HAIR} />
      </mesh>
      <mesh position={[-0.115, 0.78, 0.29]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#22303e" />
      </mesh>
      <mesh position={[0.115, 0.78, 0.29]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#22303e" />
      </mesh>
      {/* backpack + straps */}
      <mesh castShadow position={[0, 0.18, -0.36]}>
        <boxGeometry args={[0.46, 0.56, 0.26]} />
        <meshStandardMaterial color={PACK} />
      </mesh>
      <mesh position={[0, 0.42, -0.35]}>
        <boxGeometry args={[0.46, 0.18, 0.28]} />
        <meshStandardMaterial color={PACK_DARK} />
      </mesh>
      <mesh position={[-0.19, 0.24, 0.235]}>
        <boxGeometry args={[0.07, 0.5, 0.04]} />
        <meshStandardMaterial color={PACK_DARK} />
      </mesh>
      <mesh position={[0.19, 0.24, 0.235]}>
        <boxGeometry args={[0.07, 0.5, 0.04]} />
        <meshStandardMaterial color={PACK_DARK} />
      </mesh>
    </group>
  );
}
