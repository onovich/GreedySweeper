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
});
