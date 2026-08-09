---
name: Nyaya Nagri home plates & image tooling
description: How the 2D home backdrop plates (EN/HI baked signage) and boy sprite were produced; regeneration recipe + container image-tooling quirks.
---

## Regenerating the home backdrop plates
`src/assets/home/home-city-{en,hi}.jpg` are BAKED composites: AI base plate + ImageMagick-composited signboard text (AI-rendered text spells unreliably; labels must be composited).
- Base: `attached_assets/generated_images/home_city_wide.png` (1024², blank gold signboards + blank navy banner). Upscale to 1600² Lanczos BEFORE compositing so text stays crisp.
- Fonts: Baloo 2 SemiBold/Bold with Devanagari from gwfh.mranftl.com (google-webfonts-helper; Fredoka has NO Devanagari). Copy to `~/.fonts` + `fc-cache -f` so pango finds them by family name.
- EN labels: IM `caption:` (auto-fits text to box). HI labels: MUST use `pango:` — `caption:` does no complex shaping (Devanagari conjuncts/matras break); render big via pango → `-trim` → `-resize` into box → center on transparent canvas. `&#10;` = newline in pango markup.
- Emboss = light copy (#ffe9a8) offset +2px under dark text (#4a2508); banner text gold #f2c14e.
- Plaque boxes at 1600-scale (NorthWest offsets, W×H): red +30+860 130×52, green +220+870 132×60, blue +428+868 130×62, purple +1080+888 130×58, pink +1262+892 130×58, gold temple +1442+868 130×62, palace banner +654+530 300×70.
- Zone mapping L→R: red=Safe Zone, green=Right to Childhood, blue=School Rights, purple=Digital Safety, pink=Family & Community, gold=Justice System. Banner: KNOW YOUR RIGHTS / अपने अधिकार जानो.
- Encode: `-strip -interlace Plane -quality 80` (~750KB each).

**Why baked + square:** labels must track buildings under object-cover crops (HTML overlays would drift); the square plate adapts better than 16:9 (portrait phones get full scene height, desktop crops vertically via `object-[50%_25%]`).

**Mobile boy decision:** redesign spec §13's "Keep fully visible" list = logo / welcome / central visual / Enter / Get Help — the boy is NOT on it. He is `hidden md:block` deliberately (below md he was an unreadable sliver behind the full-width UI column, and showing him forces the text overlap §13 forbids). An architect review once flagged this as a spec violation — the spec text says otherwise; keep the decision.

## Container image-tooling quirks
- `generateImage` is prompt-only here (no input-image editing/inpainting) — you cannot AI-erase or restyle an existing reference image; regenerate in-style and composite instead.
- `resolution:'high'` + `removeBackground:true` returned a PNG whose RGB still holds the full background but whose ALPHA mask is correct — and ReadFile's image preview renders RGB IGNORING alpha, so transparent PNGs look opaque. Judge transparency via `%[fx:mean.a]` or flatten over magenta first.
- `removeImageBackground` CodeExecution callback WORKS despite the "TODO: not implemented" note inside its SKILL.md.
- pango + librsvg delegates ARE present in this container's ImageMagick (`magick -list format | grep -i pango`).
