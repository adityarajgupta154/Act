/**
 * Nyaya Nagri — tiny option glyphs for the avatar builder pills.
 *
 * The "Make your hero" reference frame shows a small monochrome icon inside
 * every choice pill (sun for Sunny, a bust for each hairstyle, a garment for
 * each outfit, the accessory itself for extras). Lucide covers the exact
 * matches; the Indian garments and hairstyles are hand-drawn 24x24 strokes
 * in the same visual weight. All glyphs are decorative (aria-hidden), sized
 * in em so they scale with the pill text, and inherit currentColor so the
 * selected/unselected pill states restyle them for free.
 */
import React from 'react';
import {
  Backpack,
  Flower2,
  Glasses,
  Shield,
  Star,
  Sun,
} from 'lucide-react';
import type { Accessory, BaseLook, HairStyle, Outfit } from './avatarConfig';

type GlyphProps = { className?: string };
type Glyph = React.ComponentType<GlyphProps>;

/** Shared shell: 24x24, 2px strokes, round caps — the lucide look. */
function G({ className, children }: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* ------------------------------- hair ---------------------------------- */

const HairShort: Glyph = (p) => (
  <G {...p}>
    <circle cx="12" cy="13.5" r="6.5" />
    <path d="M5.5 13.5a6.5 6.5 0 0 1 13 0" fill="currentColor" stroke="none" />
  </G>
);

const HairCurly: Glyph = (p) => (
  <G {...p}>
    <circle cx="12" cy="14" r="6" />
    <path d="M6 11a3 3 0 0 1 3-4 3.2 3.2 0 0 1 6 0 3 3 0 0 1 3 4" />
  </G>
);

const HairBraids: Glyph = (p) => (
  <G {...p}>
    <circle cx="12" cy="11" r="5.5" />
    <path d="M12 5.5a5.5 5.5 0 0 0-5.5 5.5" fill="currentColor" stroke="none" />
    <path d="M12 5.5a5.5 5.5 0 0 1 5.5 5.5" fill="currentColor" stroke="none" />
    <path d="M6.5 13v5.5M17.5 13v5.5" />
    <circle cx="6.5" cy="20" r="1" fill="currentColor" stroke="none" />
    <circle cx="17.5" cy="20" r="1" fill="currentColor" stroke="none" />
  </G>
);

const HairPonytail: Glyph = (p) => (
  <G {...p}>
    <circle cx="11" cy="13" r="6" />
    <path d="M5 13a6 6 0 0 1 12 0" fill="currentColor" stroke="none" />
    <path d="M17 9c3 1.5 3.5 6 1.5 9.5" />
  </G>
);

const HairBun: Glyph = (p) => (
  <G {...p}>
    <circle cx="12" cy="14" r="6" />
    <path d="M6 14a6 6 0 0 1 12 0" fill="currentColor" stroke="none" />
    <circle cx="12" cy="5" r="2.4" fill="currentColor" stroke="none" />
  </G>
);

/* ------------------------------ outfits -------------------------------- */

const KurtaGlyph: Glyph = (p) => (
  <G {...p}>
    <path d="M9 3 5.5 6l1 4H8v11h8V10h1.5l1-4L15 3l-3 2.5L9 3Z" />
    <path d="M12 6v6" />
  </G>
);

const TshirtGlyph: Glyph = (p) => (
  <G {...p}>
    <path d="M9 3 4.5 6 6 9.5 8 9v11h8V9l2 .5L19.5 6 15 3a3 3 0 0 1-6 0Z" />
  </G>
);

const KameezGlyph: Glyph = (p) => (
  <G {...p}>
    <path d="M9 3 5.5 6l1 4H8v11h8V10h1.5l1-4L15 3l-3 2.5L9 3Z" />
    <path d="M8 16.5h2.5M13.5 16.5H16" />
  </G>
);

const HoodieGlyph: Glyph = (p) => (
  <G {...p}>
    <path d="M5 20v-7a7 7 0 0 1 14 0v7Z" />
    <path d="M8.5 8.5a3.5 3.5 0 0 1 7 0" />
    <path d="M11 14v3.5M13 14v3.5" />
  </G>
);

const KurtiGlyph: Glyph = (p) => (
  <G {...p}>
    <path d="M9.5 3 7 6l-1.5 14h13L17 6l-2.5-3L12 5 9.5 3Z" />
    <path d="M8 12h8" />
  </G>
);

const DressGlyph: Glyph = (p) => (
  <G {...p}>
    <path d="M9 3h6l1 6H8l1-6Z" />
    <path d="M8 9 4.5 20.5h15L16 9" />
  </G>
);

/* ----------------------------- accessories ----------------------------- */

const CapGlyph: Glyph = (p) => (
  <G {...p}>
    <path d="M4.5 14a7.5 7.5 0 0 1 15 0" />
    <path d="M2.5 14H17" />
    <circle cx="12" cy="6" r="0.8" fill="currentColor" stroke="none" />
  </G>
);

const ScarfGlyph: Glyph = (p) => (
  <G {...p}>
    <path d="M3.5 10.5C6.5 8.5 9 12 12 10.5s5.5 2 8.5 0" />
    <path d="M3.5 14.5C6.5 12.5 9 16 12 14.5s5.5 2 8.5 0" />
  </G>
);

/* ------------------------------- look ---------------------------------- */

const SunnyGlyph: Glyph = (p) => <Sun className={p.className} aria-hidden="true" />;
const BraveGlyph: Glyph = (p) => <Shield className={p.className} aria-hidden="true" />;

/* ------------------------------- maps ----------------------------------- */

export const LOOK_GLYPHS: Record<BaseLook, Glyph> = {
  sunny: SunnyGlyph,
  brave: BraveGlyph,
};

export const HAIR_GLYPHS: Record<HairStyle, Glyph> = {
  short: HairShort,
  curly: HairCurly,
  braids: HairBraids,
  ponytail: HairPonytail,
  bun: HairBun,
};

export const OUTFIT_GLYPHS: Record<Outfit, Glyph> = {
  kurta: KurtaGlyph,
  tshirt: TshirtGlyph,
  kameez: KameezGlyph,
  hoodie: HoodieGlyph,
  kurti: KurtiGlyph,
  dress: DressGlyph,
};

/** Free starter extras have pill glyphs; shop cosmetics keep text-only pills. */
export const ACCESSORY_GLYPHS: Partial<Record<Accessory, Glyph>> = {
  glasses: (p) => <Glasses className={p.className} aria-hidden="true" />,
  cap: CapGlyph,
  star: (p) => <Star className={p.className} aria-hidden="true" />,
  scarf: ScarfGlyph,
  flower: (p) => <Flower2 className={p.className} aria-hidden="true" />,
  backpack: (p) => <Backpack className={p.className} aria-hidden="true" />,
};
