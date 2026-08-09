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
 * Zone 0 territory tile placement. Derived from the generated painting:
 * its central plaza sits at image fraction (0.50, 0.53), and must land on
 * the zone0 monument anchor (0, -12); the square tile therefore covers
 * logical x -14..14, z -27..1 (28 units). The spawn hub (0,0) falls on the
 * tile's faded lower edge, right where a painted path exits the village.
 */
export const ZONE0_TILE = { x: -14, z: -27, size: 28 };

/* ------------------------- shared palette ------------------------------ */
/* Grass base matches the flat green the territory paintings fade into,   */
/* so tile edges dissolve into the programmatic ground without a seam.    */
// Sampled from the Zone 0 territory art's outer fade ring (#8cba51) so the
// flat meadow is seam-free where painterly tiles blend into plain ground.
export const GRASS_BASE = 0x8cba51;
export const GRASS_LIGHT = 0x9dcb60;
export const GRASS_DARK = 0x7aa746;
export const PATH_MAIN = 0xdcb474;
export const PATH_EDGE = 0xc89f5f;
export const PATH_LIGHT = 0xe7c68c;

/* Monument stone/gold language — same hexes as the 3D markers.tsx. */
export const STONE = '#b7bdc9';
export const STONE_DARK = '#98a1b0';
export const PEDESTAL = '#cfd4de';
export const GOLD = '#f5b73c';
export const NAVY = '#2f4f8f';
export const LOCK_RED = '#e23c3c';
/** Locked monuments collapse to two grays (markers.tsx contract). */
export const LOCK_GRAY = '#94a3b8';
export const LOCK_GRAY_SOFT = '#b6bdc7';

/* Vegetation */
export const CANOPY_DARK = 0x4f9e3c;
export const CANOPY_MAIN = 0x63b34a;
export const CANOPY_LIGHT = 0x7cc75e;
export const TRUNK = 0x8a5a33;
