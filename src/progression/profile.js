import { MAX_RETAINED_FACTS, PROGRESSION_VERSION } from './config.js';
import { evaluateAchievements } from './achievements.js';
import { createEmptyStats, reduceStats, selectStats } from './stats.js';
export function createProfile() {
  return {
    progressionVersion: PROGRESSION_VERSION,
    baseline: createEmptyStats(),
    facts: [],
    unlocks: [],
  };
}
export function appendCompletedFacts(profile, facts) {
  if (profile.facts.some((item) => item.id === facts.id)) return { profile, added: false };
  let baseline = profile.baseline,
    retained = [...profile.facts, facts];
  if (retained.length > MAX_RETAINED_FACTS) {
    const evicted = retained.shift();
    baseline = reduceStats(baseline, [evicted]);
  }
  const stats = selectStats(reduceStats(baseline, retained));
  const unlocks = evaluateAchievements(stats, facts.completedAt).map(
    (item) =>
      profile.unlocks.find((old) => old.id === item.id) ?? { ...item, sourceGameId: facts.id },
  );
  return {
    added: true,
    profile: { progressionVersion: PROGRESSION_VERSION, baseline, facts: retained, unlocks },
  };
}
export function getProfileStats(profile) {
  return selectStats(reduceStats(profile.baseline, profile.facts));
}
