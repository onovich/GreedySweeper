import { describe, expect, it } from 'vitest';
import { createChallengeBoard } from '../src/game/challenge/board';
import { PLAYERS, createBankAction, createRevealAction } from '../src/game/model/contracts';
import { appendActionRecord } from '../src/game/replay/action-log';
import { createReplaySummary, validateReplayIntegrity } from '../src/game/replay/integrity';
import { replayGame } from '../src/game/replay/replay-engine';

const descriptor = {
  rulesVersion: '2',
  challengeVersion: '1',
  board: { rows: 3, columns: 3, totalMines: 1 },
  seed: '19',
  mode: 'greed',
};

describe('Greed v2 replay', () => {
  it('uses v2 records and includes pot state in the integrity summary', () => {
    const board = createChallengeBoard(descriptor).value.board;
    const safe = board.flatMap((row, rowIndex) =>
      row
        .map((cell, column) => ({ cell, row: rowIndex, column }))
        .filter(({ cell }) => !cell.isMine),
    )[0];
    const first = appendActionRecord(
      [],
      createRevealAction(safe.row, safe.column, PLAYERS.human),
      descriptor,
    );
    const actions = appendActionRecord(
      first.value,
      createBankAction(PLAYERS.human),
      descriptor,
    ).value;
    const replay = replayGame({ descriptor, actions });
    const summary = createReplaySummary({
      descriptor,
      state: replay.value.state,
      actionCount: actions.length,
    });

    expect(actions.every((record) => record.version === '2')).toBe(true);
    expect(summary.replayVersion).toBe('2');
    expect(validateReplayIntegrity({ descriptor, actions, expectedSummary: summary }).ok).toBe(
      true,
    );
  });
});
