import { describe, expect, it } from 'vitest';
import { deriveVerifiedOnlineFact } from '../src/progression/derive-online-fact';

describe('verified online progression facts', () => {
  it('uses a terminal commitment as a durable idempotency key', () => {
    const result = deriveVerifiedOnlineFact({
      commitment: 'a'.repeat(64),
      ruleset: 'greed-v2',
      snapshot: { gameOver: true, humanScore: 9, aiScore: 7, sequence: 12 },
      completedAt: '2026-07-18T00:00:00.000Z',
    });
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        value: expect.objectContaining({
          id: `online:${'a'.repeat(64)}`,
          sessionSource: 'online',
          mode: 'greed',
          winner: 'human',
        }),
      }),
    );
  });

  it('refuses incomplete or unverified online states', () => {
    expect(
      deriveVerifiedOnlineFact({
        commitment: 'not-a-commitment',
        ruleset: 'classic-v1',
        snapshot: { gameOver: false, humanScore: 0, aiScore: 0, sequence: 0 },
        completedAt: '2026-07-18T00:00:00.000Z',
      }),
    ).toEqual({ ok: false, error: { code: 'online_progression_unverified' } });
  });
});
