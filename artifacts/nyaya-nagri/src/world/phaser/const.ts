/**
 * Nyaya Nagri — Phaser world constants (Task 25 visual engine migration).
 *
 * THE COORDINATE CONTRACT: the logical space is IDENTICAL to the 3D world
 * (x/z in -40..40, zone positions from zones.ts, proximity < 6 units).
 * Phaser renders it at U px per unit; converting only at the render edge
 * means the minimap math, playerPosition mirror, and uiStore flow need
 * ZERO changes (STEP 8 of the migration brief).
 */

/** Pixels per logical unit. */
export const U = 40;
export const WORLD_MIN = -40;
export const WORLD_MAX = 40;
/** Full world square in pixels (3200). */
export const WORLD_PX = (WORLD_MAX - WORLD_MIN) * U;

/** logical unit -> pixel (x and z alike; screen y IS logical z). */
export const px = (u: number) => (u - WORLD_MIN) * U;
/** pixel -> logical unit. */
export const toUnit = (p: number) => p / U + WORLD_MIN;

/** Player movement contract from the 3D Player.tsx — unchanged. */
export const SPEED_UNITS = 12;
/** Proximity rule: squared distance < 36 (6 units) — unchanged. */
export const PROXIMITY_SQ = 36;

/**
 * Reference-art placement (Aug 2026 "same to same" rebuild): the mock's
 * painterly cutouts render at NATIVE pixel size — 1 crop px = 1 world px —
 * because the reference frame (1536 px wide) depicts ~38 units at U = 40.
 */
/** Central plaza disc anchor (= zone0 golden pedestal). */
export const PLAZA = { x: 0, z: -12 };
/** village-grass.png (1024 px art at 2x = 51.2 units of painterly meadow). */
export const PLATE = { x: 0, z: -10, sizePx: 2400 };
/** Cobble path strip width in px (~1.6 units, matches the mock's paths). */
export const PATH_TILE_W = 64;

/* ------------------------- shared palette ------------------------------ */
// Sampled from the tinted village grass plate's outer fade edge (#87ae2d)
// so the flat meadow is seam-free where the plate dissolves into it.
export const GRASS_BASE = 0x87ae2d;
export const GRASS_LIGHT = 0x9cc93f;
export const GRASS_DARK = 0x71961f;

/* Accents still baked programmatically (the padlock badge). */
export const GOLD = '#f5b73c';
export const LOCK_RED = '#e23c3c';
