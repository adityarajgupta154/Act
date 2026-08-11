# dialog

Source (app):
- `src/components/ui/dialog.tsx` (Radix Dialog, centered `max-w-lg`, p-6, `shadow-lg`, fade/zoom animations). 1 importer.
- App modal shells (visual authority): Map/Help/Info/Certificate modals — big friendly white panel `rounded-3xl`, icon tile + Fredoka title header centered, pill close button top-right (`rounded-full` white/ring), soft `shadow-2xl`, overlay `bg-slate-900/50`.

Build contract:
- Keep Radix implementation + shadcn API (Dialog/Trigger/Content/Header/Footer/Title/Description/Close).
- Restyle: `rounded-3xl`, larger padding, overlay slate-900/50 backdrop, close as circular pill button, DialogTitle in display face, centered header option.
- Depends on: button (close/footer actions).

Acceptance: closed-by-default story with trigger; title/description/footer actions; ESC/overlay dismiss; light+dark.
