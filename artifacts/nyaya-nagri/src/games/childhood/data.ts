/**
 * "Right to Childhood" — illustration bindings. content.ts stays PURE TEXT
 * (smoke-importable under tsx); this module is the ONE place webp assets
 * join the content. Convention (asserted by scripts/childhood.smoke.ts):
 * every option id maps to src/assets/games/childhood/ch-<optionId>.webp.
 *
 * All illustrations are generated in-house (no stock art, no text baked
 * in); distractor scenes follow PRD §9.5 — implication only, never harm.
 */
import { CH_ROUNDS } from './content';
import school from '@/assets/games/childhood/ch-school.webp';
import park from '@/assets/games/childhood/ch-park.webp';
import care from '@/assets/games/childhood/ch-care.webp';
import labour from '@/assets/games/childhood/ch-labour.webp';
import doctor from '@/assets/games/childhood/ch-doctor.webp';
import family from '@/assets/games/childhood/ch-family.webp';
import kites from '@/assets/games/childhood/ch-kites.webp';
import stall from '@/assets/games/childhood/ch-stall.webp';
import crossing from '@/assets/games/childhood/ch-crossing.webp';
import reading from '@/assets/games/childhood/ch-reading.webp';
import meal from '@/assets/games/childhood/ch-meal.webp';
import selling from '@/assets/games/childhood/ch-selling.webp';
import bg from '@/assets/games/childhood/ch-bg.webp';

/** Painted meadow-sky backdrop for the whole game screen. */
export const CH_BG_URL = bg;

/** Option id → bundled illustration URL. */
export const CH_OPTION_ART: Record<string, string> = {
  school,
  park,
  care,
  labour,
  doctor,
  family,
  kites,
  stall,
  crossing,
  reading,
  meal,
  selling,
};

// A missing binding is a build-time bug — fail loudly in dev, never in prod.
if (import.meta.env.DEV) {
  for (const round of CH_ROUNDS) {
    for (const o of round.options) {
      if (!CH_OPTION_ART[o.id]) {
        throw new Error(`childhood game: option "${o.id}" has no illustration binding`);
      }
    }
  }
}

export { CH_ROUNDS };
