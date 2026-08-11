# badge

Source (app):
- `src/components/ui/badge.tsx` exists but unconsumed; the REAL chip language is inline patterns:
  - amber achievement chips: `bg-amber-50/100 text-amber-800 rounded-full px-3 py-1` (stats, streaks, gold `#C9A227` certificate accents)
  - status chips on navy/photo: `bg-white/80` translucent pill
  - `LabelBadge`, `ConfidenceBadge` in `src/pages/adults/shared.tsx` (semantic tone chips)
  - map/zone chips: white pill labels with shadow (story map, world map nodes)

Build contract:
- shadcn Badge API (CVA variant). All pills `rounded-full`.
- Variants: `default` (amber/gold achievement), `success` (green), `info` (sky), `navy`, `neutral` (cream/muted), `destructive`, `outline`.
- Nunito bold, compact px-3 py-1, optional leading dot/icon slot per app chips.

Acceptance: all variants in story incl. on-dark navy row; light+dark.
