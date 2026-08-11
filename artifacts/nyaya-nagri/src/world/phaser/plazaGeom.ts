/**
 * Nyaya Nagri — plaza-disc geometry (Phaser-free on purpose).
 *
 * The ONE definition of the central plaza's footprint, shared by the road
 * network (hub exclusion + rim starts) and by smokes (engine.smoke runs
 * under tsx with no browser, so this module must never import Phaser).
 *
 * plaza-disc.png renders native (384x316) centered on PLAZA -> half
 * extents in units. LOCKSTEP RULE: any plaza-disc.png art swap that
 * changes dimensions must update these two constants, or lane starts
 * show seams / floating gaps at the junction.
 */
import { PLAZA } from './const';

export const PLAZA_RX = 4.8;
export const PLAZA_RZ = 3.95;

/**
 * Strictly inside the plaza ELLIPSE (not a circle — rz < rx): such a
 * location IS the hub, so it gets no road (zone0's pedestal). A point
 * exactly ON the rim or anywhere outside is connectable — a rim lane
 * degenerates to segments hidden under the disc (lanes draw at depth
 * 0.5, the disc at 0.6), which is harmless by construction.
 *
 * Deliberate boundary choice (Aug 10 2026 realignment review): the old
 * Euclidean `dist <= PLAZA_RX` test wrongly swallowed locations placed
 * just past the minor axis (e.g. z offset 4.1 < 4.8 above the plaza),
 * breaking the "new location in zones.ts auto-connects" contract.
 */
export function isInsidePlazaDisc(x: number, z: number): boolean {
  const nx = (x - PLAZA.x) / PLAZA_RX;
  const nz = (z - PLAZA.z) / PLAZA_RZ;
  return nx * nx + nz * nz < 1;
}
