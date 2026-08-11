/**
 * Nyaya Nagri — invisible circular movement boundary (Aug 2026).
 *
 * The child's reference frame draws a red dotted ring around the playable
 * village; that ring exists here ONLY as math — nothing is ever rendered.
 * (DEBUG_MAP_BOUNDARY below is the sole, dev-only exception and ships
 * false per spec: the production UI must never show the boundary.)
 *
 * Geometry: the zone ring is centred on the plaza (0,-12) — every zone
 * anchor sits 12.8..17 units from it, the story house at 16. MAP_RADIUS 20
 * clears the farthest anchor by 3 units of grass, like the reference ring
 * that passes just behind the outermost cottages. Everything is in logical
 * units (x/z in -40..40), so the boundary is world-anchored — camera and
 * viewport play no part in it.
 */

export const MAP_CENTER = { x: 0, z: -12 } as const;

/** Playable disc radius in world units — matches the reference red ring. */
export const MAP_RADIUS = 20;

/**
 * The puppet's Arcade circle is 20 px = 0.5 units; the scene constrains
 * the BODY CENTRE, so this padding keeps the entire collision circle
 * (and with it the puppet's footprint) inside MAP_RADIUS exactly.
 */
export const PLAYER_BOUNDARY_PADDING = 0.5;

/** Dev-only dashed ring; MUST stay false (spec: invisible in final UI). */
export const DEBUG_MAP_BOUNDARY = false;

const EFFECTIVE_RADIUS = MAP_RADIUS - PLAYER_BOUNDARY_PADDING;

/** True when a logical (x, z) point may host the player's center. */
export function isInsideMapBoundary(x: number, z: number): boolean {
  const dx = x - MAP_CENTER.x;
  const dz = z - MAP_CENTER.z;
  return dx * dx + dz * dz <= EFFECTIVE_RADIUS * EFFECTIVE_RADIUS;
}

/**
 * Project a PROPOSED position back onto the playable disc.
 *
 * Returns the input unchanged while it is inside. Projection onto a disc
 * is 1-Lipschitz, so the corrected step is never longer than the attempted
 * one — the puppet glides along the ring (the tangential component of the
 * move survives, the radial part is absorbed) instead of jittering,
 * snapping back, or teleporting.
 */
export function clampToMapBoundary(
  x: number,
  z: number,
): { x: number; z: number; clamped: boolean } {
  const dx = x - MAP_CENTER.x;
  const dz = z - MAP_CENTER.z;
  const distSq = dx * dx + dz * dz;
  if (distSq <= EFFECTIVE_RADIUS * EFFECTIVE_RADIUS) return { x, z, clamped: false };
  const dist = Math.sqrt(distSq);
  const s = EFFECTIVE_RADIUS / dist;
  return {
    x: MAP_CENTER.x + dx * s,
    z: MAP_CENTER.z + dz * s,
    clamped: true,
  };
}
