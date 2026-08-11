/**
 * Nyaya Nagri — the ONE authoritative road network (map redesign, Aug 2026).
 *
 * Task contract: every lane runs plaza -> location anchor, endpoints are
 * DERIVED from the same registries the game logic uses (zones.ts +
 * storyData.ts) so roads can never drift from the places they serve, and
 * there is exactly one road system (the old hand-tuned spoke polylines in
 * WorldScene.buildPaths are gone).
 *
 * Rendering strategy: each lane is a quadratic curve (straight when
 * bow = 0) sampled into short overlapping cobble TileSprite segments.
 * Adjacent segments differ by only a few degrees, so joints disappear —
 * unlike the old 2-3 segment polylines whose 30°+ bends left wedge gaps.
 * Lanes draw at depth 0.5, UNDER the plaza disc (0.6) and under every
 * monument cutout (10+): both lane ends tuck beneath art, so the junction
 * and the doorstep are seamless by construction, not by pixel-tuning.
 */
import Phaser from 'phaser';
import { ZONES } from '../zones';
import { STORY_ENTRANCE } from '@/story/storyData';
import { PATH_TILE_W, PLAZA, U, px } from './const';
// Plaza footprint (ellipse) lives in a Phaser-free module so smokes can
// unit-test the hub-exclusion rule; lane starts sit ON this rim, then
// step back inside the disc so the disc paints over the seam.
import { PLAZA_RX, PLAZA_RZ, isInsidePlazaDisc } from './plazaGeom';

/** How far a lane start slides INSIDE the plaza rim (hidden overlap). */
const RIM_INSET = 1.0;

/** Lane width factor over the 64 px cobble crop (matches the mock). */
const LANE_SCALE = 1.19;
/** Curve sample step (units) — short segments = invisible joints. */
const STEP = 0.85;
/** Extra length added to BOTH ends of every segment (hidden overlap). */
const SEG_PAD = 0.45;

interface LaneSpec {
  /** Lane target in unit space (zone anchor / story house / map edge). */
  to: [number, number];
  /**
   * How many units BEFORE the target the visible lane stops — tuned per
   * location so the lane vanishes under the cutout's feathered grass halo
   * (task §7: terminate at the entrance/base, never in open grass).
   */
  stop: number;
  /** Perpendicular bulge of the curve midpoint (units). 0 = straight.
   * Positive bows left of the travel direction (plaza -> target). */
  bow: number;
}

/** Zone anchor lookup — single source of truth stays zones.ts. */
function zonePos(id: string): [number, number] {
  const z = ZONES.find((zone) => zone.id === id);
  if (!z) throw new Error(`roads.ts: unknown zone '${id}'`);
  return z.position;
}

/**
 * STRAIGHT radial spokes (Aug 10 2026 realignment task): the reference
 * frame shows a clean Candy-Crush wheel — N/S perfectly vertical, W/E
 * perfectly horizontal, four diagonals at mirror-symmetric angles, every
 * lane entering its monument's FOOT dead-center. The zone registry already
 * encodes that symmetry (NW/NE at ±45°, SW/SE mirrored, W/E/story on the
 * plaza's exact z, N/S on x = 0), so every lane is the straight chord
 * plaza -> anchor: bow = 0 EVERYWHERE. Do not reintroduce per-lane bows —
 * curved diagonals are precisely the "crooked roads" bug this fixed.
 *
 * Lanes are DERIVED from the registries, not hand-listed: every ZONES
 * entry outside the plaza disc gets a spoke automatically, so a future
 * location added to zones.ts is connected with zero road code. Terminus
 * tuning is data (STOP_OVERRIDES), not new lane logic.
 */

/**
 * Default visible-end distance BEFORE the anchor (units). stampSegment
 * pads every segment end by SEG_PAD, so the true painted tip lands
 * (stop - SEG_PAD) before the anchor — with 0.6 that is ~0.15 units
 * plaza-side of the foot, tucked under the cutout's opaque base (every
 * monument art is >= 4 units wide and extends ~0.06h below its anchor,
 * art depth 10+ vs lane depth 0.5).
 */
const STOP_DEFAULT = 0.6;
/** Per-location terminus tuning (data, not logic). Keys: zone id or
 * 'story'. Only add entries when a cutout's base skirt demands it. */
const STOP_OVERRIDES: Record<string, number> = {
  zone3: 0.7, // wisdom well — broad plinth, end a touch earlier
  // Feathered (semi-transparent) base halos don't catch a tile tip the
  // way fences/plinths do — measured ~0.3u of visible grass at the
  // default stop (Aug 10 realignment screenshots), so these tips slide
  // deeper under the art body. zone5's Aug 2026 user-supplied pillar art
  // has an OPAQUE stepped base — the deep stop now simply hides the tip
  // under it, so the tuning stays put.
  zone5: 0.15, // digital-safety pillar — tip tucks under the stone base
  story: 0.35, // help house — tip tucks under the gate/flower bed
};

/**
 * The lanes of the village: one straight spoke per zone (N well, NW
 * childhood cottage, NE shield, W rights cottage, SW obelisk, SE kindness
 * stone), the E spoke to the story help house, plus the S entrance lane
 * the child spawns on, which runs to the border forest so it reads as the
 * road INTO the village (reference: the path continues to the frame edge).
 */
function laneSpecs(): LaneSpec[] {
  const lanes: LaneSpec[] = [];
  for (const zone of ZONES) {
    const [zx, zz] = zone.position;
    // A destination strictly inside the plaza ELLIPSE is the hub itself
    // (zone0) — no road. Rim/outside locations always get a spoke, so a
    // future zones.ts entry auto-connects (see plazaGeom for the rule).
    if (isInsidePlazaDisc(zx, zz)) continue;
    lanes.push({
      to: zone.position,
      stop: STOP_OVERRIDES[zone.id] ?? STOP_DEFAULT,
      bow: 0,
    });
  }
  lanes.push({
    to: STORY_ENTRANCE.position,
    stop: STOP_OVERRIDES.story ?? STOP_DEFAULT,
    bow: 0,
  }); // E — help house
  lanes.push({ to: [0, 17.5], stop: 0, bow: 0 }); // S — village entrance (spawn lane); ends INSIDE the border-forest tree line so it reads as the road out of the village, never a dead end in grass
  return lanes;
}

/** Point on the plaza rim toward (tx, tz), pulled RIM_INSET inside. */
function rimStart(tx: number, tz: number): [number, number] {
  const dx = tx - PLAZA.x;
  const dz = tz - PLAZA.z;
  const theta = Math.atan2(dz / PLAZA_RZ, dx / PLAZA_RX);
  const ex = PLAZA.x + PLAZA_RX * Math.cos(theta);
  const ez = PLAZA.z + PLAZA_RZ * Math.sin(theta);
  const len = Math.hypot(dx, dz) || 1;
  return [ex - (dx / len) * RIM_INSET, ez - (dz / len) * RIM_INSET];
}

/** Quadratic Bezier point. */
function qPoint(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  t: number,
): [number, number] {
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const c = t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0],
    a * p0[1] + b * p1[1] + c * p2[1],
  ];
}

/** Builds the full road network. Idempotent per scene create(). */
export function buildRoads(scene: Phaser.Scene): void {
  for (const spec of laneSpecs()) paveLane(scene, spec);
}

function paveLane(scene: Phaser.Scene, spec: LaneSpec): void {
  const [tx, tz] = spec.to;
  const p0 = rimStart(tx, tz);
  // Visible end: `stop` units short of the target along the approach.
  const ddx = tx - p0[0];
  const ddz = tz - p0[1];
  const dLen = Math.hypot(ddx, ddz) || 1;
  const p2: [number, number] = [
    tx - (ddx / dLen) * spec.stop,
    tz - (ddz / dLen) * spec.stop,
  ];
  // Control point: midpoint pushed perpendicular-left by `bow`.
  const mid: [number, number] = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];
  const p1: [number, number] = [
    mid[0] + (-ddz / dLen) * spec.bow,
    mid[1] + (ddx / dLen) * spec.bow,
  ];

  // Arc-length estimate over the sampled polyline, then even steps.
  const COARSE = 24;
  let approxLen = 0;
  let prev = p0;
  for (let i = 1; i <= COARSE; i++) {
    const pt = qPoint(p0, p1, p2, i / COARSE);
    approxLen += Math.hypot(pt[0] - prev[0], pt[1] - prev[1]);
    prev = pt;
  }
  const n = Math.max(1, Math.ceil(approxLen / STEP));
  let a = p0;
  for (let i = 1; i <= n; i++) {
    const b = qPoint(p0, p1, p2, i / n);
    stampSegment(scene, a, b);
    a = b;
  }
}

/** One cobble TileSprite laid between two unit-space points. */
function stampSegment(
  scene: Phaser.Scene,
  a: [number, number],
  b: [number, number],
): void {
  const ax = px(a[0]);
  const ay = px(a[1]);
  const bx = px(b[0]);
  const by = px(b[1]);
  const len = Math.hypot(bx - ax, by - ay);
  if (len < 1) return;
  const pad = SEG_PAD * U;
  const nx = (bx - ax) / len;
  const ny = (by - ay) / len;
  const sx = ax - nx * pad;
  const sy = ay - ny * pad;
  const ex = bx + nx * pad;
  const ey = by + ny * pad;
  const strip = scene.add.tileSprite(
    (sx + ex) / 2,
    (sy + ey) / 2,
    PATH_TILE_W * LANE_SCALE,
    Math.hypot(ex - sx, ey - sy),
    'path-tile',
  );
  strip.setTileScale(LANE_SCALE);
  // TileSprite "height" runs along screen +y; rotate onto the segment.
  strip.setRotation(Math.atan2(ey - sy, ex - sx) - Math.PI / 2);
  // UNDER the plaza disc (0.6) and monuments (10+): both ends tuck away.
  strip.setDepth(0.5);
}
