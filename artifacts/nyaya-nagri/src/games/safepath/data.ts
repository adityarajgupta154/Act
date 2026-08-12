/**
 * "Safe Path Adventure" — illustration bindings (sp-*.webp), mirroring the
 * childhood game's data.ts convention: content.ts stays PURE TEXT (safe to
 * import under tsx smokes), this module owns every static-asset import.
 *
 * Some spots intentionally SHARE art across levels (a photo request and a
 * secret chat both show the uneasy-phone scene) — the card text carries
 * the specific lesson; the picture only sets the mood (PRD §9.5 —
 * implication-only, non-graphic).
 */
import { SP_LEVELS } from './content';

import bgUrl from '@/assets/games/safepath/sp-park-bg.webp';
import tileUrl from '@/assets/games/safepath/sp-path-tile.webp';
import playerUrl from '@/assets/games/safepath/sp-player.webp';
import goalUrl from '@/assets/games/safepath/sp-safezone.webp';
import bannerUrl from '@/assets/games/safepath/sp-complete-banner.webp';
import secretPhoneUrl from '@/assets/games/safepath/sp-secret-phone.webp';
import onlineContactUrl from '@/assets/games/safepath/sp-online-contact.webp';
import giftBribeUrl from '@/assets/games/safepath/sp-gift-bribe.webp';
import boundaryUrl from '@/assets/games/safepath/sp-boundary.webp';
import trustedAdultUrl from '@/assets/games/safepath/sp-trusted-adult.webp';
import safePlaceUrl from '@/assets/games/safepath/sp-safe-place.webp';
import passwordUrl from '@/assets/games/safepath/sp-password.webp';
import teacherUrl from '@/assets/games/safepath/sp-teacher.webp';

export const SP_BG_URL = bgUrl;
export const SP_TILE_URL = tileUrl;
export const SP_PLAYER_URL = playerUrl;
export const SP_GOAL_URL = goalUrl;
export const SP_BANNER_URL = bannerUrl;

/** Obstacle id → card illustration. */
export const SP_ART: Record<string, string> = {
  // Level 1 — Warning Signs
  'secret-phone': secretPhoneUrl,
  'online-contact': onlineContactUrl,
  'gift-bribe': giftBribeUrl,
  'body-boundary': boundaryUrl,
  'trusted-adult': trustedAdultUrl,
  'safe-place': safePlaceUrl,
  // Level 2 — Online Safety (shared moods, specific lessons)
  'game-stranger': onlineContactUrl,
  'password-private': passwordUrl,
  'photo-request': secretPhoneUrl,
  'prize-trick': giftBribeUrl,
  'teacher-listens': teacherUrl,
  'tell-at-home': trustedAdultUrl,
};

// DEV-only integrity check (same convention as the childhood game): every
// authored obstacle must have art bound, or we fail loudly at boot.
if (import.meta.env?.DEV) {
  for (const level of SP_LEVELS) {
    for (const ob of level.obstacles) {
      if (!SP_ART[ob.id]) {
        // eslint-disable-next-line no-console
        console.error(`[safepath] missing illustration binding for obstacle "${ob.id}"`);
      }
    }
  }
}
