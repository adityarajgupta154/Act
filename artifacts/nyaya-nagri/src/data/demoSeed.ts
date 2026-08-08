/**
 * Dev-only sample progress data (Task 9) for verifying the progress
 * dashboard without playing through quests. Activated ONLY in development
 * builds via the `?demoProgress` URL parameter (see main.tsx) — never in
 * production. All data is fake and keyed by the pseudonymous session id.
 */
import { progressStore } from './progressStore';

export function seedDemoProgress(): void {
  progressStore.update({
    ageBand: '12-15',
    completedZones: { zone1: true, zone2: true, zone3: true },
    badges: { zone1_star: true, zone2_star: true, zone3_star: true },
    quizScores: {
      safe_zone_12_15: { pre: 1, post: 4 },
      right_childhood_12_15: { pre: 2, post: 4 },
      school_rights_12_15: { pre: 1, post: 3 },
    },
  });
}
