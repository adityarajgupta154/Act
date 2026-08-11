# Nyaya Nagri — component inventory (source: existing workspace app `artifacts/nyaya-nagri`)

Source kind: existing workspace app (implementation-code-seeded). Family list = the
primitives the app actually consumes plus the app-level visual primitives it ships as
repeated patterns/compositions. Unconsumed scaffold stock (0 importers) is NOT part of
the source's real component set and is excluded.

Ranking evidence = distinct consumer files (grep) + pattern pervasiveness.

| family | reference | deps/blockers | evidence | chunk | status |
| --- | --- | --- | --- | --- | --- |
| button | components/button.md | none | ui/button 6 importers + PrimaryCta + navy chrome btns + green CTA | 1 (pilot) | pending |
| card | components/card.md | none | ui/card 1 + SectionCard (many, adults dashboards) + cream panels | 1 (pilot) | pending |
| dialog | components/dialog.md | button | ui/dialog 1 + HelpDialog/InfoDialog/CertificateModal/Map modal shells | 1 (pilot) | pending |
| form-controls | components/form-controls.md | none | ui/input 2, ui/label 2, ui/textarea 1; 44px touch-target rule | 1 (pilot) | pending |
| badge | components/badge.md | none | chip pattern pervasive; LabelBadge/ConfidenceBadge (adults/shared) | 1 (pilot) | pending |
| toast | components/toast.md | none | ui/toast 3 + toaster 1 | 2 | pending |
| progress | components/progress.md | none | rounded-full h-3 track pattern (ParentDashboard:44, HUD indicators) | 2 | pending |
| tooltip | components/tooltip.md | none | ui/tooltip 2 | 2 | pending |
| separator | components/separator.md | none | ui/separator 4 | 2 | pending |
| skeleton | components/skeleton.md | none | ui/skeleton 1 | 2 | pending |
| sheet | components/sheet.md | none | ui/sheet 1 | 3 | pending |
| toggle | components/toggle.md | none | ui/toggle 1 | 3 | pending |
