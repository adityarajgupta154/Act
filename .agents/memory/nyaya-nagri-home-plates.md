---
name: Nyaya Nagri home screen artwork
description: Where the 2D landing screen's art comes from (user-supplied, used verbatim), which screen bands overlays may occupy, and the text-baking recipe kept for emergencies.
---

## Source of the artwork (current rule)
The home backdrop and the guide boy are the USER'S OWN supplied illustrations, used **verbatim**: one city painting as the background layer and one transparent boy sprite as a CSS-positioned foreground layer (never flattened into the background, so his scale/position stay tunable per breakpoint).

**Why:** the user iterated twice on agent-generated city plates, then supplied their own final art with an explicit "DO NOT RECREATE THE ARTWORK — do not generate alternative buildings or another character" brief. Regenerating or repainting their art is a spec violation, not an improvement.

**How to apply:** for any future home-screen visual request, change CSS (crop bias, position, scale, overlay placement) — not the pixels. Only bake/repaint if the user asks for it in that request.

## Overlay safe zones under `object-cover`
The painted zone signboards land at roughly **40–48% of viewport height** on every wide desktop size, and that stays stable across 1280/1440/1920 because `object-cover` scales by width and the crop bias is proportional. Keep HTML overlays out of that band on the left half: the welcome bubble goes **above** it (sky/hillside), the CTA cluster **below** it (plaza).

**How to apply:** predict before screenshotting — displayed height = viewportWidth ÷ imageAspect; topOffset = (displayedHeight − viewportHeight) × objectPositionY; screenY = (sourceY × scale − topOffset) ÷ viewportHeight.

## Signage language tradeoff
The supplied artwork has English zone signage painted in, so Hindi mode shows English signs while all UI chrome still translates. Accepted deliberately because the brief forbids modifying the artwork. Revisit only on request — then use the baking recipe below.

## Baking text onto a plate (only if asked)
- EN labels: ImageMagick `caption:` auto-fits to a box. HI labels **must** use `pango:` — `caption:` does no Devanagari shaping (conjuncts/matras break). Render big via pango → `-trim` → resize into the box.
- Fonts: Baloo 2 (Devanagari + Latin) installed in `~/.fonts` + `fc-cache -f`; Fredoka has no Devanagari. `magick` text draws need an explicit `-font` or they error.
- Shadow/emboss offset must scale with box height (≈ h/18, min 2px); a fixed 3–4px offset makes small plaques look doubled.
- Locate blank plaques programmatically (flood-fill from the dominant colour inside a search window) instead of eyeballing coordinates.

## Mobile boy decision
The redesign spec's "keep fully visible" list = logo / welcome / central visual / Enter / Get Help — the boy is NOT on it. He is `hidden md:block` deliberately (below md he is an unreadable sliver behind the full-width UI column, and showing him forces the text overlap the spec forbids). An architect review once flagged this as a spec violation; the spec text says otherwise — keep the decision.

## Container image-tooling quirks
- `generateImage` is prompt-only here (no input-image editing/inpainting) — you cannot AI-erase or restyle an existing reference image.
- `resolution:'high'` + `removeBackground:true` can return a PNG whose RGB still holds the full background while the ALPHA mask is correct — and ReadFile's image preview renders RGB IGNORING alpha, so transparent PNGs look opaque. Judge transparency via `%[fx:mean.a]` or flatten over magenta first.
- `removeImageBackground` CodeExecution callback WORKS despite the "TODO: not implemented" note inside its SKILL.md.
- pango + librsvg delegates ARE present in this container's ImageMagick (`magick -list format | grep -i pango`).
