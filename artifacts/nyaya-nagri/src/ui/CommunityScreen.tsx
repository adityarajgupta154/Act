/**
 * Nyaya Nagri — Rights Community screen (Task 11, PRD §6.5, §9.3)
 *
 * SAFETY BY DESIGN — read before changing anything here:
 *  - This screen contains NO free-text entry of any kind: no text fields,
 *    no text areas, no editable regions. Children only tap pre-written
 *    choices. The community smoke test statically enforces this.
 *  - Rights Circle: rotating multiple-choice reflection prompts. Selections
 *    live only in local component state — they are never persisted and
 *    never sent anywhere.
 *  - Circle Board: a STATIC, clearly-labeled simulation of what a moderated
 *    peer board would look like. In a real deployment, every post shown
 *    here would first be reviewed and approved by verified NGO staff or
 *    teachers (PRD §6.5); there is no mechanism for children to post, and
 *    none may be added without that moderation pipeline.
 *  - Ask a Legal Expert: static FAQ compiled from the reviewed legal
 *    content of Zones 1-5, framed as answers from moderated expert AMA
 *    sessions. Never AI-generated at runtime.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  MessageSquare,
  Scale,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, closeCommunity } from './uiStore';
import { useSettings } from '@/data/settingsStore';
import { useStrings } from '@/i18n/strings';
import { progressStore } from '@/data/progressStore';
import {
  BOARD_POSTS,
  CIRCLE_PROMPTS,
  EXPERT_FAQ,
  pickText,
  selectCirclePrompts,
  type CirclePrompt,
} from '@/community/content';

type CommunityTab = 'circle' | 'board' | 'expert';

function ZoneChip({ zoneId }: { zoneId: string | null }) {
  const t = useStrings();
  const label =
    zoneId === null ? t.generalPromptTag : t.fromZone(t.zones[zoneId]?.name ?? zoneId);
  return (
    <span
      className={cn(
        'inline-block text-xs font-bold px-3 py-1 rounded-full',
        zoneId === null
          ? 'bg-sky-100 text-sky-700'
          : 'bg-green-100 text-green-700',
      )}
    >
      {label}
    </span>
  );
}

function CirclePromptCard({ prompt }: { prompt: CirclePrompt }) {
  const { language } = useSettings();
  const t = useStrings();
  // Selection is intentionally LOCAL ONLY: reflections are private to the
  // child, never persisted, never transmitted (PRD §9 data minimization).
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-3xl border border-amber-100 shadow-sm p-5 md:p-6">
      <ZoneChip zoneId={prompt.zoneId} />
      <p className="font-display font-bold text-lg text-slate-800 mt-3 mb-4">
        {pickText(prompt.prompt, language)}
      </p>
      <div className="flex flex-col gap-2">
        {prompt.options.map((option, idx) => {
          const isSelected = selected === idx;
          return (
            <button
              key={idx}
              onClick={() => setSelected(idx)}
              className={cn(
                'text-left px-4 py-3 rounded-2xl border font-medium transition-colors touch-manipulation active:scale-[0.99]',
                isSelected
                  ? 'bg-orange-50 border-orange-300 text-orange-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-200',
              )}
            >
              {pickText(option.text, language)}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4 animate-in fade-in duration-200">
          <p className="font-bold text-green-700 text-sm mb-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            {t.thanksForReflecting}
          </p>
          <p className="text-green-800 text-sm font-medium">
            {pickText(prompt.options[selected].affirmation, language)}
          </p>
        </div>
      )}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-xs font-bold text-sky-600 uppercase tracking-wide mb-1">
          {t.whyThisMatters}
        </p>
        <p className="text-sm text-slate-600 font-medium">
          {pickText(prompt.rightsNote, language)}
        </p>
      </div>
    </div>
  );
}

function CircleTab() {
  const t = useStrings();
  // Rotation: completed-zone prompts take priority, and the mix shifts with
  // the calendar day. Pure selection logic lives in community/content.ts.
  const prompts = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    return selectCirclePrompts(progressStore.getState().completedZones, dayIndex);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-slate-600 font-medium">{t.circleIntro}</p>
      {prompts.map((prompt) => (
        <CirclePromptCard key={prompt.id} prompt={prompt} />
      ))}
      <p className="text-sm text-slate-500 font-medium text-center">
        {t.promptsRotateNote}
      </p>
    </div>
  );
}

function BoardTab() {
  const { language } = useSettings();
  const t = useStrings();
  const promptById = useMemo(
    () => new Map(CIRCLE_PROMPTS.map((p) => [p.id, p])),
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-slate-600 font-medium">{t.boardIntro}</p>
      {/* Clearly-labeled simulation banner: these posts are team-written
          illustrations. Real deployment = NGO/teacher pre-moderation only. */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-amber-800 text-sm font-bold">{t.boardIllustrative}</p>
        <p className="text-amber-700 text-sm font-medium mt-1">
          {t.boardModerationNote}
        </p>
      </div>
      {BOARD_POSTS.map((post) => {
        const prompt = promptById.get(post.promptId);
        return (
          <div
            key={post.id}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5"
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-orange-100 text-orange-700 font-bold text-sm px-3 py-1 rounded-full">
                {post.handle}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {t.ageLabel(post.ageBand)}
              </span>
              {prompt && <ZoneChip zoneId={prompt.zoneId} />}
            </div>
            <p className="text-slate-700 font-medium">
              {pickText(post.text, language)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ExpertTab() {
  const { language } = useSettings();
  const t = useStrings();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-slate-600 font-medium">{t.expertIntro}</p>
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-sky-600 mt-0.5 shrink-0" />
        <p className="text-sky-800 text-sm font-medium">{t.expertDisclaimer}</p>
      </div>
      <div className="flex flex-col gap-3">
        {EXPERT_FAQ.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 touch-manipulation hover:bg-amber-50/50 transition-colors"
              >
                <span className="font-display font-bold text-slate-800">
                  {pickText(item.question, language)}
                </span>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-orange-400 shrink-0 transition-transform',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 animate-in fade-in duration-200">
                  {item.zoneId && (
                    <div className="mb-2">
                      <ZoneChip zoneId={item.zoneId} />
                    </div>
                  )}
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {pickText(item.answer, language)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CommunityOverlay() {
  const { communityOpen } = useUIStore();
  const t = useStrings();
  const [tab, setTab] = useState<CommunityTab>('circle');

  useEffect(() => {
    if (!communityOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCommunity();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [communityOpen]);

  if (!communityOpen) return null;

  const tabs: Array<{ id: CommunityTab; label: string; icon: React.ReactNode }> = [
    { id: 'circle', label: t.tabCircle, icon: <Users className="w-4 h-4" /> },
    { id: 'board', label: t.tabBoard, icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'expert', label: t.tabExpert, icon: <Scale className="w-4 h-4" /> },
  ];

  return (
    // z-30: below the always-on-top Get Help Now button and guide (z-50).
    <div className="absolute inset-0 z-30 pointer-events-auto bg-slate-50/95 backdrop-blur-md flex items-start justify-center overflow-y-auto p-4 md:p-8 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl my-4 md:my-8">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-5 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 w-11 h-11 rounded-full flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="font-display font-bold text-2xl md:text-3xl text-slate-800">
                {t.communityTitle}
              </h2>
            </div>
            <button
              onClick={closeCommunity}
              aria-label={t.closeCommunity}
              className="bg-slate-100 hover:bg-slate-200 rounded-full p-2.5 transition-colors active:scale-95 touch-manipulation shrink-0"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <p className="text-sm text-slate-500 font-medium mb-5 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            {t.safeByDesignNote}
          </p>

          <div className="flex flex-wrap gap-2 mb-6" role="tablist">
            {tabs.map((tabDef) => (
              <button
                key={tabDef.id}
                role="tab"
                aria-selected={tab === tabDef.id}
                onClick={() => setTab(tabDef.id)}
                className={cn(
                  'px-4 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-colors touch-manipulation active:scale-95',
                  tab === tabDef.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-amber-100',
                )}
              >
                {tabDef.icon}
                {tabDef.label}
              </button>
            ))}
          </div>

          {tab === 'circle' && <CircleTab />}
          {tab === 'board' && <BoardTab />}
          {tab === 'expert' && <ExpertTab />}
        </div>
      </div>
    </div>
  );
}
