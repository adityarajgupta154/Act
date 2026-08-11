# form-controls (Input + Textarea + Label)

Source (app):
- `src/components/ui/input.tsx` (2 importers), `textarea.tsx` (1), `label.tsx` (2) — standard shadcn form controls, theme border/radius/focus-ring/disabled.
- App a11y rules (src/index.css:155-178): `:focus-visible` = 3px solid blue outline + 2px offset; min 44px touch targets on inputs/buttons/selects.
- Warm palette: border `hsl(45 20% 85%)`, focus ring = orange primary.

Build contract:
- Keep shadcn APIs. Inputs `rounded-xl`+ (friendlier than stock rounded-md), min-h 44px, cream border, orange focus ring; Label in Nunito semibold.
- Placeholder = mutedForeground; disabled = opacity + no ring.

Acceptance: input/textarea/label composed story with default, focus, disabled, error(aria-invalid) states; light+dark.
