import React from 'react';

export function Map() {
  return (
    <group>
      {/* Main Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        {/* Soft, warm green for adventure vibe */}
        <meshStandardMaterial color="#bbf7d0" /> 
      </mesh>
      
      {/* Decorative environment elements */}
      {/* Small stylized hill/bump */}
      <mesh position={[10, 0, -15]} receiveShadow castShadow>
        <cylinderGeometry args={[4, 8, 2, 16]} />
        <meshStandardMaterial color="#86efac" />
      </mesh>

      {/* Stylized tree 1 */}
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

      {/* Stylized tree 2 */}
      <group position={[-12, 0, -5]}>
        <mesh position={[0, 1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.5, 2]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[0, 3, 0]} castShadow receiveShadow>
          <icosahedronGeometry args={[2, 1]} />
          <meshStandardMaterial color="#16a34a" flatShading />
        </mesh>
      </group>
      
      {/* Stylized tree 3 */}
      <group position={[15, 0, 5]}>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.6, 0.7, 3]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
          <icosahedronGeometry args={[3, 1]} />
          <meshStandardMaterial color="#4ade80" flatShading />
        </mesh>
      </group>

      {/* A small stylized building/monument placeholder (suggesting a destination) */}
      <group position={[0, 0, -25]}>
        <mesh position={[0, 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[8, 4, 8]} />
          <meshStandardMaterial color="#fef3c7" /> {/* Warm cream */}
        </mesh>
        <mesh position={[0, 5.5, 0]} castShadow receiveShadow>
          <coneGeometry args={[6, 3, 4]} />
          <meshStandardMaterial color="#f59e0b" /> {/* Orange roof */}
        </mesh>
      </group>
      
      {/* Scattered rocks */}
      <mesh position={[-8, 0.5, -15]} castShadow receiveShadow rotation={[Math.PI/4, Math.PI/3, 0]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#94a3b8" flatShading />
      </mesh>
      <mesh position={[-9, 0.3, -13]} castShadow receiveShadow rotation={[0, Math.PI/5, Math.PI/6]}>
        <dodecahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#64748b" flatShading />
      </mesh>
    </group>
  );
}
