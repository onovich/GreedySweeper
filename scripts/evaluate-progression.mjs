import {
  appendCompletedFacts,
  createProfile,
  getProfileStats,
} from '../apps/web/src/progression/profile.js';
const make = (id, winner = 'human') => ({
  id: `evaluation:${id}`,
  completedAt: '2026-07-17T00:00:00.000Z',
  sessionSource: 'random',
  mode: 'greed',
  aiDifficulty: 'easy',
  aiStyle: 'balanced',
  winner,
  humanScore: 1,
  aiScore: 0,
  correctFlags: 0,
  wrongFlags: 0,
  explosions: 0,
  banks: 0,
  maxStreak: 0,
  maxBankedPot: 0,
  maxLostPot: 0,
});
let profile = createProfile();
for (let index = 0; index < 1001; index += 1)
  profile = appendCompletedFacts(profile, make(index, index % 2 ? 'ai' : 'human')).profile;
if (
  appendCompletedFacts(profile, make(0)).added ||
  profile.facts.length !== 1000 ||
  getProfileStats(profile).completedGames !== 1001
)
  throw new Error('Progression rollup/idempotency failed');
console.log('progression: durable rollup, duplicate no-op, and dimension reducer PASS');
