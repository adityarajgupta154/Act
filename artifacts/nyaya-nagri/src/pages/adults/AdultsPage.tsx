/**
 * Adult insights hub — PIN gate (set / enter) + navigation cards.
 *
 * HONEST SCOPE, stated in the UI: local demo gate for a single-device
 * prototype (see src/insights/adultGate.ts). Resetting the PIN never
 * touches learning data.
 */
import { useState } from 'react';
import { Link } from 'wouter';
import {
  ArrowLeft,
  FileText,
  GraduationCap,
  HeartHandshake,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useStrings } from '@/i18n/strings';
import {
  clearPin,
  hasPin,
  isUnlocked,
  isValidPinFormat,
  markUnlocked,
  setPin,
  verifyPin,
} from '@/insights/adultGate';

type GateState = 'set' | 'enter' | 'open';

export default function AdultsPage() {
  const t = useStrings();
  const [state, setState] = useState<GateState>(() =>
    isUnlocked() ? 'open' : hasPin() ? 'enter' : 'set',
  );
  const [pin, setPinValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const submitSet = async () => {
    if (busy) return;
    setError(null);
    if (!isValidPinFormat(pin)) {
      setError(t.adultPinFormatError);
      return;
    }
    if (pin !== confirm) {
      setError(t.adultPinMismatch);
      return;
    }
    setBusy(true);
    const ok = await setPin(pin);
    setBusy(false);
    if (ok) {
      markUnlocked();
      setPinValue('');
      setConfirm('');
      setState('open');
    } else {
      setError(t.adultPinFormatError);
    }
  };

  const submitEnter = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    const ok = await verifyPin(pin);
    setBusy(false);
    if (ok) {
      markUnlocked();
      setPinValue('');
      setState('open');
    } else {
      setError(t.adultPinWrong);
    }
  };

  const inputCls =
    'w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-extrabold text-slate-700 text-center tracking-[0.3em] focus:border-slate-500 outline-none bg-white';

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-800">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <a
          href={import.meta.env.BASE_URL}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {t.adultBackToGame}
        </a>

        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-8 h-8 text-indigo-500 shrink-0" />
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
            {t.adultAreaTitle}
          </h1>
        </div>
        <p className="text-slate-500 font-medium mb-6 leading-relaxed">{t.adultAreaIntro}</p>

        {state !== 'open' && (
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 mb-4">
            <h2 className="font-extrabold text-slate-700 text-lg mb-1 inline-flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-400" />
              {state === 'set' ? t.adultSetPinTitle : t.adultEnterPinTitle}
            </h2>
            {state === 'set' && (
              <p className="text-sm text-slate-500 font-medium mb-4">{t.adultSetPinSub}</p>
            )}
            <form
              className="space-y-3 max-w-xs"
              onSubmit={(e) => {
                e.preventDefault();
                void (state === 'set' ? submitSet() : submitEnter());
              }}
            >
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={pin}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
                placeholder={t.adultPinPlaceholder}
                className={inputCls}
                aria-label={t.adultPinPlaceholder}
              />
              {state === 'set' && (
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))}
                  placeholder={t.adultPinConfirmPlaceholder}
                  className={inputCls}
                  aria-label={t.adultPinConfirmPlaceholder}
                />
              )}
              {error && <p className="text-sm font-bold text-orange-600">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-slate-700 text-white font-extrabold hover:bg-slate-800 disabled:opacity-50 touch-manipulation"
              >
                {state === 'set' ? t.adultSetPinBtn : t.adultUnlock}
              </button>
            </form>

            {state === 'enter' && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                {!resetArmed ? (
                  <button
                    onClick={() => setResetArmed(true)}
                    className="text-sm font-bold text-slate-400 hover:text-slate-600"
                  >
                    {t.adultForgotPin}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 font-medium">{t.adultForgotPinNote}</p>
                    <button
                      onClick={() => {
                        clearPin();
                        setResetArmed(false);
                        setPinValue('');
                        setError(null);
                        setState('set');
                      }}
                      className="px-4 py-2 rounded-full border-2 border-orange-200 bg-orange-50 text-sm font-bold text-orange-600 hover:border-orange-400 touch-manipulation"
                    >
                      {t.adultForgotPin}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {state === 'open' && (
          <div className="space-y-3 mb-4">
            <HubCard
              href="/adults/teacher"
              icon={<GraduationCap className="w-6 h-6 text-indigo-500" />}
              title={t.adultTeacherCard}
              sub={t.adultTeacherCardSub}
            />
            <HubCard
              href="/adults/parent"
              icon={<HeartHandshake className="w-6 h-6 text-rose-500" />}
              title={t.adultParentCard}
              sub={t.adultParentCardSub}
            />
            <HubCard
              href="/adults/report"
              icon={<FileText className="w-6 h-6 text-emerald-500" />}
              title={t.adultReportCard}
              sub={t.adultReportCardSub}
            />
            <button
              onClick={() => {
                import('@/insights/adultGate').then((m) => m.lockNow());
                setState('enter');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-slate-200 bg-white text-sm font-bold text-slate-600 hover:border-slate-400 touch-manipulation"
            >
              <Lock className="w-4 h-4" /> {t.adultLock}
            </button>
          </div>
        )}

        <p className="text-xs text-slate-400 font-medium leading-relaxed mb-3">
          {t.adultGateNote}
        </p>
        <p className="text-xs text-slate-400 font-medium leading-relaxed">{t.insDisclaimer}</p>
      </div>
    </div>
  );
}

function HubCard({
  href,
  icon,
  title,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 bg-white rounded-3xl border-2 border-slate-100 p-5 hover:border-slate-300 transition-colors touch-manipulation"
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-extrabold text-slate-700 leading-tight">{title}</p>
        <p className="text-sm text-slate-500 font-medium leading-snug mt-0.5">{sub}</p>
      </div>
    </Link>
  );
}
