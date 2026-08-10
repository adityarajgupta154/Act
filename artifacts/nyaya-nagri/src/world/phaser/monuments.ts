/**
 * Nyaya Nagri — zone monument sprites for the Phaser world.
 *
 * Reference-art rebuild (Aug 2026 "same to same" round): every monument is
 * a painterly cutout from the child's own reference painting (feathered
 * vignette carrying its grass halo), rendered at NATIVE size — 1 crop px =
 * 1 world px, because the reference frame depicts the village at the same
 * scale the world uses (U = 40 px/unit).
 *
 * STATE CONTRACT (visual-only change agreed in this round): LOCKED zones
 * keep their full-color art and show the red padlock badge sitting on the
 * monument's lower body — exactly like the reference frame — instead of
 * the old two-gray desaturation. UNLOCKED zones lose the padlock and gain
 * the pulsing gold ring; completed zones render like unlocked ones. The
 * tap guard chain (nearby + unlocked + not inside a zone) is unchanged.
 */
import Phaser from 'phaser';
import type { ZoneDef } from '../zones';
import { GOLD, LOCK_RED, U, px } from './const';

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

function dot(ctx: Ctx, x: number, y: number, r: number, fill: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/* ------------------------------ zone art -------------------------------- */

/**
 * zoneId -> reference cutout (Phaser texture key + native crop size).
 * Thematic mapping from the canon PRD zone names to the reference
 * monuments: golden pedestal = the constitution book (Know Yourself),
 * cottage = a safe home (Safe Zone), crystal = precious childhood,
 * wishing well = the well of knowledge (School Rights), obelisk carries
 * the scales of justice (Justice System Simulator), the heart stone =
 * kindness online (Digital Safety), and the people-shield slab = the
 * community that protects (Family & Community Shield).
 */
const ZONE_ART: Record<string, { key: string; w: number; h: number }> = {
  zone0: { key: 'monument-pedestal', w: 170, h: 240 },
  zone1: { key: 'monument-cottage', w: 177, h: 169 },
  zone2: { key: 'monument-crystal', w: 158, h: 186 },
  zone3: { key: 'monument-well', w: 200, h: 159 },
  zone4: { key: 'monument-obelisk', w: 169, h: 270 },
  zone5: { key: 'monument-kindness', w: 168, h: 226 },
  zone6: { key: 'monument-shield', w: 176, h: 196 },
};

/**
 * Zone label pill colors, matched to the reference frame's pills (deep
 * jewel tones on white text). zone0's plaza pedestal carries no pill —
 * the objective banner already names it.
 */
const LABEL_COLORS: Record<string, number> = {
  zone1: 0xb45410, // cottage — warm ochre
  zone2: 0x7b2fb5, // crystal — purple
  zone3: 0x6d28a8, // well — violet
  zone4: 0x5b21b6, // obelisk — royal purple
  zone5: 0xc02867, // heart stone — magenta
  zone6: 0x1f3a63, // shield — navy
};

/** Ring monuments standing on a gray cobble pad in the reference (all but
 * the plaza pedestal and the grass-set cottage). */
const PAD_ZONES = new Set(['zone2', 'zone3', 'zone4', 'zone5', 'zone6']);

/** Draws/redraws the rounded label pill behind a monument's name text. */
function drawLabelPill(
  g: Phaser.GameObjects.Graphics,
  text: Phaser.GameObjects.Text,
  cx: number,
  cy: number,
  color: number,
): void {
  const w = text.width + 26;
  const h = text.height + 12;
  g.clear();
  g.fillStyle(0x1c2413, 0.22);
  g.fillRoundedRect(cx - w / 2, cy - h / 2 + 2.5, w, h, h / 2);
  g.fillStyle(color, 0.96);
  g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, h / 2);
}

/** Padlock badge (locked state) in the reference style: white shackle,
 * red rounded body, small keyhole. Baked once. */
function ensureLockTexture(scene: Phaser.Scene): string {
  const key = 'lock-icon';
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, 48, 58);
  if (!tex) return key;
  const ctx = tex.getContext();
  ctx.strokeStyle = '#f4f6f9';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(24, 22, 12, Math.PI, Math.PI * 2);
  ctx.stroke();
  rr(ctx, 4, 22, 40, 32, 9, LOCK_RED);
  outlineLast(ctx);
  dot(ctx, 24, 35, 5, '#ffffff');
  rr(ctx, 21.5, 37, 5, 9, 2.5, '#ffffff');
  void GOLD; // palette imported for future accents; keyhole is white like the reference
  tex.refresh();
  return key;
}

/* ------------------------------ handles --------------------------------- */

export interface MonumentHandle {
  id: string;
  sprite: Phaser.GameObjects.Image;
  ring: Phaser.GameObjects.Ellipse;
  lock: Phaser.GameObjects.Image;
  /** Label pill parts (null for zone0 — the plaza carries no pill). */
  labelG: Phaser.GameObjects.Graphics | null;
  labelText: Phaser.GameObjects.Text | null;
  labelColor: number;
  labelY: number;
  displayW: number;
  displayH: number;
}

/**
 * Creates one zone monument: cutout sprite + baked shadow + gold ring +
 * padlock badge + static collision circle + tap handler. Returns the
 * handle used by applyMonumentState.
 */
export function createMonument(
  scene: Phaser.Scene,
  zone: ZoneDef,
  colliders: Phaser.GameObjects.Zone[],
  onTap: (zoneId: string) => void,
  label: string,
): MonumentHandle {
  const cx = px(zone.position[0]);
  const cy = px(zone.position[1]);
  const art = ZONE_ART[zone.id] ?? ZONE_ART.zone0;
  const lockKey = ensureLockTexture(scene);
  const hasPad = PAD_ZONES.has(zone.id);

  // Gray cobble pad under the ring monuments (reference frame look).
  if (hasPad) {
    const padW = art.w * 1.5;
    scene.add
      .image(cx, cy - 2, 'stone-pad')
      .setDisplaySize(padW, padW * 0.46)
      .setDepth(0.92);
  }

  // Baked ground shadow (sun upper-right -> shadow lower-left).
  scene.add
    .ellipse(cx - 10, cy + 8, art.w * 0.92, art.w * 0.27, 0x233318, 0.16)
    .setDepth(5);

  // Native-size cutout: the vignette's grass halo blends into the plate.
  const sprite = scene.add.image(cx, cy, art.key).setOrigin(0.5, 0.94);
  sprite.setDepth(10 + cy * 0.01);
  sprite.setInteractive({ useHandCursor: true });
  sprite.on('pointerdown', () => onTap(zone.id));

  const ring = scene.add.ellipse(cx, cy + 2, art.w * 1.35, art.w * 0.62);
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

  // The padlock sits at the monument's base — on the front of its pad —
  // like the new reference frame, with a gentle bob.
  const lock = scene.add.image(cx, cy - 10, lockKey);
  lock.setDepth(10 + cy * 0.01 + 0.06);
  scene.tweens.add({
    targets: lock,
    y: lock.y + 4,
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  // Reference-style name pill floating under the monument (skipped for
  // zone0 — the plaza pedestal is named by the objective banner instead).
  const labelColor = LABEL_COLORS[zone.id];
  const labelY = hasPad ? cy - 2 + art.w * 0.345 + 24 : cy + 52;
  let labelG: Phaser.GameObjects.Graphics | null = null;
  let labelText: Phaser.GameObjects.Text | null = null;
  if (labelColor !== undefined) {
    labelText = scene.add
      .text(cx, labelY, label, {
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: '17px',
        fontStyle: '600',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(501);
    labelG = scene.add.graphics().setDepth(500);
    drawLabelPill(labelG, labelText, cx, labelY, labelColor);
  }

  // Collision body: a solid circle around the monument base (unchanged).
  const r = 2.3 * U;
  const zoneBody = scene.add.zone(cx, cy, r * 2, r * 2);
  scene.physics.add.existing(zoneBody, true);
  (zoneBody.body as Phaser.Physics.Arcade.StaticBody).setCircle(r);
  colliders.push(zoneBody);

  return {
    id: zone.id,
    sprite,
    ring,
    lock,
    labelG,
    labelText,
    labelColor: labelColor ?? 0,
    labelY,
    displayW: art.w,
    displayH: art.h,
  };
}

/** Applies the lock/unlock visual state — full-color art either way;
 * locked = padlock badge, unlocked = pulsing gold ring. */
export function applyMonumentState(handle: MonumentHandle, unlocked: boolean): void {
  handle.ring.setVisible(unlocked);
  handle.lock.setVisible(!unlocked);
}

/** Swaps the label text (language switch) and refits its pill. */
export function setMonumentLabel(handle: MonumentHandle, label: string): void {
  if (!handle.labelText || !handle.labelG) return;
  handle.labelText.setText(label);
  drawLabelPill(
    handle.labelG,
    handle.labelText,
    handle.labelText.x,
    handle.labelY,
    handle.labelColor,
  );
}
