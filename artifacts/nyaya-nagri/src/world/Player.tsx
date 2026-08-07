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
    const moveDir = new THREE.Vector3(0, 0, 0);
    
    if (forward) moveDir.z -= 1;
    if (back) moveDir.z += 1;
    if (left) moveDir.x -= 1;
    if (right) moveDir.x += 1;
    
    // Mix joystick if active
    if (joystickRef.current.active) {
      moveDir.x = joystickRef.current.x;
      moveDir.z = joystickRef.current.y; 
    }
    
    // 2. Apply Movement
    if (moveDir.lengthSq() > 0) {
      if (moveDir.lengthSq() > 1) {
        moveDir.normalize();
      }
      
      targetPosition.current.x += moveDir.x * speed * delta;
      targetPosition.current.z += moveDir.z * speed * delta;
      
      const targetRotation = Math.atan2(moveDir.x, moveDir.z);
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
    const cameraOffset = new THREE.Vector3(0, 15, 20);
    const desiredCameraPos = targetPosition.current.clone().add(cameraOffset);
    state.camera.position.lerp(desiredCameraPos, 5 * delta);
    
    const lookAtTarget = targetPosition.current.clone().add(new THREE.Vector3(0, 2, -2));
    state.camera.lookAt(lookAtTarget);

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
