/**
 * Nyaya Nagri — Home backdrop (redesign brief: reference-image-based,
 * strictly NO 3D / Three.js on the homepage).
 *
 * The whole environment (palace, statue, six zone buildings, gardens, flag,
 * airship) is ONE pre-rendered illustration. Zone signboards + the palace
 * banner are baked into the plate per language (EN/HI) so the signage always
 * crops, scales and moves WITH the buildings under `object-cover`.
 * The guide boy is a separate transparent 2D sprite positioned with CSS
 * (per brief §3), so smaller screens can recompose him independently.
 */
import React from 'react';
import { useSettings } from '@/data/settingsStore';
import cityEn from '@/assets/home/home-city-en.jpg';
import cityHi from '@/assets/home/home-city-hi.jpg';
import boyBack from '@/assets/home/guide-boy-back.png';

export function HomeBackground() {
  const { language } = useSettings();

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Illustrated city plate (language-matched signage baked in) */}
      <img
        src={language === 'hi' ? cityHi : cityEn}
        alt=""
        draggable={false}
        className="home-drift absolute inset-0 h-full w-full select-none object-cover object-[50%_25%]"
      />

      {/* Guide boy — 2D sprite, lower-left area, looking toward the city.
          Positioned on the open pathway between the buildings so he never
          covers the baked signboard text; on small screens the bottom UI
          column would hide him anyway, so he only renders from md up. */}
      <img
        src={boyBack}
        alt=""
        draggable={false}
        className="hidden md:block absolute bottom-[-1%] left-[20%] h-[38vh] w-auto select-none drop-shadow-[0_16px_14px_rgba(15,23,42,0.4)]"
      />

      {/* Soft vignette for overlay legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-950/15 via-transparent to-slate-950/35" />
    </div>
  );
}
