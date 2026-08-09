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
 *
 * Boy/Girl hero system: the config carries a `character`, and hair/outfit
 * options are offered per character (girl gets female-appropriate lists,
 * rendered as her own art — never the boy recolored). Legacy saves have no
 * `character` field and sanitize to 'boy', so old avatars are unchanged.
 */

export type BaseLook = 'sunny' | 'brave';
/** The child's hero. Legacy saves (no field) sanitize to 'boy'. */
export type CharacterType = 'boy' | 'girl';
export type HairStyle = 'short' | 'curly' | 'braids' | 'bun' | 'ponytail';
export type Outfit = 'kurta' | 'tshirt' | 'kameez' | 'hoodie' | 'kurti' | 'dress';
/**
 * Task 16: 'bow' | 'medal' | 'crown' | 'cape' are Avatar Shop cosmetics —
 * unlocked with in-game Coins only (never real money, PRD §7.3/§9.6).
 */
export type Accessory =
  | 'glasses' | 'cap' | 'star' | 'scarf' | 'flower' | 'backpack'
  | 'bow' | 'medal' | 'crown' | 'cape';

export interface PlayerAvatarConfig {
  /** Which hero the child plays as — boy (default) or girl. */
  character: CharacterType;
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

export const CHARACTERS: readonly CharacterType[] = ['boy', 'girl'];
export const BASE_LOOKS: readonly BaseLook[] = ['sunny', 'brave'];
export const SKIN_TONES: readonly string[] = [
  '#FFE0BD',
  '#F1C27D',
  '#C68642',
  '#8D5524',
  '#5C3A21',
];
/**
 * FULL id lists, append-only: the i18n name arrays (hairStyleNames,
 * outfitNames) are index-aligned to these, so new ids must go at the END.
 */
export const HAIR_STYLES: readonly HairStyle[] = ['short', 'curly', 'braids', 'bun', 'ponytail'];
export const OUTFITS: readonly Outfit[] = ['kurta', 'tshirt', 'kameez', 'hoodie', 'kurti', 'dress'];
/**
 * What each character can actually wear (builder rows + sanitize rule).
 * Boy keeps the original four+four; the girl list follows the task brief
 * (Short/Curly/Braids/Ponytail/Bun, T-shirt/Kurti/Kameez/Hoodie/Dress).
 */
export const HAIR_STYLES_FOR: Record<CharacterType, readonly HairStyle[]> = {
  boy: ['short', 'curly', 'braids', 'bun'],
  girl: ['short', 'curly', 'braids', 'ponytail', 'bun'],
};
export const OUTFITS_FOR: Record<CharacterType, readonly Outfit[]> = {
  boy: ['kurta', 'tshirt', 'kameez', 'hoodie'],
  girl: ['tshirt', 'kurti', 'kameez', 'hoodie', 'dress'],
};
/** Starter accessories — free from onboarding onwards (PRD §7.2). */
export const FREE_ACCESSORIES: readonly Accessory[] = [
  'glasses',
  'cap',
  'star',
  'scarf',
  'flower',
  'backpack',
];
/** Shop-only cosmetics (Task 16) — must be OWNED (bought with Coins) to equip. */
export const SHOP_ACCESSORIES: readonly Accessory[] = ['bow', 'medal', 'crown', 'cape'];
/** Every renderer-known accessory id, free first then shop (UI name lists follow this order). */
export const ACCESSORIES: readonly Accessory[] = [...FREE_ACCESSORIES, ...SHOP_ACCESSORIES];
export const MAX_ACCESSORIES = 3;

/**
 * Ownership filter (Task 16 ingress rule): shop accessories may only stay
 * equipped when they appear in the owned list. Applied at every avatar
 * write/load in the progress store — a save edited to wear an un-bought
 * cosmetic quietly loses it.
 */
export function filterToOwnedAccessories(
  accessories: Accessory[],
  owned: readonly string[],
): Accessory[] {
  return accessories.filter(
    (a) => !SHOP_ACCESSORIES.includes(a) || owned.includes(a),
  );
}
export const NICKNAME_MAX_LENGTH = 16;

export function createDefaultAvatar(character: CharacterType = 'boy'): PlayerAvatarConfig {
  return {
    character,
    base: 'sunny',
    skinTone: SKIN_TONES[2],
    hair: character === 'girl' ? 'ponytail' : 'short',
    outfit: character === 'girl' ? 'kurti' : 'kurta',
    accessories: [],
    nickname: '',
  };
}

/**
 * Validate a config loaded from storage (older/edited saves). Returns a
 * safe config or null when it is unusable (then the app treats the player
 * as having no avatar yet). Character-aware: hair/outfit must be valid FOR
 * the config's character, otherwise they degrade to that character's
 * defaults (a girl can never load wearing boy-only clothes and vice versa).
 */
export function sanitizeAvatar(raw: unknown): PlayerAvatarConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<PlayerAvatarConfig>;
  const nickname = typeof r.nickname === 'string' ? r.nickname.trim().slice(0, NICKNAME_MAX_LENGTH) : '';
  if (!nickname) return null;
  const character: CharacterType = r.character === 'girl' ? 'girl' : 'boy';
  const fallback = createDefaultAvatar(character);
  return {
    character,
    base: BASE_LOOKS.includes(r.base as BaseLook) ? (r.base as BaseLook) : 'sunny',
    skinTone: SKIN_TONES.includes(r.skinTone as string) ? (r.skinTone as string) : SKIN_TONES[2],
    hair: HAIR_STYLES_FOR[character].includes(r.hair as HairStyle)
      ? (r.hair as HairStyle)
      : fallback.hair,
    outfit: OUTFITS_FOR[character].includes(r.outfit as Outfit)
      ? (r.outfit as Outfit)
      : fallback.outfit,
    accessories: Array.isArray(r.accessories)
      ? (r.accessories.filter((a) => ACCESSORIES.includes(a as Accessory)) as Accessory[]).slice(
          0,
          MAX_ACCESSORIES,
        )
      : [],
    nickname,
  };
}
