---
name: Nyaya Nagri certificate system
description: Design invariants and capture/i18n lessons for the zone-completion certificate system
---

- Certificates are DERIVED state: reconciled from `completedZones` at BOTH progressStore ingresses — `load()` AND `update()` whenever the patch touches `completedZones`. UI code never writes them.
  **Why:** one source of truth strips forged/hand-edited records, makes issue atomic with zone completion, and auto-backfills legacy saves.
  **How to apply:** any future derived collection should reconcile at the same two ingresses, AND the constructor must persist the repaired loaded state back (boot write-back) — otherwise a legacy save regenerates fresh ids/dates on every reload until some unrelated update saves.

- Stable-id rule: certificate id + first-completion date NEVER change after issue; recipient nickname is LIVE from profile and never stored in the record (no PII beyond self-chosen nickname; wording must never imply external accreditation).

- html2canvas capture rules (certificate doc): inline hex colors only (Tailwind v4 oklch is unparseable); rasterize an offscreen NATURAL-SIZE copy, never the CSS-transformed preview; explicitly `document.fonts.load()` every face INCLUDING Devanagari ones before capture.
  **Why:** architect round found HI PDFs nondeterministic — the loaded web fonts were Latin-only and `fonts.ready` does not force lazy faces nothing on-page used yet. Fix = Noto Serif/Sans Devanagari in the Google Fonts import + in the doc's font stacks + explicit loads.

- SVG crest sizing: size each instance via its own wrapper (`className="h-full w-full"` inside a sized div). A shared `<style>` tag targeting `svg[viewBox=...]` blew ALL instances (header, watermark, seal) up to watermark size.
