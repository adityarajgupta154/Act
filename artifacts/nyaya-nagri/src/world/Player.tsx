import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useJoystick } from '@/ui/JoystickContext';
import { ZONES, getZoneStates } from './zones';
import { uiStore, playerPosition, enterZone } from '@/ui/uiStore';

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

  return (
    <group ref={group}>
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.6, 0.8, 4, 16]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
      
      <mesh castShadow position={[0, 0.4, 0.5]}>
        <boxGeometry args={[0.8, 0.3, 0.3]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      
      <mesh castShadow position={[0, 0.1, -0.6]}>
        <boxGeometry args={[0.7, 0.9, 0.4]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
    </group>
  );
}
