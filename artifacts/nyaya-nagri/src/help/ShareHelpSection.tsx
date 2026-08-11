import { useRef, useState } from 'react';
import { Share2, Users } from 'lucide-react';
import { useStrings } from '@/i18n/strings';

/**
 * "Need an adult?" — trusted-adult section of the Get Help Now hub
 * (spec §36). Shares the canonical helpline card via the native Web Share
 * sheet when available, else copies it to the clipboard.
 *
 * PRIVACY: the shared text is the FIXED helpline info only — it never
 * includes the child's location, and the child alone picks the recipient
 * in the OS sheet. Helpline digits are canonical and language-invariant
 * (PRD §9 rule mirrored from HelpDialog).
 */
const SHARE_TEXT = [
  'Nyaya Nagri — Help information',
  'Emergency: 112',
  'Childline: 1098',
  'Cyber Crime: 155260',
  'Report online: cybercrime.gov.in',
].join('\n');

export function ShareHelpSection() {
  const t = useStrings();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: SHARE_TEXT });
        return;
      } catch {
        return; // user closed the sheet — nothing to do
      }
    }
    try {
      await navigator.clipboard.writeText(SHARE_TEXT);
      setCopied(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard blocked — leave the button as-is; helplines stay visible above
    }
  };

  return (
    <section aria-label={t.needAdult} className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
      <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-violet-600">
        <Users className="h-4 w-4" aria-hidden />
        {t.needAdult}
      </span>
      <p className="mt-1 text-sm font-medium text-slate-600">{t.needAdultNote}</p>
      <button
        type="button"
        onClick={share}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-bold text-violet-700 transition-all hover:bg-violet-100 active:scale-[0.99] touch-manipulation"
      >
        <Share2 className="h-4 w-4" aria-hidden />
        {copied ? t.shareCopied : t.shareHelpInfo}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? t.shareCopied : ''}
      </span>
    </section>
  );
}
