import { describe, expect, it } from 'vitest';
import {
  CHALLENGE_ERROR_CODES,
  createChallengeDescriptor,
  validateChallengeDescriptor,
} from '@greedy-sweeper/game-core/challenge/contracts';
import { createChallengeBoard } from '@greedy-sweeper/game-core/challenge/board';

const board = { rows: 4, columns: 4, totalMines: 3 };

describe('seeded challenge board', () => {
  it('builds the identical board from the same descriptor across repeated runs', () => {
    const descriptor = createChallengeDescriptor({ seed: 42, board });
    const first = createChallengeBoard(descriptor);
    const second = createChallengeBoard(JSON.parse(JSON.stringify(descriptor)));

    expect(first.ok).toBe(true);
    expect(second).toEqual(first);
  });

  it('creates a valid different board when the seed changes', () => {
    const first = createChallengeBoard(createChallengeDescriptor({ seed: 42, board }));
    const second = createChallengeBoard(createChallengeDescriptor({ seed: 43, board }));

    expect(second.ok).toBe(true);
    expect(second.value.board).not.toEqual(first.value.board);
  });

  it('returns structured errors for unsupported versions and invalid configuration', () => {
    const descriptor = createChallengeDescriptor({ seed: 7, board });
    const unsupported = validateChallengeDescriptor({ ...descriptor, challengeVersion: '999' });
    const invalid = validateChallengeDescriptor({
      ...descriptor,
      board: { rows: 1, columns: 1, totalMines: 1 },
    });

    expect(unsupported).toMatchObject({
      ok: false,
      error: { code: CHALLENGE_ERROR_CODES.unsupportedChallengeVersion },
    });
    expect(invalid).toMatchObject({
      ok: false,
      error: { code: CHALLENGE_ERROR_CODES.invalidConfiguration },
    });
  });
});
