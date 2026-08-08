/**
 * Progress dashboard render smoke test (Task 9).
 * Run: pnpm dlx tsx scripts/dashboard.render.smoke.tsx
 *
 * Renders the ProgressPanel headlessly (no WebGL needed) with sample data
 * and asserts the two views obey their rules:
 *  - Child view: friendly counts only — NO percentages, NO raw scores,
 *    NO session id.
 *  - Teacher/parent view: aggregated pre/post percentages + deltas, the
 *    privacy note, and the pseudonymous session id — and still no
 *    scenario/choice content.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProgressPanel, computeZoneImpact } from '../src/ui/ProgressScreen';
import type { ProgressState } from '../src/data/progressStore';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok - ${msg}`);
}

const sample: ProgressState = {
  ageBand: '12-15',
  completedZones: { zone1: true, zone2: true, zone3: true },
  badges: { zone1_star: true, zone2_star: true, zone3_star: true },
  quizScores: {
    safe_zone_12_15: { pre: 1, post: 4 },
    right_childhood_12_15: { pre: 2, post: 4 },
    school_rights_12_15: { pre: 1, post: 3 },
  },
  sessionId: 'nn-testsample-0001',
  extras: {},
};

// --- computeZoneImpact math ---
const impacts = computeZoneImpact(sample);
assert(impacts.length === 3, `impact rows for 3 played zones (${impacts.length})`);
const zone1 = impacts.find((i) => i.zoneId === 'zone1')!;
assert(zone1.prePct === 25 && zone1.postPct === 100 && zone1.deltaPts === 75,
  `zone1 impact 25% -> 100% (+75 pts)`);
const zone3 = impacts.find((i) => i.zoneId === 'zone3')!;
assert(zone3.prePct === 25 && zone3.postPct === 75 && zone3.deltaPts === 50,
  `zone3 impact 25% -> 75% (+50 pts)`);

// --- Child view ---
const noop = () => {};
const childHtml = renderToStaticMarkup(
  <ProgressPanel progress={sample} teacherView={false} onToggleTeacherView={noop} onClose={noop} />,
);
assert(childHtml.includes('completed 3 out of 5 Rights Quests'), 'child view shows friendly quest count');
assert(childHtml.includes('3 star badges earned'), 'child view shows badge count');
assert(childHtml.includes('Safe Zone') && childHtml.includes('Digital Safety'), 'child view lists zones');
assert(childHtml.includes('Locked for now'), 'child view marks locked zones');
assert(!childHtml.includes('%'), 'child view contains NO percentages');
assert(!/[0-9]\s*\/\s*[0-9]/.test(childHtml), 'child view contains no raw score fractions');
assert(!childHtml.includes(sample.sessionId), 'child view does not surface the session id');
assert(childHtml.includes('For Teachers and Parents') && childHtml.includes('Show summary'),
  'teacher section is present but collapsed (opt-in)');
assert(!childHtml.includes('Learning summary'), 'teacher summary hidden by default');

// --- Teacher/parent view (opt-in) ---
const teacherHtml = renderToStaticMarkup(
  <ProgressPanel progress={sample} teacherView={true} onToggleTeacherView={noop} onClose={noop} />,
);
assert(teacherHtml.includes('Learning summary for this device'), 'teacher view renders when opted in');
assert(teacherHtml.includes('25%') && teacherHtml.includes('100%'), 'teacher view shows pre/post percentages');
assert(teacherHtml.includes('+75 pts') && teacherHtml.includes('+50 pts'), 'teacher view shows deltas');
assert(teacherHtml.includes('Average improvement'), 'teacher view shows average delta');
assert(teacherHtml.includes('never shows individual answers or any story choices'),
  'teacher view carries the privacy note');
assert(teacherHtml.includes(sample.sessionId), 'teacher view shows pseudonymous session id');
assert(!teacherHtml.toLowerCase().includes('scene') && !teacherHtml.toLowerCase().includes('choicelog'),
  'teacher view contains no scenario/choice content');

// --- Empty state ---
const fresh: ProgressState = { ...sample, completedZones: {}, badges: {}, quizScores: {} };
const freshChild = renderToStaticMarkup(
  <ProgressPanel progress={fresh} teacherView={false} onToggleTeacherView={noop} onClose={noop} />,
);
assert(freshChild.includes('completed 0 out of 5'), 'fresh child view renders zero state');
assert(freshChild.includes('adventure is just beginning'), 'fresh child view is encouraging');
const freshTeacher = renderToStaticMarkup(
  <ProgressPanel progress={fresh} teacherView={true} onToggleTeacherView={noop} onClose={noop} />,
);
assert(freshTeacher.includes('No quests completed on this device yet'), 'fresh teacher view has empty state');

// --- No emojis anywhere in either view ---
for (const [name, html] of [['child', childHtml], ['teacher', teacherHtml]] as const) {
  assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(html), `${name} view has no emojis`);
}

console.log('\nAll dashboard render smoke tests passed.');
