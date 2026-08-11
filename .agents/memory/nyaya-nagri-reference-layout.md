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

## Floating safety cluster clearance (phones)
The Get Help Now shield + mascot float fixed at the bottom-right corner ABOVE every overlay (z-order). Any full-screen overlay that puts a control in its bottom-right corner must reserve ~56-64px right clearance at phone widths (e.g. `pr-14 md:pr-0` on the bar) or the control gets painted under the shield.
**Why:** Story overlay's bottom-nav Next was partially hidden behind the shield at 402px; user task explicitly forbids overlap with the assistant/help buttons.
**How to apply:** any new overlay/bottom bar with a right-aligned action — add phone-width right padding; desktop centered columns clear it naturally.

## vh-band placement vs mobile bottom stack (short landscape)
A spec that pins an element's centre to a viewport band (e.g. 60–65vh) is geometrically impossible on short landscape phones when an in-flow bottom stack (help bar + assistant row) occupies the lower ~10rem. Clamp continuously instead of adding a breakpoint: `top-[min(62dvh,calc(100dvh_-_<reserve>rem))]` — taller viewports keep the band untouched, short ones rise just enough.
**Why:** portrait/desktop captures never exercise this; an architect round caught the collision at 667×375. Always sanity-check ~375px-tall landscape when placing anything by vh band.

## aspect-ratio + max-h breaks the ratio
`aspect-video` + `max-h-[Xvh]` on a `w-full` box does NOT keep 16:9 — the height caps but width stays full, so short viewports render an ultra-wide banner and object-cover over-crops the art.
**Why:** completion-screen hero card came out ~2.65:1 at 720-768px-tall desktops; caught by architect review.
**How to apply:** cap the WIDTH from the height budget instead — `max-w-[calc-of-vh]` (e.g. 44vh tall 16:9 card → `md:max-w-[78vh]`), and put the cap on the relative wrapper so absolute accents keep hugging the card.

## Centered bottom bars vs the help cluster (md tablets)
A bottom-centered pill bar collides with the HUD's Get Help cluster (bottom-right, z-50) at md widths (~768px) — bar+cluster together exceed the viewport. Rule: anchor the bar LEFT at md (`left-6`), recenter only at lg+ (`lg:left-1/2 lg:-translate-x-1/2`). **Why:** the cluster floats above every overlay and cannot move; centered bars get covered exactly on tablets.
