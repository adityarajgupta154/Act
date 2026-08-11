import * as Dialog from '@radix-ui/react-dialog';
import { Phone, ShieldAlert, ExternalLink, Inbox, CheckCircle2, X } from 'lucide-react';
import { useUIStore, openHelp, closeHelp } from './uiStore';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';
import { EmergencySection } from '@/help/EmergencySection';
import { NearbyHelpSection } from '@/help/NearbyHelpSection';
import { ShareHelpSection } from '@/help/ShareHelpSection';

/**
 * Get Help Now — visible on every screen (PRD §9.1). Helpline NUMBERS are
 * hard-coded digits and must remain identical in every language: Emergency
 * 112, Childline 1098, Cyber Crime 155260. Only surrounding labels are
 * localized; their meaning is never altered.
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
 *
 * EMERGENCY ASSISTANCE HUB (Aug 2026): the same screen now leads with the
 * 112 real-emergency block and an explicit-consent "Find Help Near Me"
 * nearby-healthcare search (hub spec). Ordering is deliberate: 112 first
 * and NEVER dependent on location/API/network (spec §15), then Childline,
 * then nearby search, then trusted-adult sharing, then online reporting.
 * The hub has NO voice/AI wiring of any kind (spec §13) — the Gemini voice
 * stack stays isolated in Story Adventure. On phones the screen is a
 * bottom sheet; on desktop the familiar centered card.
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
              // Compact floating safety card (Aug 2026 compact-widget spec):
              // forms ONE visual group with the Nyaya AI robot sitting
              // directly above it. Deliberately smaller and calmer than the
              // old banner — soft red/coral gradient, 22px radius, subtle
              // shadow, small shield chip; no thick borders or arcade bevel.
              'pointer-events-auto flex items-center gap-3 rounded-[22px] text-left',
              'bg-gradient-to-br from-red-500 to-rose-600 text-white px-[18px] py-3.5',
              'shadow-[0_10px_24px_-10px_rgba(127,29,29,0.55)]',
              'transition-all duration-150 hover:from-red-400 hover:to-rose-500 active:scale-[0.98] touch-manipulation',
              'md:min-w-[280px]',
              helpPulse && 'animate-pulse ring-4 ring-red-400/60'
            )}
            aria-label={t.getHelpNow}
          >
            <span className="bg-white/20 rounded-full p-2 shrink-0">
              <ShieldAlert className="w-5 h-5 md:w-6 md:h-6" aria-hidden />
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span className="font-display font-bold text-lg md:text-xl">{t.getHelpNow}</span>
              {/* Canonical service names + numbers, identical in every
                  language (PRD §9): they are what a child reads out or dials. */}
              <span className="mt-0.5 text-[13px] md:text-sm font-semibold text-white/95">Childline 1098</span>
              <span className="text-[13px] md:text-sm font-semibold text-white/95">Cyber Crime 155260</span>
            </span>
          </button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        {/* Phone: full-width bottom sheet with safe-area padding (hub spec
            §25). Desktop: the familiar centered card. */}
        <Dialog.Content
          className={cn(
            'fixed z-50 bg-white shadow-2xl focus:outline-none overflow-y-auto',
            'inset-x-0 bottom-0 w-full max-h-[92dvh] rounded-t-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]',
            'animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-200',
            'md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
            'md:w-[92vw] md:max-w-lg md:max-h-[88vh] md:rounded-3xl md:p-7 md:slide-in-from-bottom-0'
          )}
        >
          <div className="flex justify-between items-center">
            <Dialog.Title asChild>
              <h2 className="font-display font-bold text-2xl text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-7 h-7 text-red-500 shrink-0" aria-hidden />
                {t.getHelpNow}
              </h2>
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
          <Dialog.Description asChild>
            <p className="mt-1 mb-5 text-sm font-medium text-slate-500">{t.helpHubSubtitle}</p>
          </Dialog.Description>

          <div className="space-y-4">
            {/* SECTION A — real emergency, 112 first, never gated (spec §15) */}
            <EmergencySection />

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

            {/* SECTION B — nearby healthcare search (explicit consent only) */}
            <NearbyHelpSection />

            {/* Trusted adult — share the canonical helpline card (spec §36) */}
            <ShareHelpSection />

            {/* Online reporting — existing portals, unchanged */}
            <p className="pt-1 text-sm font-bold uppercase tracking-wider text-slate-400">{t.moreHelp}</p>

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
