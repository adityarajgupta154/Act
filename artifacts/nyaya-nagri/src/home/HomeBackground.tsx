/**
 * Nyaya Nagri — Home backdrop (2D only; strictly NO Three.js / R3F here).
 *
 * Per the reference-composition brief the artwork is the SUPPLIED illustration
 * used verbatim:
 *   IMAGE 1 -> `home-city.webp`  — palace, statue, zone buildings + their
 *              signage, gardens, paths and flag are all part of that single
 *              painting. Nothing in it is regenerated, recreated or redrawn.
 *   IMAGE 2 -> `guide-boy.webp`  — the guide boy stays a SEPARATE transparent
 *              sprite (never flattened into the plate) so his position and
 *              scale can be tuned per breakpoint.
 *
 * The real 3D world is lazy-loaded only after "Enter Nyaya Nagri".
 */
import React from 'react';
import city from '@/assets/home/home-city.webp';
import guideBoy from '@/assets/home/guide-boy.webp';
import blimp from '@/assets/home/home-blimp.webp';

export function HomeBackground() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Supplied city artwork, unmodified. `object-cover` never distorts it;
          the vertical bias keeps the TOP of the painting (sky, dome + flag —
          IMAGE 4's "central building fully visible" rule) when wide 16:9
          screens have to crop, sacrificing bottom cobblestones that the CTA
          cluster covers anyway. Horizontally the palace stays centred. */}
      <img
        src={city}
        alt=""
        draggable={false}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full select-none object-cover object-[50%_12%]"
      />

      {/* Guide boy — supplied transparent sprite, standing on the pathway in
          the lower-left and facing the city. Below `md` the stacked UI column
          fills this space, so he is hidden there rather than colliding with
          the CTA / Get Help card (brief §14: reposition only to prevent
          overlap; the desktop composition stays the source of truth). */}
      <img
        src={guideBoy}
        alt=""
        draggable={false}
        className="hidden md:block absolute bottom-[3%] left-[10%] h-[54vh] w-auto select-none drop-shadow-[0_18px_16px_rgba(15,23,42,0.38)] lg:h-[56vh] xl:h-[58vh]"
      />

      {/* "Nyaya Nagri" airship from the reference composition (IMAGE 4) — a
          cutout of the USER'S OWN reference image (never regenerated art),
          floating as a separate static sprite in the sky band left of the
          painted flag. Decorative only; desktop composition, like the boy. */}
      <img
        src={blimp}
        alt=""
        draggable={false}
        className="hidden md:block absolute left-[68%] top-[10%] w-[13.5%] select-none"
      />

      {/* Very light bottom vignette — just enough to seat the CTA cluster on
          the bright plaza without tinting the supplied artwork. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/20" />
    </div>
  );
}
