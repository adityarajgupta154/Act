# card

Source (app):
- `src/components/ui/card.tsx` (shadcn Card/Header/Title/Description/Content/Footer). 1 importer.
- `src/pages/adults/shared.tsx` `SectionCard` — dominant real-world panel: white surface, `rounded-2xl`, soft border, `shadow-sm`, generous padding, Fredoka section title + muted description; used across ParentDashboard/TeacherDashboard.
- Cream/amber variants: warm panel `#FBF8EF` with border `#E7CE8F` (avatar/economy UI); amber-50/100 info panels.

Build contract:
- Keep shadcn subcomponent API. Default surface = white, `rounded-2xl`, border, `shadow-sm`.
- Add `tone` styling guidance via className recipes documented in story: default (white), cream (`#FBF8EF`/`#E7CE8F`), navy (chrome `#16254C`, light text) — implement as a `variant` prop on Card (default/cream/navy).
- CardTitle uses display face; body Nunito.

Acceptance: 3 tones + header/content/footer composition in story; light+dark.
