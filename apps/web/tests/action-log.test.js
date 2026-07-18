import { describe, expect, it } from 'vitest';
import {
  PLAYERS,
  createFlagAction,
  createRevealAction,
} from '@greedy-sweeper/game-core/model/contracts';
import { appendActionRecord, validateActionLog } from '@greedy-sweeper/game-core/replay/action-log';
import { REPLAY_ERROR_CODES } from '@greedy-sweeper/game-core/replay/contracts';

describe('versioned action log', () => {
  it('appends serializable human and AI commands in a contiguous order', () => {
    const humanAction = createRevealAction(1, 2, PLAYERS.human);
    const first = appendActionRecord([], humanAction);
    const second = appendActionRecord(first.value, createFlagAction(3, 4, PLAYERS.ai));

    expect(first).toEqual({
      ok: true,
      value: [
        {
          version: '1',
          sequence: 0,
          action: humanAction,
        },
      ],
    });
    expect(second.value.map((record) => record.sequence)).toEqual([0, 1]);
    expect(second.value.map((record) => record.action.player)).toEqual([PLAYERS.human, PLAYERS.ai]);
    expect(JSON.parse(JSON.stringify(second.value))).toEqual(second.value);
  });

  it('does not append invalid commands', () => {
    const result = appendActionRecord([], { type: 'reveal' });

    expect(result).toEqual({
      ok: false,
      error: { code: REPLAY_ERROR_CODES.invalidActionRecord },
    });
  });

  it('rejects logs with missing or incompatible sequence records', () => {
    const result = validateActionLog([
      {
        version: '1',
        sequence: 1,
        action: createRevealAction(0, 0, PLAYERS.human),
      },
    ]);

    expect(result).toEqual({
      ok: false,
      error: { code: REPLAY_ERROR_CODES.invalidActionLog },
    });
  });
});
