/**
 * Nyaya Nagri — Player avatar config (Task 14, PRD §7.2 + §9.4)
 *
 * The child's OWN playable character — separate from the AI companion
 * (Adhikar Didi/Bhaiya). Hard rules from the PRD:
 *  - Illustrated/cartoon assets ONLY: the avatar is drawn from these ids by
 *    an SVG renderer. No photo upload, no camera access, no biometrics —
 *    there is deliberately NO way to feed image data into this config.
 *  - Display nickname only, never a real name (§6.5 rule).
 *  - Cosmetic only: nothing here may influence gameplay, difficulty, or
 *    content. Quest engine/registry must never import this module.
 */

export type BaseLook = 'sunny' | 'brave';
export type HairStyle = 'short' | 'curly' | 'braids' | 'bun';
export type Outfit = 'kurta' | 'tshirt' | 'kameez' | 'hoodie';
export type Accessory = 'glasses' | 'cap' | 'star' | 'scarf' | 'flower' | 'backpack';

export interface PlayerAvatarConfig {
  base: BaseLook;
  /** One of SKIN_TONES — a small inclusive range of illustrated tones. */
  skinTone: string;
  hair: HairStyle;
  outfit: Outfit;
  /** Up to MAX_ACCESSORIES starter accessories. */
  accessories: Accessory[];
  /** Fun game nickname — never a real name (guidance shown in the UI). */
  nickname: string;
}

export const BASE_LOOKS: readonly BaseLook[] = ['sunny', 'brave'];
export const SKIN_TONES: readonly string[] = [
  '#FFE0BD',
  '#F1C27D',
  '#C68642',
  '#8D5524',
  '#5C3A21',
];
export const HAIR_STYLES: readonly HairStyle[] = ['short', 'curly', 'braids', 'bun'];
export const OUTFITS: readonly Outfit[] = ['kurta', 'tshirt', 'kameez', 'hoodie'];
export const ACCESSORIES: readonly Accessory[] = [
  'glasses',
  'cap',
  'star',
  'scarf',
  'flower',
  'backpack',
];
export const MAX_ACCESSORIES = 3;
export const NICKNAME_MAX_LENGTH = 16;

export function createDefaultAvatar(): PlayerAvatarConfig {
  return {
    base: 'sunny',
    skinTone: SKIN_TONES[2],
    hair: 'short',
    outfit: 'kurta',
    accessories: [],
    nickname: '',
  };
}

/**
 * Validate a config loaded from storage (older/edited saves). Returns a
 * safe config or null when it is unusable (then the app treats the player
 * as having no avatar yet).
 */
export function sanitizeAvatar(raw: unknown): PlayerAvatarConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<PlayerAvatarConfig>;
  const nickname = typeof r.nickname === 'string' ? r.nickname.trim().slice(0, NICKNAME_MAX_LENGTH) : '';
  if (!nickname) return null;
  return {
    base: BASE_LOOKS.includes(r.base as BaseLook) ? (r.base as BaseLook) : 'sunny',
    skinTone: SKIN_TONES.includes(r.skinTone as string) ? (r.skinTone as string) : SKIN_TONES[2],
    hair: HAIR_STYLES.includes(r.hair as HairStyle) ? (r.hair as HairStyle) : 'short',
    outfit: OUTFITS.includes(r.outfit as Outfit) ? (r.outfit as Outfit) : 'kurta',
    accessories: Array.isArray(r.accessories)
      ? (r.accessories.filter((a) => ACCESSORIES.includes(a as Accessory)) as Accessory[]).slice(
          0,
          MAX_ACCESSORIES,
        )
      : [],
    nickname,
  };
}
