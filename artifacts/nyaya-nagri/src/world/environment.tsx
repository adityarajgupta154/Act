/**
 * Nyaya Nagri — world environment scenery (visual redesign, Aug 2026).
 *
 * Everything here is DECORATIVE: terrain, dirt paths, vegetation, rocks,
 * flowers, clouds, the distant skyline and the central wishing well. It
 * renders beneath/around the functional zone markers (markers.tsx) and
 * never participates in gameplay — the world has no collision system by
 * design, so the player may walk through decor.
 *
 * Placement is fully deterministic: literal coordinate tables plus one
 * seeded LCG for the flower scatter (no Math.random in render paths).
 * Paths derive from ZONES so a zone move can never orphan its path.
 *
 * PERF (low-end budget, PRD §7): all repeated vegetation is drawn through
 * drei <Instances> — one draw call and ONE shadow-pass draw per variant
 * instead of one per plant. Only the instanced batches and the well's two
 * big hulls cast shadows; distant skyline/hills/clouds never do.
 * `frustumCulled={false}` is required on the batches: an InstancedMesh has
 * a single origin bounding sphere, so with spread-out instances the whole
 * batch would pop out of view when the camera looks away from the origin.
 */
import React from 'react';
import { Instances, Instance } from '@react-three/drei';
import { ZONES } from './zones';

/* ---------- palette ---------- */
const GRASS = '#79c850';
const GRASS_LIGHT = '#8fd465';
const GRASS_DARK = '#6cbb45';
const PATH = '#dfb98b';
const TRUNK = '#8a5a33';

/* ---------- paths (hub → each zone, one gentle bend) ---------- */
const PATH_WIDTH = 2.3;

interface PathSeg {
  x: number;
  z: number;
  len: number;
  angle: number;
}

function segBetween(a: [number, number], b: [number, number]): PathSeg {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  return {
    x: (a[0] + b[0]) / 2,
    z: (a[1] + b[1]) / 2,
    // slight overshoot so segments visually meet under the joint discs
    len: Math.hypot(dx, dz) + 0.4,
    // group Y-rotation that aligns local +x with the a→b direction on XZ
    angle: Math.atan2(-dz, dx),
  };
}

const PATHS = ZONES.map((zone, i) => {
  const [tx, tz] = zone.position;
  const dist = Math.hypot(tx, tz);
  // stop short of the marker so the path meets the pedestal, not pierces it
  const end: [number, number] = [tx - (tx / dist) * 4, tz - (tz / dist) * 4];
  // bend sideways for an organic look; alternate sides per zone index
  const sign = i % 2 === 0 ? 1 : -1;
  const mid: [number, number] = [
    end[0] / 2 - (tz / dist) * sign * dist * 0.14,
    end[1] / 2 + (tx / dist) * sign * dist * 0.14,
  ];
  return {
    segs: [segBetween([0, 0], mid), segBetween(mid, end)],
    joints: [mid, end] as [number, number][],
  };
});

function Paths() {
  return (
    <group>
      {/* hub plaza the player spawns on */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.6, 28]} />
        <meshStandardMaterial color={PATH} />
      </mesh>
      {PATHS.map((p, i) => (
        <group key={i}>
          {p.segs.map((s, j) => (
            <group key={j} position={[s.x, 0.055, s.z]} rotation={[0, s.angle, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[s.len, PATH_WIDTH]} />
                <meshStandardMaterial color={PATH} />
              </mesh>
            </group>
          ))}
          {p.joints.map((jt, j) => (
            <mesh
              key={`j${j}`}
              position={[jt[0], 0.06, jt[1]]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <circleGeometry args={[PATH_WIDTH * 0.62, 20]} />
              <meshStandardMaterial color={PATH} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ---------- terrain ---------- */
const GRASS_PATCHES: Array<[number, number, number, string]> = [
  [-14, -14, 9, GRASS_LIGHT],
  [18, -20, 11, GRASS_DARK],
  [-24, 12, 10, GRASS_LIGHT],
  [26, 10, 12, GRASS_DARK],
  [2, 30, 10, GRASS_LIGHT],
  [-4, -34, 9, GRASS_DARK],
  [38, -6, 9, GRASS_LIGHT],
  [-38, -8, 10, GRASS_DARK],
  [10, 16, 7, GRASS_LIGHT],
  [-12, 24, 8, GRASS_DARK],
];

function Terrain() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color={GRASS} />
      </mesh>
      {GRASS_PATCHES.map(([x, z, r, c], i) => (
        <mesh key={i} position={[x, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[r, 22]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- vegetation (instanced) ---------- */
type TreeVariant = 'round' | 'icosa' | 'pine';
const TREES: Array<[number, number, TreeVariant, number]> = [
  [12, -2, 'icosa', 1.35],
  [-12, -20, 'round', 1.1],
  [12, -18, 'pine', 1.0],
  [22, -2, 'round', 1.2],
  [-24, -2, 'icosa', 1.15],
  [8, -32, 'pine', 1.1],
  [-8, -32, 'round', 1.0],
  [14, 10, 'round', 1.0],
  [-16, 8, 'icosa', 1.0],
  [24, 14, 'pine', 1.1],
  [-26, 16, 'round', 1.05],
  [4, 32, 'icosa', 1.2],
  [-6, 33, 'pine', 1.0],
  [30, -22, 'round', 1.3],
  [-32, -20, 'pine', 1.2],
  [36, 4, 'icosa', 1.1],
  [-38, 2, 'round', 1.15],
  [-13, 28, 'round', 1.0],
  [18, 28, 'round', 1.05],
  [-20, -30, 'icosa', 1.0],
  [34, 24, 'pine', 1.15],
  [-34, 26, 'round', 1.1],
];

const BUSHES: Array<[number, number, number]> = [
  [3, -9, 0.75],
  [-3, -14, 0.65],
  [5, -24, 0.8],
  [-4, -27, 0.7],
  [20, -8, 0.85],
  [-20, -12, 0.75],
  [-13, 17, 0.7],
  [13, 22, 0.8],
  [3, 24, 0.65],
  [-2, 29, 0.75],
  [9, 1, 0.7],
  [26, -13, 0.85],
];

const ROCKS: Array<[number, number, number]> = [
  [-10, -6, 0.7],
  [16, -14, 0.5],
  [-18, -24, 0.9],
  [28, 2, 0.6],
  [-28, 10, 0.8],
  [8, 14, 0.5],
  [-6, 20, 0.6],
  [20, -28, 1.0],
];

interface Inst {
  position: [number, number, number];
  scale: number | [number, number, number];
  color: string;
}

/* Trunks: real trunk profile as the shared geometry, scaled per tree. */
const TRUNK_INSTANCES: Inst[] = TREES.map(([x, z, , s]) => ({
  position: [x, 0.8 * s, z],
  scale: s,
  color: TRUNK,
}));

/* Unit spheres cover round-tree canopies + highlight blobs + bushes. */
const SPHERE_INSTANCES: Inst[] = [
  ...TREES.filter(([, , v]) => v === 'round').flatMap(([x, z, , s]): Inst[] => [
    { position: [x, 2.3 * s, z], scale: 1.55 * s, color: '#46b04f' },
    { position: [x + 0.7 * s, 3.0 * s, z + 0.25 * s], scale: 0.9 * s, color: '#5fc45f' },
  ]),
  ...BUSHES.map(([x, z, r]): Inst => ({
    position: [x, r * 0.55, z],
    scale: [r, r * 0.75, r],
    color: '#55bb58',
  })),
];

const ICOSA_INSTANCES: Inst[] = TREES.filter(([, , v]) => v === 'icosa').map(
  ([x, z, , s]): Inst => ({ position: [x, 2.7 * s, z], scale: 1.7 * s, color: '#3fae4e' }),
);

/* Unit cone, non-uniform scale = the two stacked pine tiers. */
const CONE_INSTANCES: Inst[] = TREES.filter(([, , v]) => v === 'pine').flatMap(
  ([x, z, , s]): Inst[] => [
    { position: [x, 2.2 * s, z], scale: [1.4 * s, 2.4 * s, 1.4 * s], color: '#2f9e44' },
    { position: [x, 3.6 * s, z], scale: [1.0 * s, 1.9 * s, 1.0 * s], color: '#37a94c' },
  ],
);

const ROCK_INSTANCES: Inst[] = ROCKS.map(([x, z, r]): Inst => ({
  position: [x, r * 0.5, z],
  scale: r,
  color: '#9aa3ad',
}));

/* Deterministic flower scatter — seeded LCG, kept clear of zone pedestals. */
const FLOWERS = (() => {
  let s = 20260809;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const cols = ['#fffbe8', '#ffd93d', '#ff9eb5', '#ffffff'];
  const out: Array<{ x: number; z: number; c: string }> = [];
  let guard = 0;
  while (out.length < 46 && guard++ < 400) {
    const a = rnd() * Math.PI * 2;
    const r = 7 + rnd() * 32;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (ZONES.some((zn) => Math.hypot(x - zn.position[0], z - zn.position[1]) < 5)) continue;
    out.push({ x, z, c: cols[out.length % cols.length] });
  }
  return out;
})();

function Vegetation() {
  return (
    <group>
      <Instances limit={TRUNK_INSTANCES.length} frustumCulled={false} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.4, 1.6, 8]} />
        <meshStandardMaterial color={TRUNK} />
        {TRUNK_INSTANCES.map((t, i) => (
          <Instance key={i} position={t.position} scale={t.scale} />
        ))}
      </Instances>
      <Instances limit={SPHERE_INSTANCES.length} frustumCulled={false} castShadow>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#ffffff" />
        {SPHERE_INSTANCES.map((t, i) => (
          <Instance key={i} position={t.position} scale={t.scale} color={t.color} />
        ))}
      </Instances>
      <Instances limit={ICOSA_INSTANCES.length} frustumCulled={false} castShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#ffffff" flatShading />
        {ICOSA_INSTANCES.map((t, i) => (
          <Instance key={i} position={t.position} scale={t.scale} color={t.color} />
        ))}
      </Instances>
      <Instances limit={CONE_INSTANCES.length} frustumCulled={false} castShadow>
        <coneGeometry args={[1, 1, 9]} />
        <meshStandardMaterial color="#ffffff" />
        {CONE_INSTANCES.map((t, i) => (
          <Instance key={i} position={t.position} scale={t.scale} color={t.color} />
        ))}
      </Instances>
      <Instances limit={ROCK_INSTANCES.length} frustumCulled={false} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#9aa3ad" flatShading />
        {ROCK_INSTANCES.map((t, i) => (
          <Instance key={i} position={t.position} scale={t.scale} />
        ))}
      </Instances>
      <Instances limit={FLOWERS.length} frustumCulled={false}>
        <sphereGeometry args={[0.11, 8, 8]} />
        <meshStandardMaterial />
        {FLOWERS.map((f, i) => (
          <Instance key={i} position={[f.x, 0.14, f.z]} color={f.c} />
        ))}
      </Instances>
    </group>
  );
}

/* ---------- sky & horizon (never casts shadows) ---------- */
const CLOUDS: Array<[number, number, number, number]> = [
  [-30, 26, -55, 1.2],
  [10, 30, -70, 1.5],
  [40, 27, -45, 1.0],
  [-55, 28, -20, 1.3],
  [55, 29, -10, 1.1],
  [-15, 31, -90, 1.6],
];

function Cloud({ x, y, z, s }: { x: number; y: number; z: number; s: number }) {
  return (
    <group position={[x, y, z]} scale={s}>
      <mesh>
        <sphereGeometry args={[2.2, 10, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[2.1, -0.3, 0.2]}>
        <sphereGeometry args={[1.6, 10, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-2.0, -0.4, -0.1]}>
        <sphereGeometry args={[1.4, 10, 8]} />
        <meshStandardMaterial color="#f4f9ff" />
      </mesh>
    </group>
  );
}

function RoundTower({
  x,
  z,
  h,
  color,
  roof,
}: {
  x: number;
  z: number;
  h: number;
  color: string;
  roof: string;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[2.6, 3.1, h, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, h + 2.6, 0]}>
        <coneGeometry args={[3.4, 5.6, 10]} />
        <meshStandardMaterial color={roof} />
      </mesh>
    </group>
  );
}

function CastleBlock({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[9, 8, 5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-4.5, 6.5, 0]}>
        <cylinderGeometry args={[1.6, 1.8, 13, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[4.5, 6.5, 0]}>
        <cylinderGeometry args={[1.6, 1.8, 13, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-4.5, 15, 0]}>
        <coneGeometry args={[2.1, 3.6, 8]} />
        <meshStandardMaterial color="#6d5ce6" />
      </mesh>
      <mesh position={[4.5, 15, 0]}>
        <coneGeometry args={[2.1, 3.6, 8]} />
        <meshStandardMaterial color="#6d5ce6" />
      </mesh>
    </group>
  );
}

const HILLS: Array<[number, number, number]> = [
  [-45, -55, 18],
  [0, -65, 22],
  [45, -58, 16],
  [-70, -40, 14],
  [70, -45, 15],
  [-20, -78, 20],
];

function Horizon() {
  return (
    <group>
      {HILLS.map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0, z]} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[r, 14, 10]} />
          <meshStandardMaterial color="#67bd4b" />
        </mesh>
      ))}
      <RoundTower x={-70} z={-70} h={13} color="#9f7cf2" roof="#7c5cd6" />
      <RoundTower x={15} z={-95} h={16} color="#8b7cf6" roof="#6d5ce6" />
      <RoundTower x={85} z={-35} h={12} color="#9f7cf2" roof="#7c5cd6" />
      <RoundTower x={-88} z={-25} h={11} color="#8ea2f5" roof="#5c74e6" />
      <CastleBlock x={-30} z={-92} color="#8ea2f5" />
      <CastleBlock x={55} z={-80} color="#93b3f0" />
      {CLOUDS.map(([x, y, z, s], i) => (
        <Cloud key={i} x={x} y={y} z={z} s={s} />
      ))}
    </group>
  );
}

/* ---------- central wishing well (decorative landmark) ---------- */
function WishingWell() {
  return (
    <group position={[7, 0, 3]}>
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.7, 1.95, 1.3, 14]} />
        <meshStandardMaterial color="#8b94a3" />
      </mesh>
      <mesh position={[0, 1.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.7, 0.18, 10, 18]} />
        <meshStandardMaterial color="#aeb6c2" />
      </mesh>
      <mesh position={[0, 1.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 18]} />
        <meshStandardMaterial color="#41c0f9" />
      </mesh>
      <mesh position={[-1.35, 2.2, 0]}>
        <boxGeometry args={[0.22, 2.3, 0.22]} />
        <meshStandardMaterial color={TRUNK} />
      </mesh>
      <mesh position={[1.35, 2.2, 0]}>
        <boxGeometry args={[0.22, 2.3, 0.22]} />
        <meshStandardMaterial color={TRUNK} />
      </mesh>
      <mesh position={[0, 3.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 2.7, 8]} />
        <meshStandardMaterial color="#6d4526" />
      </mesh>
      <mesh position={[0, 3.95, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.5, 1.5, 4]} />
        <meshStandardMaterial color="#7c5cd6" />
      </mesh>
    </group>
  );
}

/** Full decorative environment — mounted once by the world Map. */
export function WorldEnvironment() {
  return (
    <group>
      <Terrain />
      <Paths />
      <Vegetation />
      <Horizon />
      <WishingWell />
    </group>
  );
}
