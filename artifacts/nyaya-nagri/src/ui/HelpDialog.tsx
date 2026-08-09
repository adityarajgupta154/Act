import * as Dialog from '@radix-ui/react-dialog';
import { Phone, ShieldAlert, ExternalLink, Inbox, CheckCircle2, X } from 'lucide-react';
import { useUIStore, openHelp, closeHelp } from './uiStore';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';

/**
 * Get Help Now — visible on every screen (PRD §9.1). Helpline NUMBERS are
 * hard-coded digits and must remain identical in every language: Childline
 * 1098, Cyber Crime 155260. Only surrounding labels are localized; their
 * meaning is never altered.
 *
 * Task 12: the dialog is centrally controlled through the ui store, so the
 * SAME screen opens from the always-visible button, from quest-end safety
 * reminder cards, and automatically from the avatar's distress escalation
 * path. Entries are large, tappable deep links (tel: for one-tap calling on
 * mobile; https for the official reporting portals) — the platform educates
 * and deep-links to real support services, never replaces them (PRD §4.3).
 *
 * Task 25 (Home screen): an optional `card` trigger variant additionally
 * shows the two helpline numbers right on the button. It opens the exact
 * SAME shared screen — there is still only one help handler in the app.
 */
export function HelpDialog({ variant = 'pill' }: { variant?: 'pill' | 'card' } = {}) {
  const { helpPulse, helpOpen } = useUIStore();
  const t = useStrings();

  return (
    <Dialog.Root open={helpOpen} onOpenChange={(open) => (open ? openHelp() : closeHelp())}>
      <Dialog.Trigger asChild>
        {variant === 'pill' ? (
          <button
            className={cn(
              "flex items-center gap-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-5 py-4 md:px-6 md:py-4 rounded-full shadow-lg transition-transform active:scale-95 duration-200 pointer-events-auto",
              helpPulse && "animate-pulse ring-4 ring-red-500/50"
            )}
            aria-label={t.getHelpNow}
          >
            <ShieldAlert className="w-6 h-6 md:w-7 md:h-7" />
            <span className="font-display font-bold text-lg md:text-xl tracking-wide hidden sm:inline-block">{t.getHelpNow}</span>
          </button>
        ) : (
          <button
            className={cn(
              'pointer-events-auto flex w-full items-center justify-center gap-3 rounded-2xl xl:w-auto',
              'bg-gradient-to-b from-red-500 to-red-600 text-white px-4 py-2.5 xl:px-5 xl:py-3',
              'ring-2 ring-white/40 border-b-4 border-red-800 shadow-[0_14px_28px_-12px_rgba(127,29,29,0.9)]',
              'transition-all duration-150 hover:to-red-500 active:translate-y-0.5 active:border-b-2 touch-manipulation',
              helpPulse && 'animate-pulse ring-4 ring-red-400/60'
            )}
            aria-label={t.getHelpNow}
          >
            <span className="bg-white/20 rounded-full p-2 shrink-0">
              <ShieldAlert className="w-6 h-6 md:w-7 md:h-7" />
            </span>
            <span className="flex flex-col items-start text-left leading-tight">
              <span className="font-display font-bold text-base md:text-lg xl:text-xl">{t.getHelpNow}</span>
              {/* Canonical service names + numbers, identical in every
                  language (PRD §9): they are what a child reads out or dials. */}
              <span className="mt-0.5 text-[11px] md:text-xs font-semibold text-white/95">Childline 1098</span>
              <span className="text-[11px] md:text-xs font-semibold text-white/95">Cyber Crime 155260</span>
            </span>
          </button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-5 md:p-7 w-[92vw] max-w-md max-h-[88vh] overflow-y-auto shadow-2xl z-50 animate-in zoom-in-95 duration-200 focus:outline-none">
          <div className="flex justify-between items-center mb-5">
            <Dialog.Title asChild>
              <h2 className="font-display font-bold text-2xl text-slate-800">{t.emergencyHelp}</h2>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors touch-manipulation"
                aria-label={t.close}
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            {/* Childline 1098 — one-tap call + calm "what happens" explainer */}
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
              <span className="text-sm font-bold text-red-600 uppercase tracking-wider">{t.childline}</span>
              <a
                href="tel:1098"
                className="mt-2 bg-white rounded-2xl p-3 border-2 border-red-200 hover:border-red-400 active:scale-[0.99] shadow-sm transition-all flex items-center gap-3 touch-manipulation"
              >
                <div className="bg-red-500 p-3 rounded-full shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl md:text-4xl font-display font-bold text-slate-800">1098</span>
                <span className="ml-auto text-sm font-bold text-red-600 text-right">{t.callNow}</span>
              </a>
              <p className="mt-4 text-sm font-bold text-slate-700">{t.whatHappensWhenYouCall}</p>
              <ul className="mt-2 space-y-2">
                {t.helpBullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cyber Crime 155260 — one-tap call + official reporting portal */}
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
              <span className="text-sm font-bold text-orange-600 uppercase tracking-wider">{t.cyberCrime}</span>
              <p className="mt-1 text-sm text-slate-600 font-medium">{t.cyberCrimeNote}</p>
              <a
                href="tel:155260"
                className="mt-2 bg-white rounded-2xl p-3 border-2 border-orange-200 hover:border-orange-400 active:scale-[0.99] shadow-sm transition-all flex items-center gap-3 touch-manipulation"
              >
                <div className="bg-orange-500 p-3 rounded-full shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl md:text-4xl font-display font-bold text-slate-800">155260</span>
                <span className="ml-auto text-sm font-bold text-orange-600 text-right">{t.callNow}</span>
              </a>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 bg-white rounded-2xl px-4 py-3 border border-orange-200 hover:bg-orange-100 active:scale-[0.99] transition-all flex items-center gap-2 font-bold text-sm text-orange-700 touch-manipulation"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                {t.openCyberPortal}
              </a>
            </div>

            {/* POCSO e-Box — NCPCR online complaint mechanism (PRD §4.3) */}
            <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100">
              <span className="text-sm font-bold text-sky-600 uppercase tracking-wider flex items-center gap-2">
                <Inbox className="w-4 h-4" />
                {t.pocsoEbox}
              </span>
              <p className="mt-1 text-sm text-slate-600 font-medium">{t.pocsoEboxNote}</p>
              <a
                href="https://ncpcr.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 bg-white rounded-2xl px-4 py-3 border border-sky-200 hover:bg-sky-100 active:scale-[0.99] transition-all flex items-center gap-2 font-bold text-sm text-sky-700 touch-manipulation"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                {t.openNcpcrSite}
              </a>
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-slate-500 font-medium">
            {t.available247}
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
