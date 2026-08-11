# button

Source (app `artifacts/nyaya-nagri`):
- `src/components/ui/button.tsx` (shadcn CVA; variants default/destructive/outline/secondary/ghost/link; sizes default/sm/lg/icon; focus ring, disabled opacity). 6 importer files.
- `src/home/PrimaryCta.tsx` — THE brand CTA: `rounded-full bg-gradient-to-b from-orange-400 to-orange-600 text-white ring-2 ring-white/60 border-b-4 border-orange-800 shadow-[0_18px_35px_-12px_rgba(194,65,12,0.9)]`, Fredoka (`font-display`), active:scale press.
- Navy chrome buttons: `#14306E` solid, hover `#1d3f8c` (QuestPlayer.tsx:224, ProgressScreen.tsx:385); HUD nav `#16254c`.
- Green success CTA: `bg-gradient-to-b from-[#4cb653] to-[#1f7c2f] ring-2 ring-white/40 border-b-4 border-[#14532d]` (onboarding/WelcomeScene.tsx:164).

Build contract:
- Keep shadcn/Radix `Slot` + CVA API (`variant`, `size`, `asChild`).
- Variants: `default` = orange gradient pill (brand CTA above, incl. white ring + darker bottom border press-depth), `navy`, `secondary` (sky #0DA9E6 family), `success` (green gradient), `destructive`, `outline`, `ghost`, `link`.
- Shape: pill (`rounded-full`) is the brand signature for default/navy/secondary/success; outline/ghost may stay rounded-lg.
- Labels use display face (Fredoka). Min touch target 44px at default/lg (app a11y rule, index.css:167-173). `active:scale-[0.98]` press feel; reduced-motion safe.

Acceptance: all variants+sizes in story; light+dark; keyboard focus ring visible.
