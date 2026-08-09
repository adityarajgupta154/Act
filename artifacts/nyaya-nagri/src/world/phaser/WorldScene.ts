/**
 * Nyaya Nagri — the illustrated 2D world scene (Task 25 engine migration).
 *
 * BEHAVIOR CONTRACT — replicated 1:1 from the 3D Player.tsx/Scene.tsx:
 *  - logical coordinates: x/z in -40..40, zone anchors from zones.ts
 *  - speed 12 units/s; joystick overrides keys when active; WASD/arrows
 *  - E interacts ONLY when nearby + unlocked + not inside a zone
 *  - proximity: first zone (in ZONES order) with dist^2 < 36
 *  - movement freezes while a zone is open or a transition runs
 *  - playerPosition {x,z} mirrored every frame for the minimap (STEP 8:
 *    the minimap needs zero changes because the logical space is identical)
 * NEW (explicitly requested by STEP 5): collision bounds — world edges,
 * monuments, and large scenery now block the player.
 */
import Phaser from 'phaser';
import { ZONES, getZoneStates } from '../zones';
import { uiStore, playerPosition, enterZone } from '@/ui/uiStore';
import { progressStore } from '@/data/progressStore';
import {
  CANOPY_DARK,
  CANOPY_LIGHT,
  CANOPY_MAIN,
  GRASS_BASE,
  GRASS_DARK,
  GRASS_LIGHT,
  PATH_EDGE,
  PATH_LIGHT,
  PATH_MAIN,
  PROXIMITY_SQ,
  SPEED_UNITS,
  TRUNK,
  U,
  WORLD_PX,
  ZONE0_TILE,
  px,
  toUnit,
} from './const';
import {
  MonumentHandle,
  applyMonumentState,
  createMonument,
} from './monuments';
import {
  PUPPET_H,
  PUPPET_W,
  PuppetDir,
  bakePuppetTextures,
  puppetHash,
  puppetKey,
} from './puppet';

interface JoystickRefLike {
  current: { x: number; y: number; active: boolean };
}

interface SceneData {
  joystickRef: JoystickRefLike;
  territoryUrl: string;
  monumentUrl: string;
}

/**
 * Solid scenery painted INTO the zone0 territory art, expressed as logical
 * circles (STEP 5). Positions were measured off the generated painting
 * (image fractions -> tile space); the corridor along the painted path at
 * x ~ 3.5 stays open on purpose.
 */
const ZONE0_ART_COLLIDERS: Array<{ x: number; z: number; r: number }> = [
  { x: -5.7, z: -18.6, r: 1.5 }, // wishing well
  { x: 4.8, z: -21.7, r: 2.2 }, // orange-roof cottage
  { x: 9.9, z: -13.7, r: 2.2 }, // blue-roof cottage
  { x: -8.7, z: -10.2, r: 2.2 }, // yellow-roof cottage
  { x: -0.8, z: -24.2, r: 2.2 }, // north tree cluster
  { x: -10.4, z: -17.2, r: 2.2 }, // west tree cluster
  { x: 8.4, z: -20.0, r: 2.0 }, // north-east trees
  { x: -2.2, z: -4.0, r: 2.0 }, // south shrubs (left of the path gap)
  { x: 1.4, z: -2.9, r: 1.6 }, // south shrubs (right)
  { x: 6.2, z: -9.6, r: 1.4 }, // flower fence
];

/** Decorative placeholder planting for zones 1-6 (deterministic offsets). */
const DECOR_TREES: Array<[number, number, number]> = [
  [-7, 1, 1], [6, 3, 0.85], [-4, -6, 1], [7, -4, 0.9],
];
const DECOR_BUSHES: Array<[number, number]> = [[-5, 5], [4, -2]];
const DECOR_FLOWERS: Array<[number, number]> = [[-2, 4], [3, 6], [-7, -2]];

/** Border forest ring (decor + collision) enclosing the walkable world. */
const BORDER_TREES: Array<[number, number, number]> = [
  [-34, -34, 1.1], [-20, -37, 0.9], [12, -37, 1], [30, -35, 0.95], [38, -22, 1.05],
  [38, 6, 0.9], [36, 33, 1.1], [16, 37, 0.9], [-12, 38, 1], [-30, 34, 0.95],
  [-38, 14, 1.05], [-38, -8, 0.9],
];

export class WorldScene extends Phaser.Scene {
  private joy!: JoystickRefLike;
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private monuments: MonumentHandle[] = [];
  private colliders: Phaser.GameObjects.Zone[] = [];
  private keys = { forward: false, back: false, left: false, right: false };
  private facing: PuppetDir = 'down';
  /** Scale-manager resize handler, retained so cleanup() can unregister it. */
  private onScaleResize: ((size: Phaser.Structs.Size) => void) | null = null;
  private flipX = false;
  private walkTime = 0;
  private moving = false;
  private frameIndex = 0;
  private avatarHash = '';
  private unsubProgress: (() => void) | null = null;
  private keyHandlers: Array<[string, (e: Event) => void]> = [];

  constructor() {
    super('world');
  }

  init(data: SceneData) {
    this.joy = data.joystickRef;
  }

  preload() {
    const data = this.sys.settings.data as unknown as SceneData;
    this.load.image('zone0-territory', data.territoryUrl);
    this.load.image('zone0-monument', data.monumentUrl);
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_PX, WORLD_PX);

    this.buildGround();
    this.buildPaths();
    this.buildZone0Territory();
    this.buildPlaceholderTerritories();
    this.buildBorderForest();
    this.buildMonuments();
    this.buildPlayer();
    this.setupCamera();
    this.setupInput();

    // Zone lock states now + on every progress change (zone completion,
    // avatar edits...). Same data source as the 3D world: getZoneStates().
    this.applyZoneStates();
    this.avatarHash = puppetHash(progressStore.getState().avatar);
    this.unsubProgress = progressStore.subscribe(() => {
      this.applyZoneStates();
      const nextHash = puppetHash(progressStore.getState().avatar);
      if (nextHash !== this.avatarHash) {
        this.avatarHash = nextHash;
        bakePuppetTextures(this, progressStore.getState().avatar);
        this.player.setTexture(puppetKey(this.facing, this.frameIndex));
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());
  }

  /* ------------------------------ world build --------------------------- */

  private buildGround() {
    this.add
      .rectangle(WORLD_PX / 2, WORLD_PX / 2, WORLD_PX, WORLD_PX, GRASS_BASE)
      .setDepth(0);
    // Soft painterly meadow patches.
    const g = this.add.graphics().setDepth(1);
    const patches: Array<[number, number, number, number, number, number]> = [
      [-26, -24, 9, 6, GRASS_LIGHT, 0.35], [22, -22, 8, 5.5, GRASS_DARK, 0.25],
      [-24, 8, 10, 7, GRASS_DARK, 0.22], [26, 10, 9, 6, GRASS_LIGHT, 0.32],
      [-8, 30, 11, 7, GRASS_LIGHT, 0.3], [12, 32, 8, 5, GRASS_DARK, 0.22],
      [0, -34, 12, 6, GRASS_LIGHT, 0.28], [-34, -6, 7, 5, GRASS_LIGHT, 0.3],
      [34, -4, 7, 5, GRASS_DARK, 0.2], [8, 12, 9, 6, GRASS_LIGHT, 0.25],
      [-14, -30, 6, 4, GRASS_DARK, 0.2], [30, 26, 7, 4.5, GRASS_LIGHT, 0.3],
      // Blend the Zone 0 territory tile borders into the meadow (art fades to
      // pale green; these lighten the surrounding flat ground to match).
      [-10, 3, 7, 4, GRASS_LIGHT, 0.32], [-3, 2.5, 6, 3.5, GRASS_LIGHT, 0.26],
      [4, 3.5, 7, 4, GRASS_LIGHT, 0.3], [11, 2.5, 6, 3.5, GRASS_LIGHT, 0.28],
      [-16, -3, 5, 6, GRASS_LIGHT, 0.24], [16, -4, 5, 6, GRASS_LIGHT, 0.24],
    ];
    for (const [ux, uz, rx, rz, color, alpha] of patches) {
      g.fillStyle(color, alpha);
      g.fillEllipse(px(ux), px(uz), rx * 2 * U, rz * 2 * U);
    }
  }

  /**
   * Dirt paths from the spawn hub to zones 1-6 (zone 0's approach is
   * painted in its territory art). Drawn UNDER the territory tile so the
   * painted village takes over where the art begins.
   */
  private buildPaths() {
    const g = this.add.graphics().setDepth(2);
    const hub = { x: px(0), y: px(0) };
    ZONES.forEach((zone, i) => {
      if (zone.id === 'zone0') return;
      const end = { x: px(zone.position[0]), y: px(zone.position[1]) };
      const mx = (hub.x + end.x) / 2;
      const my = (hub.y + end.y) / 2;
      const dx = end.x - hub.x;
      const dy = end.y - hub.y;
      const len = Math.hypot(dx, dy) || 1;
      const sign = i % 2 === 0 ? 1 : -1;
      const bend = {
        x: mx + (-dy / len) * len * 0.14 * sign,
        y: my + (dx / len) * len * 0.14 * sign,
      };
      const layers: Array<[number, number]> = [
        [U * 1.7, PATH_EDGE],
        [U * 1.25, PATH_MAIN],
      ];
      for (const [width, color] of layers) {
        g.lineStyle(width, color, 1);
        g.beginPath();
        g.moveTo(hub.x, hub.y);
        g.lineTo(bend.x, bend.y);
        g.lineTo(end.x, end.y);
        g.strokePath();
        g.fillStyle(color, 1);
        g.fillCircle(bend.x, bend.y, width / 2);
        g.fillCircle(end.x, end.y, width / 2);
      }
      // Cobble pad where each placeholder monument stands.
      g.fillStyle(0xd6cdb8, 1);
      g.fillEllipse(end.x, end.y + 8, 7 * U, 4.6 * U);
      g.fillStyle(0xe4dcc9, 0.8);
      g.fillEllipse(end.x, end.y + 6, 5.6 * U, 3.6 * U);
    });
  }

  private buildZone0Territory() {
    const size = ZONE0_TILE.size * U;
    this.add
      .image(px(ZONE0_TILE.x), px(ZONE0_TILE.z), 'zone0-territory')
      .setOrigin(0, 0)
      .setDisplaySize(size, size)
      .setDepth(3);
    // Trailhead pad where the child spawns (over the tile's faded edge).
    const g = this.add.graphics().setDepth(4);
    g.fillStyle(PATH_MAIN, 0.9);
    g.fillEllipse(px(0), px(0), 5.2 * U, 3.4 * U);
    g.fillStyle(PATH_LIGHT, 0.75);
    g.fillEllipse(px(0), px(0), 3.9 * U, 2.4 * U);
    // Solid circles for the big props painted into the art (STEP 5).
    for (const c of ZONE0_ART_COLLIDERS) {
      this.addStaticCircle(px(c.x), px(c.z), c.r * U);
    }
  }

  /**
   * Zones 1-6 pending their own generated paintings (this round is the
   * Zone 0 proof of concept): each gets palette-matched ground patches and
   * simple planted decor so the whole map stays walkable and every
   * monument keeps its full behavior.
   */
  private buildPlaceholderTerritories() {
    const g = this.add.graphics().setDepth(1);
    for (const zone of ZONES) {
      if (zone.id === 'zone0') continue;
      const cx = px(zone.position[0]);
      const cy = px(zone.position[1]);
      g.fillStyle(GRASS_LIGHT, 0.4);
      g.fillEllipse(cx, cy, 19 * U, 13 * U);
      g.fillStyle(GRASS_DARK, 0.18);
      g.fillEllipse(cx + 2 * U, cy + U, 13 * U, 8 * U);
      for (const [ox, oz, s] of DECOR_TREES) {
        this.addTree(cx + ox * U, cy + oz * U, s, true);
      }
      for (const [ox, oz] of DECOR_BUSHES) this.addBush(cx + ox * U, cy + oz * U);
      DECOR_FLOWERS.forEach(([ox, oz], i) => this.addFlower(cx + ox * U, cy + oz * U, i));
    }
  }

  private buildBorderForest() {
    for (const [ux, uz, s] of BORDER_TREES) {
      this.addTree(px(ux), px(uz), s, true);
    }
  }

  private buildMonuments() {
    const onTap = (zoneId: string) => {
      // SAME guard chain as the E key / proximity prompt.
      const { nearbyZoneId, activeZoneId, isTransitioning } = uiStore.getState();
      if (zoneId !== nearbyZoneId || activeZoneId || isTransitioning) return;
      const state = getZoneStates().find((z) => z.id === zoneId);
      if (state?.unlocked) enterZone(zoneId);
    };
    this.monuments = ZONES.map((zone) =>
      createMonument(this, zone, this.colliders, onTap),
    );
  }

  private buildPlayer() {
    bakePuppetTextures(this, progressStore.getState().avatar);
    this.playerShadow = this.add
      .ellipse(px(0) - 3, px(0) + 3, 42, 15, 0x1c2a14, 0.22)
      .setDepth(9.99);
    this.player = this.physics.add.sprite(px(0), px(0), puppetKey('down', 0));
    this.player.setOrigin(0.5, 0.97);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCircle(20, (PUPPET_W - 40) / 2, PUPPET_H - 42);
    body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.colliders);
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_PX, WORLD_PX);
    cam.startFollow(this.player, false, 0.12, 0.12);
    // Look ahead: centre the view ~7 units north of the player so the Zone 0
    // monument is visible from spawn (the 3D camera tilted forward the same way).
    cam.setFollowOffset(0, 7 * U);
    cam.setRoundPixels(true);
    const applyZoom = (width: number) => {
      cam.setZoom(Math.max(0.5, Math.min(1, width / 1600)));
    };
    applyZoom(this.scale.width);
    this.onScaleResize = (size: Phaser.Structs.Size) => applyZoom(size.width);
    this.scale.on('resize', this.onScaleResize);
  }

  /* -------------------------------- input ------------------------------- */

  /**
   * Plain window listeners (like the old drei KeyboardControls — global,
   * no preventDefault) so overlay forms keep normal typing/scrolling; keys
   * are additionally ignored while focus is in an input/textarea.
   */
  private setupInput() {
    const isTyping = (e: Event) => {
      const t = e.target as HTMLElement | null;
      return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    };
    const setKey = (code: string, down: boolean): void => {
      switch (code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = down; break;
        case 'KeyS': case 'ArrowDown': this.keys.back = down; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = down; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = down; break;
      }
    };
    const onKeyDown = (e: Event) => {
      const ev = e as KeyboardEvent;
      if (isTyping(e)) return;
      setKey(ev.code, true);
      if (ev.code === 'KeyE' && !ev.repeat) {
        // EXACT interact guard from the 3D Player.tsx.
        const { nearbyZoneId, activeZoneId, isTransitioning } = uiStore.getState();
        if (nearbyZoneId && !activeZoneId && !isTransitioning) {
          const zoneState = getZoneStates().find((z) => z.id === nearbyZoneId);
          if (zoneState?.unlocked) enterZone(nearbyZoneId);
        }
      }
    };
    const onKeyUp = (e: Event) => setKey((e as KeyboardEvent).code, false);
    const onBlur = () => {
      this.keys.forward = this.keys.back = this.keys.left = this.keys.right = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    this.keyHandlers = [
      ['keydown', onKeyDown],
      ['keyup', onKeyUp],
      ['blur', onBlur],
    ];
  }

  /* ------------------------------- update ------------------------------- */

  update(_time: number, deltaMs: number) {
    if (!this.player) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // Freeze while inside a zone or during the fade — 3D contract.
    const { activeZoneId, isTransitioning } = uiStore.getState();
    if (activeZoneId || isTransitioning) {
      body.setVelocity(0, 0);
      this.setPuppetFrame(false, deltaMs / 1000);
      return;
    }

    // 1. Gather input (joystick overrides keys when active — 3D contract).
    let mx = 0;
    let mz = 0;
    if (this.keys.forward) mz -= 1;
    if (this.keys.back) mz += 1;
    if (this.keys.left) mx -= 1;
    if (this.keys.right) mx += 1;
    const joy = this.joy.current;
    if (joy.active) {
      mx = joy.x;
      mz = joy.y;
    }

    // 2. Move (speed 12 units/s; normalize only when |v| > 1 — contract).
    const lenSq = mx * mx + mz * mz;
    if (lenSq > 0) {
      if (lenSq > 1) {
        const len = Math.sqrt(lenSq);
        mx /= len;
        mz /= len;
      }
      body.setVelocity(mx * SPEED_UNITS * U, mz * SPEED_UNITS * U);
      // Facing: dominant axis wins; side textures flip for "right".
      if (Math.abs(mx) >= Math.abs(mz)) {
        this.facing = 'side';
        this.flipX = mx > 0;
      } else {
        this.facing = mz < 0 ? 'up' : 'down';
      }
    } else {
      body.setVelocity(0, 0);
    }
    this.setPuppetFrame(lenSq > 0, deltaMs / 1000);

    // Depth sort + shadow follow.
    this.player.setDepth(10 + this.player.y * 0.01);
    this.playerShadow.setPosition(this.player.x - 3, this.player.y + 3);
    this.playerShadow.setDepth(10 + this.player.y * 0.01 - 0.02);

    // 3. Publish the logical position for the minimap (no React renders).
    const ux = toUnit(this.player.x);
    const uz = toUnit(this.player.y);
    playerPosition.x = ux;
    playerPosition.z = uz;

    // 4. Proximity: first zone in ZONES order within 6 units — contract.
    let closest: string | null = null;
    for (const z of ZONES) {
      const dx = ux - z.position[0];
      const dz = uz - z.position[1];
      if (dx * dx + dz * dz < PROXIMITY_SQ) {
        closest = z.id;
        break;
      }
    }
    if (uiStore.getState().nearbyZoneId !== closest) {
      uiStore.set({ nearbyZoneId: closest });
    }
  }

  private setPuppetFrame(moving: boolean, dt: number) {
    let frame = 0;
    if (moving) {
      this.walkTime += dt;
      frame = 1 + (Math.floor(this.walkTime / 0.16) % 2);
    } else {
      this.walkTime = 0;
    }
    if (frame !== this.frameIndex || moving !== this.moving) {
      this.frameIndex = frame;
      this.moving = moving;
      this.player.setTexture(puppetKey(this.facing, frame));
    } else {
      // Facing may change while the frame index stays the same.
      this.player.setTexture(puppetKey(this.facing, frame));
    }
    this.player.setFlipX(this.facing === 'side' && this.flipX);
  }

  /* ------------------------------ helpers ------------------------------- */

  private addStaticCircle(cx: number, cy: number, r: number) {
    const zone = this.add.zone(cx, cy, r * 2, r * 2);
    this.physics.add.existing(zone, true);
    (zone.body as Phaser.Physics.Arcade.StaticBody).setCircle(r);
    this.colliders.push(zone);
  }

  private ensureTreeTexture(): string {
    const key = 'decor-tree';
    if (this.textures.exists(key)) return key;
    const tex = this.textures.createCanvas(key, 96, 122);
    if (tex) {
      const ctx = tex.getContext();
      ctx.fillStyle = `#${TRUNK.toString(16)}`;
      ctx.fillRect(43, 72, 10, 44);
      const blob = (x: number, y: number, r: number, c: number) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `#${c.toString(16)}`;
        ctx.fill();
      };
      blob(48, 52, 34, CANOPY_DARK);
      blob(40, 42, 26, CANOPY_MAIN);
      blob(60, 46, 21, CANOPY_MAIN);
      blob(46, 34, 16, CANOPY_LIGHT);
      tex.refresh();
    }
    return key;
  }

  private addTree(cx: number, cy: number, scale: number, solid: boolean) {
    this.add
      .ellipse(cx - 8 * scale, cy + 6 * scale, 70 * scale, 22 * scale, 0x233318, 0.15)
      .setDepth(5);
    this.add
      .image(cx, cy, this.ensureTreeTexture())
      .setOrigin(0.5, 0.95)
      .setScale(scale)
      .setDepth(10 + cy * 0.01);
    if (solid) this.addStaticCircle(cx, cy - 4, 1.1 * U * scale);
  }

  private addBush(cx: number, cy: number) {
    const key = 'decor-bush';
    if (!this.textures.exists(key)) {
      const tex = this.textures.createCanvas(key, 64, 44);
      if (tex) {
        const ctx = tex.getContext();
        const blob = (x: number, y: number, r: number, c: number) => {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `#${c.toString(16)}`;
          ctx.fill();
        };
        blob(20, 28, 15, CANOPY_DARK);
        blob(42, 28, 14, CANOPY_MAIN);
        blob(31, 18, 13, CANOPY_LIGHT);
        tex.refresh();
      }
    }
    this.add.image(cx, cy, key).setOrigin(0.5, 0.9).setDepth(10 + cy * 0.01);
  }

  private addFlower(cx: number, cy: number, variant: number) {
    const colors = [0xf27fb2, 0xffd75e, 0xffffff];
    const key = `decor-flower-${variant % 3}`;
    if (!this.textures.exists(key)) {
      const tex = this.textures.createCanvas(key, 22, 22);
      if (tex) {
        const ctx = tex.getContext();
        const c = colors[variant % 3];
        const petal = (x: number, y: number) => {
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = `#${c.toString(16).padStart(6, '0')}`;
          ctx.fill();
        };
        petal(11, 5);
        petal(11, 17);
        petal(5, 11);
        petal(17, 11);
        ctx.beginPath();
        ctx.arc(11, 11, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = '#f5b73c';
        ctx.fill();
        tex.refresh();
      }
    }
    this.add.image(cx, cy, key).setDepth(5.5);
  }

  private applyZoneStates() {
    const states = getZoneStates();
    for (const handle of this.monuments) {
      const state = states.find((s) => s.id === handle.id);
      if (state) applyMonumentState(handle, state.unlocked);
    }
  }

  private cleanup() {
    for (const [name, fn] of this.keyHandlers) window.removeEventListener(name, fn);
    this.keyHandlers = [];
    this.unsubProgress?.();
    this.unsubProgress = null;
    if (this.onScaleResize) {
      this.scale.off('resize', this.onScaleResize);
      this.onScaleResize = null;
    }
  }
}
