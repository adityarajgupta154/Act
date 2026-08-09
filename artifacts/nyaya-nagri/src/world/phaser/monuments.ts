/**
 * Nyaya Nagri — zone monument sprites for the Phaser world (Task 25 STEP 3).
 *
 * STATE CONTRACT (unchanged from the 3D markers): `unlocked` drives the
 * color vs two-gray desaturated look, locked zones show the floating red
 * padlock, unlocked zones show the pulsing gold ring. Completed zones
 * render like unlocked ones — exactly the two visual states the 3D world
 * had. Tapping a monument is guarded by the SAME rule as the E key /
 * proximity prompt (nearby + unlocked + not already inside a zone).
 *
 * Zone 0 uses the generated painterly sprite (PoC art round); zones 1-6
 * use programmatic placeholder monuments that keep each zone's silhouette
 * identity from the 3D world (obelisk/crystal/school/courthouse/screen/
 * shield) until their art is approved and generated.
 */
import Phaser from 'phaser';
import type { ZoneDef } from '../zones';
import {
  GOLD,
  LOCK_RED,
  NAVY,
  PEDESTAL,
  STONE,
  STONE_DARK,
  U,
  px,
} from './const';

type Ctx = CanvasRenderingContext2D;

/* ------------------------- canvas mini-helpers ------------------------- */

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function outlineLast(ctx: Ctx) {
  ctx.strokeStyle = 'rgba(66, 56, 44, 0.28)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function poly(ctx: Ctx, pts: [number, number][], fill: string) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function dot(ctx: Ctx, x: number, y: number, r: number, fill: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Gold scales-of-justice glyph on a navy disc (shared emblem). */
function scalesEmblem(ctx: Ctx, cx: number, cy: number, r: number) {
  dot(ctx, cx, cy, r, NAVY);
  outlineLast(ctx);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(2, r * 0.14);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.55);
  ctx.lineTo(cx, cy + r * 0.55);
  ctx.moveTo(cx - r * 0.6, cy - r * 0.3);
  ctx.lineTo(cx + r * 0.6, cy - r * 0.3);
  ctx.stroke();
  poly(ctx, [
    [cx - r * 0.6, cy - r * 0.22],
    [cx - r * 0.82, cy + r * 0.18],
    [cx - r * 0.38, cy + r * 0.18],
  ], GOLD);
  poly(ctx, [
    [cx + r * 0.6, cy - r * 0.22],
    [cx + r * 0.38, cy + r * 0.18],
    [cx + r * 0.82, cy + r * 0.18],
  ], GOLD);
}

/** Shared stepped pedestal at the placeholder base (y 168..214). */
function pedestal(ctx: Ctx) {
  rr(ctx, 22, 196, 96, 18, 8, PEDESTAL);
  outlineLast(ctx);
  rr(ctx, 32, 182, 76, 18, 7, '#dde2ea');
  outlineLast(ctx);
  rr(ctx, 42, 168, 56, 18, 6, PEDESTAL);
  outlineLast(ctx);
}

/* --------------------- per-zone placeholder motifs ---------------------- */
/* 140x220 canvas, baseline ~y 214. Silhouettes echo the 3D markers.       */

const MOTIFS: Record<string, (ctx: Ctx) => void> = {
  zone1: (ctx) => {
    poly(ctx, [[54, 172], [86, 172], [78, 52], [62, 52]], STONE);
    outlineLast(ctx);
    poly(ctx, [[60, 54], [80, 54], [70, 28]], STONE_DARK);
    outlineLast(ctx);
    scalesEmblem(ctx, 70, 108, 20);
  },
  zone2: (ctx) => {
    poly(ctx, [[70, 30], [102, 92], [70, 154], [38, 92]], '#a855f7');
    outlineLast(ctx);
    poly(ctx, [[70, 48], [92, 92], [70, 136], [48, 92]], '#c084fc');
    poly(ctx, [[30, 132], [44, 156], [30, 178], [17, 156]], '#c084fc');
    outlineLast(ctx);
    poly(ctx, [[110, 140], [121, 158], [110, 176], [99, 158]], '#c084fc');
    outlineLast(ctx);
  },
  zone3: (ctx) => {
    rr(ctx, 30, 96, 80, 74, 6, '#f2e3c9');
    outlineLast(ctx);
    poly(ctx, [[20, 98], [120, 98], [70, 46]], '#e0704f');
    outlineLast(ctx);
    rr(ctx, 60, 128, 20, 42, 4, NAVY);
    rr(ctx, 38, 112, 16, 16, 3, '#7dd3fc');
    outlineLast(ctx);
    rr(ctx, 86, 112, 16, 16, 3, '#7dd3fc');
    outlineLast(ctx);
    dot(ctx, 70, 60, 6, GOLD);
    outlineLast(ctx);
  },
  zone4: (ctx) => {
    rr(ctx, 36, 78, 68, 86, 4, STONE);
    poly(ctx, [[24, 78], [116, 78], [70, 44]], STONE_DARK);
    outlineLast(ctx);
    rr(ctx, 26, 74, 88, 12, 4, '#e8ebf2');
    outlineLast(ctx);
    for (const cx of [36, 56, 76, 96]) {
      rr(ctx, cx, 88, 10, 80, 4, '#e8ebf2');
      outlineLast(ctx);
    }
    scalesEmblem(ctx, 70, 62, 13);
  },
  zone5: (ctx) => {
    rr(ctx, 40, 58, 60, 112, 8, STONE);
    outlineLast(ctx);
    rr(ctx, 48, 68, 44, 62, 5, '#4fc3f7');
    outlineLast(ctx);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(70, 112, 13, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(70, 112, 7, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    dot(ctx, 70, 110, 3, '#ffffff');
  },
  zone6: (ctx) => {
    rr(ctx, 40, 76, 60, 94, 6, STONE);
    outlineLast(ctx);
    ctx.beginPath();
    ctx.arc(70, 78, 30, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = STONE;
    ctx.fill();
    outlineLast(ctx);
    rr(ctx, 52, 88, 36, 34, 4, NAVY);
    poly(ctx, [[52, 118], [88, 118], [70, 140]], NAVY);
    rr(ctx, 50, 84, 40, 7, 3, GOLD);
    outlineLast(ctx);
    dot(ctx, 64, 102, 6, '#ffffff');
    dot(ctx, 76, 102, 6, '#ffffff');
    poly(ctx, [[58, 105], [82, 105], [70, 122]], '#ffffff');
  },
};

/* ----------------------------- textures --------------------------------- */

/** Bakes a grayscale sibling of any loaded texture (locked state). */
export function ensureGrayTexture(scene: Phaser.Scene, srcKey: string, grayKey: string): void {
  if (scene.textures.exists(grayKey)) return;
  const src = scene.textures.get(srcKey).getSourceImage() as
    | HTMLImageElement
    | HTMLCanvasElement;
  const tex = scene.textures.createCanvas(grayKey, src.width, src.height);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.filter = 'grayscale(1) brightness(1.07)';
  ctx.drawImage(src, 0, 0);
  ctx.filter = 'none';
  tex.refresh();
}

function ensurePlaceholderTexture(scene: Phaser.Scene, zoneId: string): string {
  const key = `monument-${zoneId}`;
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, 140, 220);
  if (!tex) return key;
  const ctx = tex.getContext();
  pedestal(ctx);
  MOTIFS[zoneId]?.(ctx);
  tex.refresh();
  return key;
}

/** Small floating padlock sprite (locked state), baked once. */
function ensureLockTexture(scene: Phaser.Scene): string {
  const key = 'lock-icon';
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, 48, 58);
  if (!tex) return key;
  const ctx = tex.getContext();
  ctx.strokeStyle = '#cfd6df';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(24, 22, 12, Math.PI, Math.PI * 2);
  ctx.stroke();
  rr(ctx, 4, 22, 40, 32, 7, LOCK_RED);
  outlineLast(ctx);
  dot(ctx, 24, 36, 4.5, GOLD);
  tex.refresh();
  return key;
}

/* ------------------------------ handles --------------------------------- */

export interface MonumentHandle {
  id: string;
  sprite: Phaser.GameObjects.Image;
  ring: Phaser.GameObjects.Ellipse;
  lock: Phaser.GameObjects.Image;
  colorKey: string;
  grayKey: string;
  displayW: number;
  displayH: number;
}

/**
 * Creates one zone monument: sprite + shadow + gold ring + padlock +
 * static collision circle (STEP 5 — new, deliberate behavior) + tap
 * handler. Returns the handle used by applyMonumentState.
 */
export function createMonument(
  scene: Phaser.Scene,
  zone: ZoneDef,
  colliders: Phaser.GameObjects.Zone[],
  onTap: (zoneId: string) => void,
): MonumentHandle {
  const cx = px(zone.position[0]);
  const cy = px(zone.position[1]);
  const isZone0 = zone.id === 'zone0';

  const colorKey = isZone0 ? 'zone0-monument' : ensurePlaceholderTexture(scene, zone.id);
  const grayKey = `${colorKey}-gray`;
  ensureGrayTexture(scene, colorKey, grayKey);
  const lockKey = ensureLockTexture(scene);

  // Baked ground shadow (sun upper-right -> shadow lower-left).
  scene.add
    .ellipse(cx - 10, cy + 8, isZone0 ? 190 : 150, isZone0 ? 56 : 46, 0x233318, 0.16)
    .setDepth(5);

  const sprite = scene.add.image(cx, cy, colorKey).setOrigin(0.5, 0.94);
  const displayW = isZone0 ? 215 : 140;
  const displayH = isZone0 ? 215 : 220;
  sprite.setDisplaySize(displayW, displayH);
  sprite.setDepth(10 + cy * 0.01);
  sprite.setInteractive({ useHandCursor: true });
  sprite.on('pointerdown', () => onTap(zone.id));

  const ring = scene.add.ellipse(cx, cy + 4, 330, 148);
  ring.setStrokeStyle(9, 0xfcd34d, 0.55);
  ring.setDepth(6);
  scene.tweens.add({
    targets: ring,
    scaleX: 1.1,
    scaleY: 1.1,
    duration: 750,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  const lock = scene.add.image(cx, cy - displayH - 26, lockKey);
  lock.setDepth(10 + cy * 0.01 + 0.06);
  scene.tweens.add({
    targets: lock,
    y: lock.y + 10,
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  // Collision body (STEP 5): a solid circle around the monument base.
  const r = 2.3 * U;
  const zoneBody = scene.add.zone(cx, cy, r * 2, r * 2);
  scene.physics.add.existing(zoneBody, true);
  (zoneBody.body as Phaser.Physics.Arcade.StaticBody).setCircle(r);
  colliders.push(zoneBody);

  return { id: zone.id, sprite, ring, lock, colorKey, grayKey, displayW, displayH };
}

/** Applies the lock/unlock visual state — same contract as the 3D world. */
export function applyMonumentState(handle: MonumentHandle, unlocked: boolean): void {
  handle.sprite.setTexture(unlocked ? handle.colorKey : handle.grayKey);
  handle.sprite.setDisplaySize(handle.displayW, handle.displayH);
  handle.ring.setVisible(unlocked);
  handle.lock.setVisible(!unlocked);
}
