import { describe, expect, it } from 'vitest';
import { createDailyChallenge, getUtcDay } from '@greedy-sweeper/game-core/challenge/daily';

describe('daily challenge', () => {
  it('derives the same seed for every instant in one UTC day', () => {
    const early = createDailyChallenge(new Date('2026-07-16T00:00:00.000Z'));
    const late = createDailyChallenge(new Date('2026-07-16T23:59:59.999Z'));

    expect(early).toEqual(late);
    expect(early.seed).toMatch(/^\d+$/);
  });

  it('changes only at the UTC date boundary', () => {
    const before = createDailyChallenge(new Date('2026-07-16T23:59:59.999Z'));
    const after = createDailyChallenge(new Date('2026-07-17T00:00:00.000Z'));

    expect(before.seed).not.toBe(after.seed);
    expect(getUtcDay(new Date('2026-07-16T16:00:00-08:00'))).toBe('2026-07-17');
  });

  it('rejects invalid date inputs without falling back to a local clock', () => {
    expect(getUtcDay(new Date('invalid'))).toBeNull();
    expect(createDailyChallenge(new Date('invalid'))).toBeNull();
  });
});
