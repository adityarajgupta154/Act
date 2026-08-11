/**
 * Nyaya Nagri — the illustrated 2D world scene.
 *
 * BEHAVIOR CONTRACT — replicated 1:1 from the 3D Player.tsx/Scene.tsx:
 *  - logical coordinates: x/z in -40..40, zone anchors from zones.ts
 *  - speed 12 units/s; joystick overrides keys when active; WASD/arrows
 *  - E interacts ONLY when nearby + unlocked + not inside a zone
 *  - proximity: first zone (in ZONES order) with dist^2 < 36
 *  - movement freezes while a zone is open or a transition runs
 *  - playerPosition {x,z} mirrored every frame for the minimap
 *  - collision bounds: world edges, monuments, and large scenery block
 *
 * VISUALS (Aug 2026 "same to same" rebuild): the whole village is composed
 * from the child's reference painting — painterly grass plate, radial
 * cobble paths around a central plaza disc, cutout monuments, twin
 * blue-roof houses, and a cutout tree ring. All cutouts render at native
 * crop size (1 px = 1 world px).
 */
import Phaser from 'phaser';
import { ZONES, getZoneStates } from '../zones';
import { uiStore, playerPosition, enterZone, openStoryMap } from '@/ui/uiStore';
import { STORY_ENTRANCE, STORY_PROXIMITY_SQ } from '@/story/storyData';
import { progressStore } from '@/data/progressStore';
import {
  GRASS_BASE,
  GRASS_DARK,
  GRASS_LIGHT,
  PATH_TILE_W,
  PLATE,
  PLAZA,
  PROXIMITY_SQ,
  SPEED_UNITS,
  U,
  WORLD_PX,
  px,
  toUnit,
} from './const';
import {
  MonumentHandle,
  applyMonumentState,
  createMonument,
  setMonumentLabel,
} from './monuments';
import { buildRoads } from './roads';
import { settingsStore } from '@/data/settingsStore';
import { getStrings } from '@/i18n/strings';
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
  /** Phaser texture key -> Vite-resolved URL (see PhaserWorld.tsx). */
  assets: Record<string, string>;
}

/**
 * Cutout tree ring enclosing the village (decor + collision) — the new
 * reference frame shows a much denser border forest, so this ring runs
 * tighter and fuller: [x, z, scale, useTreeB].
 */
const BORDER_TREES: Array<[number, number, number, boolean]> = [
  // top edge
  [-30, -31, 1.3, false], [-23, -33, 1.05, true], [-16, -31, 1.2, false],
  [-9, -33, 1.0, true], [-2, -31, 1.35, false], [5, -33, 1.0, true],
  [12, -31, 1.25, false], [19, -33, 1.05, true], [26, -31, 1.3, false],
  [32, -33, 1.0, true],
  // right edge
  [29, -26, 1.15, true], [31, -19, 1.3, false], [28, -12, 1.05, true],
  [31, -5, 1.25, false], [29, 2, 1.1, true], [31, 9, 1.3, false],
  [28, 15, 1.05, true],
  // bottom edge
  [24, 17, 1.25, false], [17, 15, 1.0, true], [10, 17, 1.3, false],
  [3, 15, 1.0, true], [-4, 17, 1.25, false], [-11, 15, 1.05, true],
  [-18, 17, 1.3, false], [-25, 15, 1.0, true],
  // left edge (behind the river)
  [-31, 10, 1.25, false], [-29, 3, 1.1, true], [-31, -4, 1.3, false],
  [-29, -11, 1.05, true], [-31, -18, 1.2, false], [-29, -25, 1.1, true],
  // outer fillers — the reference forest reads as a solid canopy wall
  [-34, -27, 1.1, true], [-33, -11, 1.15, false], [-33, 6, 1.1, true],
  [-34, 13, 1.2, false], [33, -26, 1.1, false], [34, -12, 1.2, true],
  [33, 1, 1.1, false], [34, 12, 1.15, true], [-30, 17, 1.15, true],
  [30, 17, 1.2, true], [-27, -34, 1.1, true], [9, -35, 1.1, false],
  [27, -34, 1.15, true],
];

/** Interior tree accents between the zone spokes (reference clumps). */
const INNER_TREES: Array<[number, number, number, boolean]> = [
  [-20, -20, 0.95, false], [20, -20, 0.9, true],
  [-6, -30, 0.85, false], [6, -30, 0.8, true], [0, -31, 0.9, false],
  [-16, 3, 0.9, true], [16, 4, 0.85, false],
  [-8, 12, 0.8, true], [8, 12, 0.8, false],
  [22, -7, 0.9, false], [-22, -16, 0.85, true],
];

/**
 * The single blue-roof house east of the plaza — the Story Adventure
 * entrance (Aug 2026). Position is the reference art's; storyData's
 * STORY_ENTRANCE must always match this entry.
 */
const HOUSES: Array<[number, number, boolean]> = [
  [16, -12, false],
];

/** Flower patch cutouts along the paths (no collision). */
const FLOWER_PATCHES: Array<[number, number]> = [
  [-6, -18], [6, -18], [-14, -18], [14, -18],
  [-5, -5], [5, -5], [-13, -6], [13, -6],
  [3, 6], [-3, 8], [14, 3], [-9, -27], [9, -27], [18, -16],
  // Flanking the S entrance lane's forest terminus (map redesign) so the
  // road reads as the framed village entrance, not a dead end.
  [-2.2, 13.6], [2.2, 14.2],
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
  private unsubSettings: (() => void) | null = null;
  private keyHandlers: Array<[string, (e: Event) => void]> = [];
  /** Story house label + done-tick handles (Aug 2026). */
  private storyLabelG: Phaser.GameObjects.Graphics | null = null;
  private storyLabelText: Phaser.GameObjects.Text | null = null;
  private storyTick: Phaser.GameObjects.Image | null = null;
  private storyLabelY = 0;

  constructor() {
    super('world');
  }

  init(data: SceneData) {
    this.joy = data.joystickRef;
  }

  preload() {
    const data = this.sys.settings.data as unknown as SceneData;
    for (const [key, url] of Object.entries(data.assets)) {
      this.load.image(key, url);
    }
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_PX, WORLD_PX);

    this.buildGround();
    this.buildPaths();
    this.buildDecor();
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
      this.applyStoryState();
      const nextHash = puppetHash(progressStore.getState().avatar);
      if (nextHash !== this.avatarHash) {
        this.avatarHash = nextHash;
        bakePuppetTextures(this, progressStore.getState().avatar);
        this.player.setTexture(puppetKey(this.facing, this.frameIndex));
      }
    });

    // Zone label pills follow the app language (EN <-> HI) live.
    this.unsubSettings = settingsStore.subscribe(() => {
      const s = getStrings(settingsStore.getState().language);
      for (const handle of this.monuments) {
        const zone = ZONES.find((z) => z.id === handle.id);
        if (zone) setMonumentLabel(handle, s.zones[zone.id]?.name ?? zone.name);
      }
      // The story house name pill follows the language too.
      if (this.storyLabelText) {
        this.storyLabelText.setText(s.storyAdventure);
        this.drawStoryPill();
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
    // The painterly meadow plate from the reference round (1024px art at
    // 2x) carries the village core; its edges fade into GRASS_BASE.
    this.add
      .image(px(PLATE.x), px(PLATE.z), 'village-grass')
      .setDisplaySize(PLATE.sizePx, PLATE.sizePx)
      .setDepth(0.4);
    // Soft far-field patches beyond the plate so the outer meadow is not flat.
    const g = this.add.graphics().setDepth(0.45);
    const patches: Array<[number, number, number, number, number, number]> = [
      [-34, -30, 9, 6, GRASS_LIGHT, 0.3], [32, -28, 8, 5.5, GRASS_DARK, 0.22],
      [-33, 10, 8, 6, GRASS_DARK, 0.2], [34, 14, 8, 5, GRASS_LIGHT, 0.28],
      [-10, 32, 11, 7, GRASS_LIGHT, 0.28], [14, 34, 8, 5, GRASS_DARK, 0.2],
      [0, -36, 12, 6, GRASS_LIGHT, 0.26], [-36, -8, 7, 5, GRASS_LIGHT, 0.28],
      [36, -2, 7, 5, GRASS_DARK, 0.2],
    ];
    for (const [ux, uz, rx, rz, color, alpha] of patches) {
      g.fillStyle(color, alpha);
      g.fillEllipse(px(ux), px(uz), rx * 2 * U, rz * 2 * U);
    }
  }

  /**
   * Roads (map redesign, Aug 2026): the plaza disc is the central junction
   * and the whole lane network comes from roads.ts — the ONE authoritative
   * road system, with endpoints derived from zones.ts / storyData.ts. The
   * old hand-tuned spoke polylines (whose bends left wedge gaps and whose
   * ends stopped short of the monuments) are gone.
   */
  private buildPaths() {
    buildRoads(this);
    // The disc draws ABOVE the lane starts (0.5) so every junction seam
    // hides under its painted rim.
    this.add
      .image(px(PLAZA.x), px(PLAZA.z), 'plaza-disc')
      .setDepth(0.6);
  }

  private buildDecor() {
    // River corner with the wooden bridge (reference SW edge): one large
    // cutout laid over the meadow; the water is fenced off with a chain
    // of static circle bodies so the player cannot walk in.
    this.add
      .image(px(-21.5), px(-2), 'river-corner')
      .setDisplaySize(378, 600)
      .setDepth(0.55);
    for (const rz of [-7.5, -3.5, 0.5, 4.5]) {
      this.addStaticCircle(px(-23), px(rz), 2.2 * U);
      this.addStaticCircle(px(-19), px(rz), 2.2 * U);
    }

    // The blue-roof house east of the plaza — now the Story Adventure
    // entrance (Aug 2026). Kept EXACTLY where the reference art placed it;
    // the cutout only gains a tap handler, a name pill and a done-tick.
    for (const [ux, uz, flip] of HOUSES) {
      const hx = px(ux);
      const hy = px(uz);
      this.add.ellipse(hx - 8, hy + 6, 150, 40, 0x233318, 0.15).setDepth(5);
      const house = this.add
        .image(hx, hy, 'decor-house')
        .setOrigin(0.5, 0.9)
        .setFlipX(flip)
        .setDepth(10 + hy * 0.01);
      this.addStaticCircle(hx, hy - 6, 2.0 * U);
      if (ux === STORY_ENTRANCE.position[0] && uz === STORY_ENTRANCE.position[1]) {
        this.decorateStoryHouse(house, hx, hy);
      }
    }
    const plantTree = ([ux, uz, s, useB]: [number, number, number, boolean], i: number) => {
      const tx = px(ux);
      const ty = px(uz);
      this.add
        .ellipse(tx - 8 * s, ty + 6 * s, 130 * s, 36 * s, 0x233318, 0.13)
        .setDepth(5);
      this.add
        .image(tx, ty, useB ? 'decor-tree-b' : 'decor-tree-a')
        .setOrigin(0.5, 0.92)
        .setScale(s)
        .setFlipX(i % 3 === 1)
        .setDepth(10 + ty * 0.01);
      this.addStaticCircle(tx, ty - 4, 1.5 * U * s);
    };
    BORDER_TREES.forEach(plantTree);
    INNER_TREES.forEach(plantTree);

    // Small reference props: rocks, stacked logs, mushrooms, flower fences.
    // Aug 2026 map redesign: a few more of the SAME cutouts fill the
    // reference's denser corners (rocks top-left, log + fence by the help
    // house, rocks bottom-right) — never on a lane.
    const props: Array<[string, number, number, number, boolean]> = [
      ['decor-rocks', -11, -28.2, 1.35, false],
      ['decor-rocks', 18, -8, 1.1, true],
      ['decor-rocks', -26, -28, 1.2, true],
      ['decor-rocks', 24, 6, 1.0, false],
      ['decor-log', 16, -2.5, 1.35, false],
      ['decor-log', -25, 9, 1.2, true],
      ['decor-mushroom', 14.6, -0.2, 1.35, false],
      ['decor-mushroom', -3.4, 5.2, 1.05, true],
      ['decor-fence', 12.8, -3.6, 1.35, false],
      ['decor-fence', -20.5, -13, 1.35, true],
      ['decor-fence', 19.5, -10.2, 1.25, true],
    ];
    for (const [key, ux, uz, s, flip] of props) {
      this.add
        .image(px(ux), px(uz), key)
        .setOrigin(0.5, 0.9)
        .setScale(s)
        .setFlipX(flip)
        .setDepth(10 + px(uz) * 0.01);
    }
    // Chunky props block movement; mushrooms and fences stay walk-through.
    this.addStaticCircle(px(-11), px(-28.4), 1.3 * U);
    this.addStaticCircle(px(18), px(-8.2), 1.1 * U);
    this.addStaticCircle(px(16), px(-2.7), 1.2 * U);

    FLOWER_PATCHES.forEach(([ux, uz], i) => {
      this.add
        .image(px(ux), px(uz), i % 2 ? 'decor-flowers-b' : 'decor-flowers-a')
        .setDepth(5.5)
        .setAlpha(0.95);
    });
  }

  /* --------------------------- story house ------------------------------ */

  /**
   * Story Adventure entrance dressing (Aug 2026): the decor house gains a
   * tap handler, a warm name pill (monument-pill styling) and a green
   * done-tick once the story is complete. The house cutout itself — the
   * user's art — is untouched.
   */
  private decorateStoryHouse(house: Phaser.GameObjects.Image, hx: number, hy: number) {
    house.setInteractive({ useHandCursor: true });
    house.on('pointerdown', () => {
      // SAME guard chain as monument taps (plus not-already-in-a-story).
      const { nearbyStoryId, activeZoneId, activeStory, isTransitioning, storyMapOpen } =
        uiStore.getState();
      if (
        nearbyStoryId !== STORY_ENTRANCE.storyId ||
        activeZoneId ||
        activeStory ||
        isTransitioning ||
        storyMapOpen
      ) {
        return;
      }
      // The door opens the LEVEL MAP — individual levels start from there.
      openStoryMap();
    });

    // Name pill under the door — same Fredoka text + pill recipe as the
    // monument labels, in the story's warm orange accent.
    const label = getStrings(settingsStore.getState().language).storyAdventure;
    this.storyLabelY = hy + 26;
    this.storyLabelText = this.add
      .text(hx, this.storyLabelY, label, {
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: '17px',
        fontStyle: '600',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(501);
    this.storyLabelG = this.add.graphics().setDepth(500);
    this.drawStoryPill();

    // Green done-tick beside the roof once the story level is complete.
    const tickKey = this.ensureStoryTickTexture();
    this.storyTick = this.add
      .image(hx + house.displayWidth * 0.3, hy - house.displayHeight * 0.82, tickKey)
      .setDepth(10 + hy * 0.01 + 0.07)
      .setVisible(false);
    this.applyStoryState();
  }

  /** Redraw the story pill behind its (possibly re-set) label text. */
  private drawStoryPill() {
    if (!this.storyLabelG || !this.storyLabelText) return;
    const w = this.storyLabelText.width + 26;
    const h = this.storyLabelText.height + 12;
    const cx = this.storyLabelText.x;
    const cy = this.storyLabelY;
    this.storyLabelG.clear();
    // Soft ground shadow first, then the warm orange pill.
    this.storyLabelG.fillStyle(0x1c2413, 0.22);
    this.storyLabelG.fillRoundedRect(cx - w / 2, cy - h / 2 + 2.5, w, h, h / 2);
    this.storyLabelG.fillStyle(0xea580c, 0.96);
    this.storyLabelG.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, h / 2);
  }

  /** Canvas-drawn green tick badge (same pattern as the monument lock). */
  private ensureStoryTickTexture(): string {
    const key = 'story-done-tick';
    if (this.textures.exists(key)) return key;
    const tex = this.textures.createCanvas(key, 56, 56);
    if (!tex) return key;
    const ctx = tex.getContext();
    ctx.beginPath();
    ctx.arc(28, 28, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#16a34a';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(16, 29);
    ctx.lineTo(25, 38);
    ctx.lineTo(41, 19);
    ctx.stroke();
    tex.refresh();
    return key;
  }

  /** Show/hide the done-tick from progress (subscribed in create()). */
  private applyStoryState() {
    if (!this.storyTick) return;
    const done = !!progressStore.getState().storyProgress[STORY_ENTRANCE.storyId];
    this.storyTick.setVisible(done);
  }

  private buildMonuments() {
    const onTap = (zoneId: string) => {
      // SAME guard chain as the E key / proximity prompt.
      const { nearbyZoneId, activeZoneId, isTransitioning } = uiStore.getState();
      if (zoneId !== nearbyZoneId || activeZoneId || isTransitioning) return;
      const state = getZoneStates().find((z) => z.id === zoneId);
      if (state?.unlocked) enterZone(zoneId);
    };
    const strings = getStrings(settingsStore.getState().language);
    this.monuments = ZONES.map((zone) =>
      createMonument(
        this,
        zone,
        this.colliders,
        onTap,
        strings.zones[zone.id]?.name ?? zone.name,
      ),
    );
  }

  private buildPlayer() {
    bakePuppetTextures(this, progressStore.getState().avatar);
    this.playerShadow = this.add
      .ellipse(px(0) - 4, px(0) + 4, 60, 22, 0x1c2a14, 0.22)
      .setDepth(9.99);
    this.player = this.physics.add.sprite(px(0), px(0), puppetKey('down', 0));
    this.player.setOrigin(0.5, 0.97);
    // The reference frame draws the child noticeably larger against the
    // village; 1.5x keeps that presence while fitting the 1.9-unit lanes.
    this.player.setScale(1.5);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCircle(20, (PUPPET_W - 40) / 2, PUPPET_H - 42);
    body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.colliders);
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_PX, WORLD_PX);
    cam.startFollow(this.player, false, 0.12, 0.12);
    // Look ahead: centre the view ~12 units north of the player so the
    // whole zone ring is on screen from spawn (the reference framing).
    cam.setFollowOffset(0, 12 * U);
    cam.setRoundPixels(true);
    const applyZoom = (width: number) => {
      // /2600: desktop fits the full ring — crystal to shield across,
      // well at the top — in one frame like the reference painting.
      cam.setZoom(Math.max(0.5, Math.min(1, width / 2600)));
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
        // EXACT interact guard from the 3D Player.tsx (+ the story house
        // door; zone gates keep priority if both could ever apply).
        const { nearbyZoneId, nearbyStoryId, activeZoneId, activeStory, isTransitioning, storyMapOpen } =
          uiStore.getState();
        if (activeZoneId || activeStory || isTransitioning || storyMapOpen) return;
        if (nearbyZoneId) {
          const zoneState = getZoneStates().find((z) => z.id === nearbyZoneId);
          if (zoneState?.unlocked) enterZone(nearbyZoneId);
        } else if (nearbyStoryId) {
          // E at the house door opens the LEVEL MAP (not a level directly).
          openStoryMap();
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

    // Freeze inside a zone, a story, the level map, or during the fade.
    const { activeZoneId, activeStory, isTransitioning, storyMapOpen } = uiStore.getState();
    if (activeZoneId || activeStory || isTransitioning || storyMapOpen) {
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
    this.playerShadow.setPosition(this.player.x - 4, this.player.y + 4);
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

    // 5. Story house proximity (Aug 2026) — tighter radius than zones, and
    // the house sits >11 units from every zone anchor, so this prompt can
    // never appear together with a zone prompt. Publish-on-change only.
    const sdx = ux - STORY_ENTRANCE.position[0];
    const sdz = uz - STORY_ENTRANCE.position[1];
    const nearStory =
      sdx * sdx + sdz * sdz < STORY_PROXIMITY_SQ ? STORY_ENTRANCE.storyId : null;
    if (uiStore.getState().nearbyStoryId !== nearStory) {
      uiStore.set({ nearbyStoryId: nearStory });
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
    this.unsubSettings?.();
    this.unsubSettings = null;
    if (this.onScaleResize) {
      this.scale.off('resize', this.onScaleResize);
      this.onScaleResize = null;
    }
  }
}
