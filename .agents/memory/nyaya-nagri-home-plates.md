---
name: Nyaya Nagri home screen artwork
description: Where the 2D landing screen's art comes from (user-supplied, used verbatim), the double-rollback history that locks the current design, overlay rules, and the text-baking/cutout recipes kept for emergencies.
---

## Source of the artwork (current rule — ORIGINAL plate, restored Aug 11, 2026)
The home backdrop is the ORIGINAL committed trio, exactly as in git history ("Published your App" era):
- `home-city.webp` (1537×1023) — palace with painted "KNOW YOUR RIGHTS" banner, Lady Justice, zone buildings + signage, Indian flag, waterfall, distant castles. Rendered as ONE `object-cover` image with `object-[50%_12%]` bias (keeps dome + flag when 16:9 crops).
- `guide-boy.webp` — SEPARATE transparent sprite, md+ only, `bottom-[3%] left-[10%] h-[54vh]` (lg 56, xl 58). Never flattened into the plate.
- `home-blimp.webp` — "Nyaya Nagri" airship cutout, md+ only, STATIC at its `left-[68%] top-[10%] w-[13.5%]` anchor. The Aug 2026 drift/float animation was REMOVED on explicit user order (Aug 11, 2026, "isko static hi rehne do") — do not re-animate it unless asked.
Chrome (logo+tagline top-left, About/Settings pills, ENTER at ~67dvh, robot AI widget, Get Help Now card) is real DOM. There is NO player-profile chip, NO map card, NO bottom quick-nav pill on Home in this design.
- Assistant + Get Help Now = ONE compact floating group (user spec, Aug 11, 2026): a single bottom-right flex-col items-end container with an 8–10px gap, robot directly above a compact card (rounded-[22px], red→rose gradient, md:min-w-[280px], no full-width mobile bar, no arcade bevel). Never re-spread them with independent viewport coordinates.

## Rollback history — the design is LOCKED to the original (Aug 11, 2026)
One day saw two full user-ordered rollbacks: (1) reference-mock redesign (v2/v3 chrome-erased plates, extra home chrome: player chip, map card, bottom nav) → (2) uploaded map1.jpeg swap + 3:2 `object-contain` desktop rule → user demanded "FULLY UNDO… pura undo karo pehle ki tarah" back to the ORIGINAL. Everything era-B/map1 was reverted; v2/v3/map1 assets deleted (reference uploads survive in `attached_assets/`). The restore was a clean `git checkout HEAD -- src/home/` because index.css had already been reverted to HEAD byte-identical.

**Why:** home art direction proved volatile — two redesigns were approved-then-rejected same day. The committed/published design is the user's real preference.

**How to apply:** never re-introduce the v2/v3 plates, map1, the contain rule, or the extra home chrome (player chip / map card / bottom nav) unless a NEW explicit request asks; for visual tweaks change CSS, not pixels; keep each home change small and precisely documented (commits are sparse — "immediately before" states are otherwise unrecoverable).

## Overlay rules
- **Welcome bubble: REMOVED for good (Aug 9, 2026).** Deleted twice by the user. Do NOT reintroduce it or new left-side overlays unless explicitly asked.
- Keep HTML overlays clear of the plate's painted signboard band; verify per plate with desktop+tablet+mobile screenshots. Predict before screenshotting: displayedHeight = viewportWidth ÷ imageAspect; topOffset = (displayedHeight − viewportHeight) × objectPositionY; screenY = (sourceY × scale − topOffset) ÷ viewportHeight.
- Below `md` the boy sprite and blimp are hidden by design (stacked mobile UI fills that space) — do not "fix" their absence on phones.

## Signage language tradeoff
The artwork has English signage painted in, so Hindi mode shows English signs while all UI chrome translates. Accepted deliberately: the brief forbids modifying the artwork. Revisit only on request — then use the baking recipe below.

## Baking text onto a plate (only if asked)
- EN labels: ImageMagick `caption:` auto-fits to a box. HI labels **must** use `pango:` — `caption:` does no Devanagari shaping (conjuncts/matras break). Render big via pango → `-trim` → resize into the box.
- Fonts: Baloo 2 (Devanagari + Latin) installed in `~/.fonts` + `fc-cache -f`; Fredoka has no Devanagari. `magick` text draws need an explicit `-font` or they error.
- Shadow/emboss offset must scale with box height (≈ h/18, min 2px); a fixed 3–4px offset makes small plaques look doubled.
- Locate blank plaques programmatically (flood-fill from the dominant colour inside a search window) instead of eyeballing coordinates.
- Clone-patching chrome out of a painting: feather F≥18 in flat grass + sources checked against subjects, or seams read as rectangles at full size.

## Container image-tooling quirks
- `generateImage` is prompt-only here (no input-image editing/inpainting) — you cannot AI-erase or restyle an existing reference image.
- `resolution:'high'` + `removeBackground:true` can return a PNG whose RGB still holds the full background while the ALPHA mask is correct — and ReadFile's image preview renders RGB IGNORING alpha, so transparent PNGs look opaque. Judge transparency via `%[fx:mean.a]` or flatten over magenta first.
- `removeImageBackground` CodeExecution callback WORKS despite the "TODO: not implemented" note inside its SKILL.md.
- pango + librsvg delegates ARE present in this container's ImageMagick (`magick -list format | grep -i pango`).

## Cutting painterly elements out of a reference frame (world monuments round)
AI background removal fails on painterly scenes — it keeps the whole background. Deterministic winner: feathered ellipse vignette, `magick crop.png \( -size WxH xc:black -fill white -draw 'ellipse CX,CY RX,RY 0,360' -blur 0x6 \) -alpha off -compose CopyOpacity -composite out.png` — the soft halo carries its own grass and blends into any same-palette ground plate (sample the plate edge for the flat GRASS_BASE hex).
Locating baked-in UI to erase (padlocks, labels): color-mask connected components + zoomed side-by-side color|mask crops read visually. Eyeball pixel estimates cost ~6 failed clone-patch iterations; the mask method nailed all four in one pass.

## Replicating a full world mock (Aug 2026 village round)
- Check the reference's NATIVE pixel size (`magick identify`) FIRST — measuring a scaled preview once forced a complete re-measure (assumed 1024x683, real 1536x1024). Derive the mock's px/unit from a known in-world span, then place cutouts with `setScale(worldPxPerUnit / mockPxPerUnit)` (e.g. 40/29.6 → 1.35).
- A mock's zone ring is usually TIGHTER than gameplay allows: keep every zone-anchor pair ≥ 2× the proximity radius (circles must never intersect) and spread positions outward while preserving the composition's bearings. Also budget for the label pill + bottom HUD bar: south-row zones need z pulled up or their pills clip behind the bar.
- Baked-in UI floating over WATER: clone-patch with dense low-feather horizontal water bands — ghost gone; slight stylized wave banding is the accepted cost.

## Decorative motion on Home = CSS keyframes, never framer-motion
framer-motion sits in package.json (workspace catalog) but has ZERO imports in src — the project's animation system is CSS keyframes in index.css, and the Home brief mandates pure HTML/CSS. **Why:** task specs that say "use framer if installed" are outranked by their own "reuse the existing system first" clause, and importing it would ship ~35KB JS to the landing for decoration. **How to apply:** if home decoration is ever animated again, keep the wrapper's original CSS anchors and translate via calc(-<anchor>vw - 110%) → past-100vw keyframes — reduced-motion (animation:none) then automatically restores the exact static composition. Note: the blimp's drift built this way was later removed on user order (static preferred); the recipe stays valid for future asks.
