---
name: Reference-frame layout (Nyaya Nagri screens)
description: How to reproduce a supplied reference frame across desktop viewport heights without the composition drifting.
---

**Rule:** Measure the reference frame once as viewport fractions (panel top / bottom / mid-line, hero-art height, crest size), then build to those fractions with viewport units — never a percentage-height chain.

**Why:** `min-height: 100%` resolves to zero when an ancestor's height is auto, so `my-auto` centring silently collapses and the panel drifts toward the top of the screen. Two rebuild rounds were spent chasing this before the cause was found. Separately, a panel whose height is purely intrinsic keeps its reference share at one viewport height and loses it at another, because rem caps stop binding and text re-wraps.

**How to apply:**
- Pin the centring column to `100dvh`, not `100%`.
- Give the panel a `min-h` in `vh` equal to its measured share of the reference, make it a flex column, and let the row list be `flex-1 justify-between` so surplus height lands in the gaps between rows instead of one dead band.
- Express type and padding as `clamp(min, Xvh, rem-cap)`: the `vh` coefficient governs short screens (~800), the rem cap governs tall ones (~1080). Tune each at the viewport where it binds; changing a cap does nothing at 800.
- Watch for discrete jumps: a body-text cap that lets one row wrap to an extra line moves the whole panel by several vh.
- Keep decorative art off the panel by clamping its width against the panel's own minimum width in the same rem unit (`min(Xvw, Yvh, 45vw - halfPanelMin)`), so overlap is impossible by construction rather than by breakpoint.
- When the card is taller than the mobile viewport, `my-auto` pins it to the top and it collides with the fixed chrome (header/dots/crest). Add extra `pt-*` below `lg` sized to the chrome stack (e.g. `pt-[8.5rem] sm:pt-[5.5rem] lg:pt-6`) instead of shrinking content.
- A pill row that misses single-line fit by <15px: slim only THAT row via a dedicated base-class string (same `py` so heights match); several rounds of shaving global pill metrics for one row's sake degrade every other row first.

## Measuring build-vs-reference edges
Compare edges with the SAME pixel detector run on BOTH images, and prefer the gold RIM over the cream face: gradient faces (light→dark cream) drop below a strict cream threshold partway down, under-reporting the bottom edge by 10vh+; light top rims need looser gold thresholds (g<175 missed #f2cd7e). Print ALL detector runs in a column and pick the border run adjacent to the face — first/last gets contaminated by pavement/props.
