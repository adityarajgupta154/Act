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

export function HomeBackground() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Supplied city artwork, unmodified. `object-cover` keeps the palace
          centred; the crop bias leans slightly low so the foreground plaza
          (where the CTA sits) survives on wide 16:9 screens. */}
      <img
        src={city}
        alt=""
        draggable={false}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full select-none object-cover object-[50%_42%]"
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
        className="hidden md:block absolute bottom-[2%] left-[6%] h-[44vh] w-auto select-none drop-shadow-[0_18px_16px_rgba(15,23,42,0.38)] lg:h-[48vh] xl:h-[52vh]"
      />

      {/* Very light bottom vignette — just enough to seat the CTA cluster on
          the bright plaza without tinting the supplied artwork. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/20" />
    </div>
  );
}
