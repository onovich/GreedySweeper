import { describe, expect, it } from 'vitest';
import { appendCompletedFacts, createProfile, getProfileStats } from '../src/progression/profile';
import { evaluateAchievements } from '../src/progression/achievements';
const fact = {
  id: 'v:1:x',
  completedAt: '2026-07-17T00:00:00.000Z',
  sessionSource: 'daily',
  mode: 'greed',
  aiDifficulty: 'easy',
  aiStyle: 'balanced',
  winner: 'human',
  humanScore: 12,
  aiScore: 3,
  correctFlags: 1,
  wrongFlags: 0,
  explosions: 0,
  banks: 1,
  maxStreak: 3,
  maxBankedPot: 10,
  maxLostPot: 0,
};
describe('progression profile', () => {
  it('is idempotent and derives stats through its reducer', () => {
    const first = appendCompletedFacts(createProfile(), fact);
    const duplicate = appendCompletedFacts(first.profile, fact);
    expect(first.added).toBe(true);
    expect(duplicate.added).toBe(false);
    expect(getProfileStats(duplicate.profile)).toMatchObject({
      completedGames: 1,
      wins: 1,
      dailyGames: 1,
      winRate: 1,
    });
  });
  it('unlocks the catalog from data only', () => {
    const stats = getProfileStats(appendCompletedFacts(createProfile(), fact).profile);
    expect(evaluateAchievements(stats, fact.completedAt).map((x) => x.id)).toEqual(
      expect.arrayContaining([
        'first_game',
        'first_win',
        'clean_win',
        'banker_10',
        'daily_challenger',
      ]),
    );
  });
  it('retains duplicate ids across the 1000-fact rollup and tracks dimension outcomes', () => {
    let profile = createProfile();
    for (let index = 0; index < 1001; index += 1)
      profile = appendCompletedFacts(profile, {
        ...fact,
        id: `id-${index}`,
        winner: index % 2 ? 'ai' : 'human',
      }).profile;
    expect(appendCompletedFacts(profile, { ...fact, id: 'id-0' }).added).toBe(false);
    const stats = getProfileStats(profile);
    expect(stats).toMatchObject({ completedGames: 1001 });
    expect(stats.modes.greed).toMatchObject({ games: 1001, wins: 501, losses: 500 });
    expect(stats.difficulties.easy.winRate).toBeCloseTo(501 / 1001);
  });
});
