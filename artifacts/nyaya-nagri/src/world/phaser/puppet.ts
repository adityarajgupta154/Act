/**
 * Nyaya Nagri — 2D player puppet baker (Task 25, STEP 4).
 *
 * Bakes the walking character's textures at runtime from the SAME
 * PlayerAvatarConfig that drives the SVG avatar renderer. Illustrated
 * canvas drawing only — no photos, no image uploads (PRD §9.4); the
 * nickname is never drawn into the world.
 *
 * Avatar Builder option -> sprite layer mapping (STEP 4 requirement):
 *  - character   -> body silhouette (girl dress/kurti keep skirt shapes)
 *  - skinTone    -> head / hands / legs fill
 *  - hair        -> per-direction hair shapes (boy/girl own sets), #3B2A20
 *  - outfit      -> torso colors (same OUTFIT hexes as PlayerAvatar.tsx)
 *  - accessories -> overlays per direction: cap/crown/bow/flower on the
 *    head, glasses on the face, scarf at the neck, star/medal on the
 *    chest, backpack (straps front, pack on the back), cape behind
 *  - base        -> face (sunny smile / brave brows) on camera-facing view
 *
 * Bakes 3 directions (down/up/side) x 3 frames (idle/walkA/walkB) = 9
 * small canvases; "right" reuses side textures with flipX. Rebaked when
 * the avatar config changes. No avatar yet -> the default boy explorer
 * (blue hoodie + backpack), matching the old 3D default player.
 */
import Phaser from 'phaser';
import type { PlayerAvatarConfig } from '@/player/avatarConfig';

/** Same outfit hexes as the SVG renderer (PlayerAvatar.tsx). */
const OUTFIT_COLORS: Record<PlayerAvatarConfig['outfit'], { main: string; accent: string }> = {
  kurta: { main: '#F97316', accent: '#FFEDD5' },
  tshirt: { main: '#0EA5E9', accent: '#E0F2FE' },
  kameez: { main: '#22C55E', accent: '#DCFCE7' },
  hoodie: { main: '#8B5CF6', accent: '#EDE9FE' },
  kurti: { main: '#EC4899', accent: '#FCE7F3' },
  dress: { main: '#14B8A6', accent: '#CCFBF1' },
};

const HAIR = '#3B2A20';
const INK = '#1F2937';

interface Resolved {
  girl: boolean;
  skin: string;
  hair: PlayerAvatarConfig['hair'];
  hairColor: string;
  outfit: PlayerAvatarConfig['outfit'];
  main: string;
  accent: string;
  acc: readonly PlayerAvatarConfig['accessories'][number][];
  brave: boolean;
}

function resolve(config: PlayerAvatarConfig | null): Resolved {
  if (!config) {
    // Default boy explorer — continuity with the previous 3D default.
    return {
      girl: false,
      skin: '#f0bd8e',
      hair: 'short',
      hairColor: '#241d1a',
      outfit: 'hoodie',
      main: '#3b82f6',
      accent: '#2f6fe4',
      acc: ['backpack'],
      brave: false,
    };
  }
  const colors = OUTFIT_COLORS[config.outfit];
  return {
    girl: config.character === 'girl',
    skin: config.skinTone,
    hair: config.hair,
    hairColor: HAIR,
    outfit: config.outfit,
    main: colors.main,
    accent: colors.accent,
    acc: config.accessories,
    brave: config.base === 'brave',
  };
}

export function puppetHash(config: PlayerAvatarConfig | null): string {
  return JSON.stringify(resolve(config));
}

/* --------------------------- draw helpers ------------------------------ */

type Ctx = CanvasRenderingContext2D;

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

function dot(ctx: Ctx, x: number, y: number, r: number, fill: string, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function stroke(ctx: Ctx, pts: [number, number][], width: number, color: string) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function arc(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  a0: number,
  a1: number,
  width: number,
  color: string,
) {
  ctx.beginPath();
  ctx.arc(x, y, r, a0, a1);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function poly(ctx: Ctx, pts: [number, number][], fill: string, strokeColor?: string) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function star5(ctx: Ctx, cx: number, cy: number, r: number, fill: string, edge: string) {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  poly(ctx, pts, fill, edge);
}

/** Upper-half hair dome over the head circle (cx,cy,r). */
function hairDome(ctx: Ctx, cx: number, cy: number, r: number, color: string) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 1.02, Math.PI * 1.98);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/* ------------------------- direction painters -------------------------- */
/* Canvas is 64x80; feet baseline ~y 78; head centre (32,22) r15.         */

const has = (p: Resolved, a: PlayerAvatarConfig['accessories'][number]) => p.acc.includes(a);

function drawLegsFrontBack(ctx: Ctx, p: Resolved, phase: number) {
  const lLen = 12 + phase * 4;
  const rLen = 12 - phase * 4;
  rr(ctx, 24, 60, 7, lLen, 3, p.skin);
  rr(ctx, 33, 60, 7, rLen, 3, p.skin);
  rr(ctx, 22.5, 58 + lLen, 10, 6, 3, '#3d4a63');
  rr(ctx, 31.5, 58 + rLen, 10, 6, 3, '#3d4a63');
}

function drawTorsoFront(ctx: Ctx, p: Resolved) {
  const skirt = p.girl && (p.outfit === 'dress' || p.outfit === 'kurti');
  if (skirt) {
    poly(ctx, [[21, 40], [43, 40], [48, 64], [16, 64]], p.main);
  } else {
    rr(ctx, 20, 38, 24, 26, 7, p.main);
  }
  // Arms + hands
  rr(ctx, 15.5, 40, 5.5, 15, 2.7, p.main);
  rr(ctx, 43, 40, 5.5, 15, 2.7, p.main);
  dot(ctx, 18.2, 57.5, 2.6, p.skin);
  dot(ctx, 45.8, 57.5, 2.6, p.skin);
}

function drawOutfitAccentFront(ctx: Ctx, p: Resolved) {
  const a = p.accent;
  switch (p.outfit) {
    case 'kurta':
      stroke(ctx, [[32, 42], [32, 58]], 2, a);
      dot(ctx, 32, 45, 1.4, a);
      dot(ctx, 32, 50, 1.4, a);
      break;
    case 'tshirt':
      arc(ctx, 32, 38.5, 5.5, 0.15 * Math.PI, 0.85 * Math.PI, 2.4, a);
      break;
    case 'kameez':
      stroke(ctx, [[28, 40], [32, 47], [36, 40]], 2, a);
      break;
    case 'hoodie':
      stroke(ctx, [[28.5, 42], [28.5, 50]], 2, a);
      stroke(ctx, [[35.5, 42], [35.5, 50]], 2, a);
      rr(ctx, 27, 53, 10, 6.5, 2.5, a === '#2f6fe4' ? '#2f6fe4' : a);
      break;
    case 'kurti':
      stroke(ctx, [[28, 40], [32, 46], [36, 40]], 2, a);
      arc(ctx, 32, 51, 12, 0.2 * Math.PI, 0.8 * Math.PI, 1.8, a);
      break;
    case 'dress':
      arc(ctx, 32, 39, 5, 0.15 * Math.PI, 0.85 * Math.PI, 2.2, a);
      arc(ctx, 32, 52, 13, 0.25 * Math.PI, 0.75 * Math.PI, 1.8, a);
      break;
  }
}

function drawHairDown(ctx: Ctx, p: Resolved) {
  const c = p.hairColor;
  hairDome(ctx, 32, 21, 15.6, c);
  if (p.girl) {
    // Side panels — the girl's styles frame the face.
    rr(ctx, 15.2, 17, 5, 13, 2.5, c);
    rr(ctx, 43.8, 17, 5, 13, 2.5, c);
  }
  switch (p.hair) {
    case 'curly':
      dot(ctx, 20, 11, 5.4, c);
      dot(ctx, 32, 7.5, 6, c);
      dot(ctx, 44, 11, 5.4, c);
      break;
    case 'braids': {
      const len = p.girl ? 22 : 18;
      rr(ctx, 11.5, 22, 6, len, 3, c);
      rr(ctx, 46.5, 22, 6, len, 3, c);
      dot(ctx, 14.5, 23 + len, 2.6, '#F472B6');
      dot(ctx, 49.5, 23 + len, 2.6, '#F472B6');
      break;
    }
    case 'ponytail':
      dot(ctx, 44, 8.5, 4.4, c);
      rr(ctx, 46, 12, 5.5, 13, 2.7, c);
      dot(ctx, 44, 8.5, 1.8, '#F472B6');
      break;
    case 'bun':
      dot(ctx, 32, 4.5, 6.6, c);
      break;
    case 'short':
    default:
      break;
  }
}

function drawFaceDown(ctx: Ctx, p: Resolved) {
  dot(ctx, 26, 24, 2.3, INK);
  dot(ctx, 38, 24, 2.3, INK);
  if (p.brave) {
    stroke(ctx, [[22, 18.5], [28.5, 17.5]], 2, INK);
    stroke(ctx, [[35.5, 17.5], [42, 18.5]], 2, INK);
    arc(ctx, 32.5, 28, 4.4, 0.2 * Math.PI, 0.75 * Math.PI, 2.2, INK);
  } else {
    arc(ctx, 32, 27.5, 5, 0.15 * Math.PI, 0.85 * Math.PI, 2.2, INK);
  }
  if (p.girl) {
    stroke(ctx, [[22.5, 22], [20.5, 21]], 1.4, INK);
    stroke(ctx, [[41.5, 22], [43.5, 21]], 1.4, INK);
  }
  dot(ctx, 21.5, 28.5, 2, '#F87171', 0.3);
  dot(ctx, 42.5, 28.5, 2, '#F87171', 0.3);
}

function drawDown(ctx: Ctx, p: Resolved, phase: number) {
  if (has(p, 'cape')) {
    rr(ctx, 13.5, 39, 37, 27, 8, '#DC2626');
  }
  drawLegsFrontBack(ctx, p, phase);
  drawTorsoFront(ctx, p);
  drawOutfitAccentFront(ctx, p);
  if (has(p, 'backpack')) {
    stroke(ctx, [[24, 40], [24, 58]], 3, '#7C5E3C');
    stroke(ctx, [[40, 40], [40, 58]], 3, '#7C5E3C');
  }
  if (has(p, 'scarf')) {
    rr(ctx, 21, 35.5, 22, 7, 3.5, '#FACC15');
    rr(ctx, 33, 41, 6.5, 10, 3, '#EAB308');
  }
  if (has(p, 'star')) star5(ctx, 25, 47, 5, '#FDE047', '#F59E0B');
  if (has(p, 'medal')) {
    poly(ctx, [[39, 41], [44, 41], [41.5, 48]], '#3B82F6');
    dot(ctx, 41.5, 50, 3.8, '#FBBF24');
    dot(ctx, 41.5, 50, 1.6, '#FDE68A');
  }
  dot(ctx, 32, 22, 15, p.skin);
  drawHairDown(ctx, p);
  drawFaceDown(ctx, p);
  if (has(p, 'glasses')) {
    ctx.globalAlpha = 0.35;
    dot(ctx, 26, 24, 5, '#ffffff');
    dot(ctx, 38, 24, 5, '#ffffff');
    ctx.globalAlpha = 1;
    arc(ctx, 26, 24, 5, 0, Math.PI * 2, 1.8, '#334155');
    arc(ctx, 38, 24, 5, 0, Math.PI * 2, 1.8, '#334155');
    stroke(ctx, [[31, 24], [33, 24]], 1.8, '#334155');
  }
  if (has(p, 'cap')) {
    ctx.beginPath();
    ctx.arc(32, 19, 15.8, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#0284C7';
    ctx.fill();
    rr(ctx, 13, 16.5, 38, 5.5, 2.7, '#0369A1');
    dot(ctx, 32, 4, 1.4, '#0369A1');
  }
  if (has(p, 'flower')) {
    dot(ctx, 15, 12, 2.7, '#F472B6');
    dot(ctx, 20, 12, 2.7, '#F472B6');
    dot(ctx, 17.5, 9.5, 2.7, '#F472B6');
    dot(ctx, 17.5, 14.5, 2.7, '#F472B6');
    dot(ctx, 17.5, 12, 2, '#FDE047');
  }
  if (has(p, 'crown')) {
    poly(
      ctx,
      [[21, 9], [22.5, 1.5], [27, 6], [32, 0.5], [37, 6], [41.5, 1.5], [43, 9]],
      '#FBBF24',
      '#D97706',
    );
    dot(ctx, 32, 4, 1.7, '#F87171');
  }
  if (has(p, 'bow')) {
    poly(ctx, [[46, 12], [53, 8], [53, 16]], '#F472B6', '#DB2777');
    poly(ctx, [[46, 12], [40, 7], [42, 15]], '#F472B6', '#DB2777');
    dot(ctx, 46, 12, 2.2, '#FDE047');
  }
}

function drawUp(ctx: Ctx, p: Resolved, phase: number) {
  drawLegsFrontBack(ctx, p, phase);
  const skirt = p.girl && (p.outfit === 'dress' || p.outfit === 'kurti');
  if (skirt) {
    poly(ctx, [[21, 40], [43, 40], [48, 64], [16, 64]], p.main);
  } else {
    rr(ctx, 20, 38, 24, 26, 7, p.main);
  }
  rr(ctx, 15.5, 40, 5.5, 15, 2.7, p.main);
  rr(ctx, 43, 40, 5.5, 15, 2.7, p.main);
  dot(ctx, 18.2, 57.5, 2.6, p.skin);
  dot(ctx, 45.8, 57.5, 2.6, p.skin);
  if (has(p, 'cape')) {
    rr(ctx, 16.5, 37, 31, 29, 8, '#DC2626');
    rr(ctx, 18.5, 39, 27, 25, 6, '#EF4444');
  }
  if (has(p, 'scarf')) {
    rr(ctx, 25, 38, 5.5, 13, 2.7, '#FACC15');
    rr(ctx, 33, 39.5, 5.5, 11, 2.7, '#EAB308');
  }
  if (has(p, 'backpack')) {
    rr(ctx, 22, 40, 20, 20, 5, '#F5A623');
    rr(ctx, 22, 40, 20, 7, 4, '#E0951C');
    dot(ctx, 32, 52, 2.2, '#E0951C');
  }
  dot(ctx, 32, 22, 15, p.skin);
  // Back of the head — full hair cover.
  const c = p.hairColor;
  dot(ctx, 32, 20.5, 15.3, c);
  switch (p.hair) {
    case 'curly':
      dot(ctx, 20, 11, 5.4, c);
      dot(ctx, 32, 7.5, 6, c);
      dot(ctx, 44, 11, 5.4, c);
      dot(ctx, 17, 21, 4.6, c);
      dot(ctx, 47, 21, 4.6, c);
      break;
    case 'braids': {
      const len = p.girl ? 24 : 19;
      rr(ctx, 12.5, 22, 6, len, 3, c);
      rr(ctx, 45.5, 22, 6, len, 3, c);
      dot(ctx, 15.5, 23 + len, 2.6, '#F472B6');
      dot(ctx, 48.5, 23 + len, 2.6, '#F472B6');
      break;
    }
    case 'ponytail':
      dot(ctx, 32, 9, 4.6, c);
      dot(ctx, 32, 9, 2, '#F472B6');
      rr(ctx, 28.5, 12, 7, 32, 3.5, c);
      dot(ctx, 32, 46, 3.4, c);
      break;
    case 'bun':
      dot(ctx, 32, 5, 7, c);
      break;
    case 'short':
    default:
      break;
  }
  if (has(p, 'glasses')) {
    stroke(ctx, [[17.5, 22], [21.5, 21.5]], 1.8, '#334155');
    stroke(ctx, [[46.5, 22], [42.5, 21.5]], 1.8, '#334155');
  }
  if (has(p, 'cap')) {
    ctx.beginPath();
    ctx.arc(32, 19, 15.8, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#0284C7';
    ctx.fill();
    rr(ctx, 17, 17.5, 30, 4, 2, '#0369A1');
    dot(ctx, 32, 4, 1.4, '#0369A1');
  }
  if (has(p, 'flower')) {
    dot(ctx, 15, 12, 2.7, '#F472B6');
    dot(ctx, 20, 12, 2.7, '#F472B6');
    dot(ctx, 17.5, 9.5, 2.7, '#F472B6');
    dot(ctx, 17.5, 14.5, 2.7, '#F472B6');
    dot(ctx, 17.5, 12, 2, '#FDE047');
  }
  if (has(p, 'crown')) {
    poly(
      ctx,
      [[21, 9], [22.5, 1.5], [27, 6], [32, 0.5], [37, 6], [41.5, 1.5], [43, 9]],
      '#FBBF24',
      '#D97706',
    );
  }
  if (has(p, 'bow')) {
    poly(ctx, [[44, 14], [52, 9], [52, 19]], '#F472B6', '#DB2777');
    poly(ctx, [[44, 14], [36, 9], [36, 19]], '#F472B6', '#DB2777');
    dot(ctx, 44, 14, 2.4, '#FDE047');
  }
}

/** Side view faces LEFT; the right facing flips this texture at runtime. */
function drawSide(ctx: Ctx, p: Resolved, phase: number) {
  // Stride: legs swing horizontally.
  const front = 26 - phase * 4;
  const back = 32 + phase * 4;
  rr(ctx, front, 60, 7, 13, 3, p.skin);
  rr(ctx, back, 60, 7, 13, 3, p.skin);
  rr(ctx, front - 2.5, 67.5, 11, 6, 3, '#3d4a63');
  rr(ctx, back - 1, 67.5, 10, 6, 3, '#3d4a63');
  if (has(p, 'cape')) {
    poly(ctx, [[38, 40], [48, 44], [50, 66], [38, 64]], '#DC2626');
  }
  const skirt = p.girl && (p.outfit === 'dress' || p.outfit === 'kurti');
  if (skirt) {
    poly(ctx, [[25, 40], [40, 40], [44, 64], [21, 64]], p.main);
  } else {
    rr(ctx, 23, 38, 19, 26, 6, p.main);
  }
  if (has(p, 'backpack')) {
    rr(ctx, 38, 41, 10.5, 19, 4, '#F5A623');
    rr(ctx, 38, 41, 10.5, 6.5, 3.5, '#E0951C');
    stroke(ctx, [[30, 40], [30, 58]], 3, '#7C5E3C');
  }
  if (has(p, 'scarf')) {
    rr(ctx, 24, 36, 17, 6.5, 3.2, '#FACC15');
    rr(ctx, 37, 41, 6, 11, 3, '#EAB308');
  }
  if (has(p, 'star')) star5(ctx, 26, 47, 3.8, '#FDE047', '#F59E0B');
  if (has(p, 'medal')) dot(ctx, 26, 49, 3, '#FBBF24');
  // One visible arm.
  rr(ctx, 28, 42, 6, 14.5, 3, p.main);
  dot(ctx, 31, 58, 2.6, p.skin);
  // Head.
  dot(ctx, 30, 22, 15, p.skin);
  const c = p.hairColor;
  hairDome(ctx, 30, 21, 15.6, c);
  dot(ctx, 38, 22, 12, c); // back-of-head mass
  switch (p.hair) {
    case 'curly':
      dot(ctx, 20, 12, 5, c);
      dot(ctx, 31, 7.5, 6, c);
      dot(ctx, 41, 11, 5.2, c);
      dot(ctx, 45, 19, 4.6, c);
      break;
    case 'braids': {
      const len = p.girl ? 22 : 18;
      rr(ctx, 41.5, 24, 6, len, 3, c);
      dot(ctx, 44.5, 25 + len, 2.6, '#F472B6');
      break;
    }
    case 'ponytail':
      dot(ctx, 43, 9.5, 4.4, c);
      dot(ctx, 43, 9.5, 1.8, '#F472B6');
      rr(ctx, 44, 13, 6.5, 26, 3.2, c);
      dot(ctx, 47, 40, 3.2, c);
      break;
    case 'bun':
      dot(ctx, 35, 4.5, 6.6, c);
      break;
    case 'short':
    default:
      rr(ctx, 41, 18, 5.5, 10, 2.7, c);
      break;
  }
  // Face profile (single eye).
  dot(ctx, 21.5, 24, 2.3, INK);
  if (p.brave) stroke(ctx, [[17.5, 18.5], [24.5, 17.5]], 2, INK);
  arc(ctx, 19, 28.5, 3.4, 0.25 * Math.PI, 0.8 * Math.PI, 2, INK);
  if (p.girl) stroke(ctx, [[18.5, 22], [16.5, 21]], 1.4, INK);
  dot(ctx, 18, 29.5, 1.8, '#F87171', 0.3);
  if (has(p, 'glasses')) {
    ctx.globalAlpha = 0.35;
    dot(ctx, 21.5, 24, 5, '#ffffff');
    ctx.globalAlpha = 1;
    arc(ctx, 21.5, 24, 5, 0, Math.PI * 2, 1.8, '#334155');
    stroke(ctx, [[26.5, 23], [38, 21.5]], 1.8, '#334155');
  }
  if (has(p, 'cap')) {
    ctx.beginPath();
    ctx.arc(31, 19, 15.5, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#0284C7';
    ctx.fill();
    rr(ctx, 7, 16.5, 26, 5.5, 2.7, '#0369A1');
  }
  if (has(p, 'flower')) {
    dot(ctx, 24, 10, 2.5, '#F472B6');
    dot(ctx, 28.5, 10, 2.5, '#F472B6');
    dot(ctx, 26.2, 7.8, 2.5, '#F472B6');
    dot(ctx, 26.2, 12.2, 2.5, '#F472B6');
    dot(ctx, 26.2, 10, 1.8, '#FDE047');
  }
  if (has(p, 'crown')) {
    poly(
      ctx,
      [[20, 9], [21.5, 1.5], [26, 6], [31, 0.5], [36, 6], [40.5, 1.5], [42, 9]],
      '#FBBF24',
      '#D97706',
    );
  }
  if (has(p, 'bow')) {
    poly(ctx, [[43, 13], [50, 9], [50, 17]], '#F472B6', '#DB2777');
    dot(ctx, 43, 13, 2, '#FDE047');
  }
}

/* ------------------------------ baking --------------------------------- */

export const PUPPET_W = 64;
export const PUPPET_H = 80;
export const PUPPET_DIRS = ['down', 'up', 'side'] as const;
export type PuppetDir = (typeof PUPPET_DIRS)[number];
export const PUPPET_FRAMES = [0, 1, -1] as const; // idle, walkA, walkB

export const puppetKey = (dir: PuppetDir, frameIndex: number) => `puppet-${dir}-${frameIndex}`;

const PAINTERS: Record<PuppetDir, (ctx: Ctx, p: Resolved, phase: number) => void> = {
  down: drawDown,
  up: drawUp,
  side: drawSide,
};

/**
 * (Re)bakes all 9 puppet textures for the given avatar config.
 * Safe to call again with a new config — existing textures are replaced.
 */
export function bakePuppetTextures(
  scene: Phaser.Scene,
  config: PlayerAvatarConfig | null,
): void {
  const resolved = resolve(config);
  for (const dir of PUPPET_DIRS) {
    for (let f = 0; f < PUPPET_FRAMES.length; f++) {
      const key = puppetKey(dir, f);
      if (scene.textures.exists(key)) scene.textures.remove(key);
      const tex = scene.textures.createCanvas(key, PUPPET_W, PUPPET_H);
      if (!tex) continue;
      const ctx = tex.getContext();
      ctx.clearRect(0, 0, PUPPET_W, PUPPET_H);
      PAINTERS[dir](ctx, resolved, PUPPET_FRAMES[f]);
      tex.refresh();
    }
  }
}
