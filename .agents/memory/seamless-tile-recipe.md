---
name: Seamless ground-tile recipe
description: Make a generated texture tile seamlessly, color-match it to an existing base color, and hide repetition in Phaser
---

Recipe for turning an AI-generated ground texture into a seamless, palette-safe Phaser tile (grass done Aug 2026; works for sand/dirt/water too).

**Steps (magick):**
1. `-resize 512x512^ -gravity center -extent 512x512` — square it.
2. Quiet the contrast + pull toward the map's base color: composite over `xc:'#<base>'` with `-compose blend -define compose:args=30` (≈30% flat).
3. Mean-match EXACTLY: measure `-resize 1x1 -format "%[fx:round(mean.r*255)] ..."`, then per-channel `-channel R -evaluate multiply target/current` (one round lands exact).
4. Seamless: `-roll +256+256` (seams move to center cross), then composite the ORIGINAL center back through a feathered cross mask (`xc:black` + white rects `0,240 512,272` / `240,0 272,512`, `-blur 0x14`). Edges stay rolled = perfectly tileable.
5. Verify: `magick -size 1024x1024 tile:out.png` and eyeball the 2x2.

**Why:** generated textures never tile and always drift brighter/darker than the map base; if the world has baked edge-fades to a known hex (Nyaya Nagri plate → #87ae2d), the tile MEAN must equal that hex or a band appears where the fade lands on the tile.

**How to apply (Phaser side):** one full-world TileSprite is cheap; add a SECOND TileSprite of the same texture at `setTileScale(1.41).setAlpha(0.45)` — incommensurate periods kill the recognizable repeat grid, and identical mean keeps color unchanged. Recognizable micro-motifs (dirt dashes) are what betray tiling, not the blades.
