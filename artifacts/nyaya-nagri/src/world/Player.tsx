import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useJoystick } from '@/ui/JoystickContext';

export function Player() {
  const group = useRef<THREE.Group>(null);
  const [, getKeys] = useKeyboardControls();
  const joystickRef = useJoystick();

  const speed = 12;
  const capsuleHeight = 2;
  // Start slightly lifted so it drops in (visually) or just perfectly on ground
  const targetPosition = useRef(new THREE.Vector3(0, capsuleHeight / 2, 0));
  
  useFrame((state, delta) => {
    if (!group.current) return;
    
    // 1. Gather Input
    const { forward, back, left, right } = getKeys();
    const moveDir = new THREE.Vector3(0, 0, 0);
    
    if (forward) moveDir.z -= 1;
    if (back) moveDir.z += 1;
    if (left) moveDir.x -= 1;
    if (right) moveDir.x += 1;
    
    // Mix joystick if active
    if (joystickRef.current.active) {
      // Joystick y is negative when pushed UP (forward)
      moveDir.x = joystickRef.current.x;
      moveDir.z = joystickRef.current.y; 
    }
    
    // 2. Apply Movement
    if (moveDir.lengthSq() > 0) {
      // Cap max speed vector length to 1
      if (moveDir.lengthSq() > 1) {
        moveDir.normalize();
      }
      
      // Update logical position
      targetPosition.current.x += moveDir.x * speed * delta;
      targetPosition.current.z += moveDir.z * speed * delta;
      
      // Calculate target rotation to face movement direction
      const targetRotation = Math.atan2(moveDir.x, moveDir.z);
      
      // Smoothly rotate character
      const currentRotation = group.current.rotation.y;
      // Simple shortest-path lerp for rotation
      let diff = targetRotation - currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      group.current.rotation.y += diff * 10 * delta;
    }
    
    // Constrain to ground
    targetPosition.current.y = capsuleHeight / 2;
    
    // Smoothly move visual mesh to logical position
    group.current.position.lerp(targetPosition.current, 15 * delta);
    
    // 3. Update Camera
    // We want the camera to follow at a fixed offset
    const cameraOffset = new THREE.Vector3(0, 15, 20);
    const desiredCameraPos = targetPosition.current.clone().add(cameraOffset);
    
    state.camera.position.lerp(desiredCameraPos, 5 * delta);
    
    // Smooth lookat
    const lookAtTarget = targetPosition.current.clone().add(new THREE.Vector3(0, 2, -2));
    state.camera.lookAt(lookAtTarget);
  });

  return (
    <group ref={group}>
      {/* Main Character Body (Friendly rounded capsule) */}
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.6, 0.8, 4, 16]} />
        <meshStandardMaterial color="#0ea5e9" /> {/* Sky blue */}
      </mesh>
      
      {/* Simple Face / Direction Indicator (Glasses/Goggles) */}
      <mesh castShadow position={[0, 0.4, 0.5]}>
        <boxGeometry args={[0.8, 0.3, 0.3]} />
        <meshStandardMaterial color="#0f172a" /> {/* Dark slate */}
      </mesh>
      
      {/* Little backpack */}
      <mesh castShadow position={[0, 0.1, -0.6]}>
        <boxGeometry args={[0.7, 0.9, 0.4]} />
        <meshStandardMaterial color="#f59e0b" /> {/* Amber */}
      </mesh>
    </group>
  );
}
