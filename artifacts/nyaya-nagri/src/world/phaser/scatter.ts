/**
 * Nyaya Nagri — deterministic meadow scatter (terrain-polish task, Aug 2026).
 *
 * The task: the flat GRASS_BASE regions outside the painted village plate
 * read as unfinished CSS-green. The fix is two-layered — a seamless blade
 * TILE (WorldScene.buildGround) plus THIS module: organic vegetation
 * (flower clumps, grass tufts, bushes, occasional rocks/mushrooms) spread
 * over the whole 80x80-unit meadow.
 *
 * Contract:
 * - PLACEMENT IS PURE + SEEDED (mulberry32, fixed seed): every boot
 *   renders the identical field — no hydration flicker, no save-state
 *   coupling, and screenshots stay comparable across sessions.
 * - EXCLUSION-FIRST (task §"existing objects must remain clear"): items
 *   never land on roads/lanes, the plaza disc, monuments (generous disc
 *   incl. label pill), the river+bridge, houses, trees, existing props,
 *   flower patches, the spawn, or the world rim. Every clearance check is
 *   FOOTPRINT-AWARE: the candidate's own scaled half-extent joins the
 *   margin, so a wide clump can't pass a center-point test yet still
 *   overhang a road edge (architect finding, Aug 2026). All geometry
 *   arrives as plain data from WorldScene — this module imports NO Phaser
 *   value (type-only), so smokes could unit-test placement headlessly.
 * - The village-plate CORE is sampled at a fraction of the outer rate:
 *   the plate art is already painterly, the flat OUTER band needs the
 *   density (task: vegetation distributed organically, center stays
 *   comfortable to walk).
 * - Scatter never collides (walk-through like the existing flower
 *   patches/mushrooms) — movement comfort is part of the task spec.
 */
import type Phaser from 'phaser';
import { U, px, WORLD_MIN, WORLD_MAX } from './const';

/* ------------------------------ inputs ---------------------------------- */

export interface ScatterExclusions {
  /** Road chords in unit space (plaza rim -> location anchor). */
  lanes: Array<{ a: [number, number]; b: [number, number] }>;
  /** [x, z, radius] keep-clear discs (trees, props, monuments, spawn...). */
  discs: Array<[number, number, number]>;
  /** [cx, cz, halfW, halfH] keep-clear rects (river). */
  rects: Array<[number, number, number, number]>;
}

export type ScatterKind =
  | 'decor-flowers-a'
  | 'decor-flowers-b'
  | 'decor-tuft'
  | 'decor-bush-a'
  | 'decor-bush-b'
  | 'decor-rocks'
  | 'decor-mushroom';

export interface ScatterItem {
  kind: ScatterKind;
  x: number;
  z: number;
  scale: number;
  flip: boolean;
}

/* ------------------------------ tuning ---------------------------------- */

/** Fixed seed — the field is part of the map's identity, not randomness. */
const SEED = 0x134f00d;
/** Sampling attempts / placed-item cap (~300 sprites ≈ one per ~14u² of
 * open meadow; Phaser batches these trivially, Canvas2D fallback incl.). */
const ATTEMPTS = 1600;
const MAX_ITEMS = 340;
/** Painted lane half-width (76px cobble / 2 / 40px-per-unit)... */
const LANE_HALF = 0.95;
/** ...plus a grass gutter that stays visibly clear between the lane edge
 * and the nearest vegetation EDGE (footprint added on top of this). */
const LANE_GUTTER = 0.6;
/** Keep off the world rim (border forest owns it). */
const EDGE_MARGIN = 1.5;
/** Rendered half-extent per kind at scale 1 (trimmed art width / 2 / U).
 * Joins every clearance check scaled by the candidate's rolled scale. */
const FOOTPRINT_HALF: Record<ScatterKind, number> = {
  'decor-flowers-a': 1.15,
  'decor-flowers-b': 1.15,
  'decor-tuft': 0.85,
  'decor-bush-a': 1.6,
  'decor-bush-b': 2.05,
  'decor-rocks': 1.0,
  'decor-mushroom': 0.73,
};

function footprintOf(kind: ScatterKind, scale: number): number {
  return FOOTPRINT_HALF[kind] * scale;
}
/** Village-plate core (plate spans x -30..30 / z -40..20; core is the
 * clearly-painted interior, not the fade band). Sampled at reduced rate. */
const CORE = { x0: -26, x1: 26, z0: -36, z1: 16 };
const CORE_ACCEPT = 0.32;

/** kind -> [weight, min spacing to ANY neighbour (units)]. Mix follows the
 * task's distribution bands: clusters > bushes > rocks > rare accents. */
const KINDS: Array<[ScatterKind, number, number]> = [
  ['decor-flowers-a', 0.17, 1.7],
  ['decor-flowers-b', 0.17, 1.7],
  ['decor-tuft', 0.27, 1.5],
  ['decor-bush-a', 0.1, 2.4],
  ['decor-bush-b', 0.09, 2.6],
  ['decor-rocks', 0.1, 2.1],
  ['decor-mushroom', 0.04, 1.9],
];

/* ----------------------------- generation ------------------------------- */

/** Small fast deterministic PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function distToSegSq(
  x: number,
  z: number,
  a: [number, number],
  b: [number, number],
): number {
  const abx = b[0] - a[0];
  const abz = b[1] - a[1];
  const lenSq = abx * abx + abz * abz || 1;
  let t = ((x - a[0]) * abx + (z - a[1]) * abz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const dx = x - (a[0] + abx * t);
  const dz = z - (a[1] + abz * t);
  return dx * dx + dz * dz;
}

function isFree(
  x: number,
  z: number,
  kind: ScatterKind,
  scale: number,
  excl: ScatterExclusions,
  placed: ScatterItem[],
  spacing: number,
): boolean {
  const fp = footprintOf(kind, scale);
  if (
    x < WORLD_MIN + EDGE_MARGIN + fp ||
    x > WORLD_MAX - EDGE_MARGIN - fp ||
    z < WORLD_MIN + EDGE_MARGIN + fp ||
    z > WORLD_MAX - EDGE_MARGIN - fp
  ) {
    return false;
  }
  const laneClear = LANE_HALF + LANE_GUTTER + fp;
  for (const lane of excl.lanes) {
    if (distToSegSq(x, z, lane.a, lane.b) < laneClear * laneClear) return false;
  }
  for (const [cx, cz, r] of excl.discs) {
    const dx = x - cx;
    const dz = z - cz;
    const clear = r + fp;
    if (dx * dx + dz * dz < clear * clear) return false;
  }
  for (const [cx, cz, hw, hh] of excl.rects) {
    if (Math.abs(x - cx) < hw + fp && Math.abs(z - cz) < hh + fp) return false;
  }
  for (const p of placed) {
    const dx = x - p.x;
    const dz = z - p.z;
    // Neighbour rule: per-kind spacing, but never full stacking — allow
    // partial overlap (0.75 of summed footprints) for organic clumping.
    const minD = Math.max(
      spacing,
      spacingOf(p.kind),
      (fp + footprintOf(p.kind, p.scale)) * 0.75,
    );
    if (dx * dx + dz * dz < minD * minD) return false;
  }
  return true;
}

function spacingOf(kind: ScatterKind): number {
  const row = KINDS.find(([k]) => k === kind);
  return row ? row[2] : 1.7;
}

function pickKind(r: number): ScatterKind {
  const total = KINDS.reduce((s, [, w]) => s + w, 0);
  let acc = 0;
  for (const [kind, w] of KINDS) {
    acc += w / total;
    if (r < acc) return kind;
  }
  return 'decor-tuft';
}

/** Pure, deterministic placement — exported for headless testability. */
export function generateScatter(excl: ScatterExclusions): ScatterItem[] {
  const rng = mulberry32(SEED);
  const items: ScatterItem[] = [];
  const span = WORLD_MAX - WORLD_MIN;
  for (let i = 0; i < ATTEMPTS && items.length < MAX_ITEMS; i++) {
    const x = WORLD_MIN + rng() * span;
    const z = WORLD_MIN + rng() * span;
    const kindRoll = rng();
    const scaleRoll = rng();
    const flipRoll = rng();
    const coreRoll = rng();
    const partnerRoll = rng();
    const inCore = x >= CORE.x0 && x <= CORE.x1 && z >= CORE.z0 && z <= CORE.z1;
    if (inCore && coreRoll > CORE_ACCEPT) continue;
    const kind = pickKind(kindRoll);
    const scale = baseScale(kind) + scaleRoll * scaleJitter(kind);
    if (!isFree(x, z, kind, scale, excl, items, spacingOf(kind))) continue;
    items.push({ kind, x, z, scale, flip: flipRoll < 0.5 });
    // Organic "larger vegetation clusters" (task band 5-10%): a placed
    // bush sometimes gets a smaller partner right beside it.
    if (kind.startsWith('decor-bush') && partnerRoll < 0.35) {
      const ang = rng() * Math.PI * 2;
      const d = 1.7 + rng() * 0.9;
      const bx = x + Math.cos(ang) * d;
      const bz = z + Math.sin(ang) * d;
      const pScale = 0.6 + rng() * 0.25;
      if (
        items.length < MAX_ITEMS &&
        isFree(bx, bz, 'decor-bush-a', pScale, excl, items, 1.6)
      ) {
        items.push({
          kind: 'decor-bush-a',
          x: bx,
          z: bz,
          scale: pScale,
          flip: rng() < 0.5,
        });
      }
    }
  }
  return items;
}

function baseScale(kind: ScatterKind): number {
  switch (kind) {
    case 'decor-bush-a':
    case 'decor-bush-b':
      return 0.75;
    case 'decor-rocks':
      return 0.6;
    case 'decor-mushroom':
      return 0.7;
    default:
      return 0.8;
  }
}

function scaleJitter(kind: ScatterKind): number {
  return kind.startsWith('decor-bush') ? 0.4 : 0.35;
}

/* ------------------------------ rendering ------------------------------- */

/**
 * Renders the field. Flat clumps (flowers/tufts) draw like the existing
 * FLOWER_PATCHES (depth 5.5, no shadow); volumetric pieces (bushes,
 * rocks, mushrooms) join the y-sorted prop band (10 + y*0.01) — bushes
 * with the same soft code-drawn shadow ellipse the trees use. NOTHING
 * here collides: the field is walk-through by design.
 */
export function buildScatter(
  scene: Phaser.Scene,
  excl: ScatterExclusions,
): void {
  for (const item of generateScatter(excl)) {
    const tx = px(item.x);
    const ty = px(item.z);
    const s = item.scale;
    if (
      item.kind === 'decor-flowers-a' ||
      item.kind === 'decor-flowers-b' ||
      item.kind === 'decor-tuft'
    ) {
      scene.add
        .image(tx, ty, item.kind)
        .setScale(s)
        .setFlipX(item.flip)
        .setDepth(5.5)
        .setAlpha(0.95);
      continue;
    }
    if (item.kind.startsWith('decor-bush')) {
      scene.add
        .ellipse(tx - 6 * s, ty + 5 * s, 100 * s, 30 * s, 0x233318, 0.12)
        .setDepth(5);
    }
    scene.add
      .image(tx, ty, item.kind)
      .setOrigin(0.5, 0.9)
      .setScale(s)
      .setFlipX(item.flip)
      .setDepth(10 + ty * 0.01);
  }
  void U; // unit constant re-exported use (px derives from it)
}
