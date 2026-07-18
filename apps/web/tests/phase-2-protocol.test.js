import { describe, expect, it } from 'vitest';
import { createChallengeDescriptor } from '@greedy-sweeper/game-core/challenge/contracts';
import { ACTION_TYPES, PLAYERS } from '@greedy-sweeper/game-core/model/contracts';
import {
  REPLAY_ERROR_CODES,
  createActionRecord,
  createReplay,
  isActionRecord,
} from '@greedy-sweeper/game-core/replay/contracts';

describe('Phase 2 protocol contracts', () => {
  it('creates a serializable descriptor without leaking a board solution', () => {
    const descriptor = createChallengeDescriptor({
      seed: '123456789',
      board: { rows: 3, columns: 4, totalMines: 2 },
    });

    expect(descriptor).toEqual({
      rulesVersion: '1',
      challengeVersion: '1',
      board: { rows: 3, columns: 4, totalMines: 2 },
      seed: '123456789',
      mode: 'standard',
    });
    expect(JSON.parse(JSON.stringify(descriptor))).toEqual(descriptor);
    expect(descriptor).not.toHaveProperty('mines');
  });

  it('uses ordered domain actions for replay data', () => {
    const record = createActionRecord(0, {
      type: ACTION_TYPES.reveal,
      row: 1,
      column: 2,
      player: PLAYERS.human,
    });
    const replay = createReplay({
      descriptor: createChallengeDescriptor({ seed: 1 }),
      actions: [record],
    });

    expect(isActionRecord(record)).toBe(true);
    expect(replay.actions).toEqual([record]);
    expect(REPLAY_ERROR_CODES.summaryMismatch).toBe('replay_summary_mismatch');
  });
});
