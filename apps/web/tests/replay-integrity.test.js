import { describe, expect, it } from 'vitest';
import { createChallengeBoard } from '../src/game/challenge/board';
import { PLAYERS, createFlagAction } from '../src/game/model/contracts';
import { appendActionRecord } from '../src/game/replay/action-log';
import { createReplaySummary, validateReplayIntegrity } from '../src/game/replay/integrity';
import { replayGame } from '../src/game/replay/replay-engine';
import { REPLAY_ERROR_CODES } from '../src/game/replay/contracts';

const descriptor = {
  rulesVersion: '1',
  challengeVersion: '1',
  board: { rows: 5, columns: 5, totalMines: 3 },
  seed: '91',
  mode: 'standard',
};

function createActions() {
  const board = createChallengeBoard(descriptor).value.board;
  const safeCells = board.flatMap((row, rowIndex) =>
    row.map((cell, column) => ({ cell, row: rowIndex, column })).filter(({ cell }) => !cell.isMine),
  );
  const first = appendActionRecord(
    [],
    createFlagAction(safeCells[0].row, safeCells[0].column, PLAYERS.human),
  );
  return appendActionRecord(
    first.value,
    createFlagAction(safeCells[1].row, safeCells[1].column, PLAYERS.ai),
  ).value;
}

function createExpectedSummary(actions) {
  const replay = replayGame({ descriptor, actions }).value;
  return createReplaySummary({
    descriptor: replay.descriptor,
    state: replay.state,
    actionCount: actions.length,
  });
}

describe('replay integrity', () => {
  it('uses a stable terminal summary for the same replay', () => {
    const actions = createActions();
    const expectedSummary = createExpectedSummary(actions);

    const first = validateReplayIntegrity({ descriptor, actions, expectedSummary });
    const second = validateReplayIntegrity({ descriptor, actions, expectedSummary });

    expect(first).toEqual(second);
    expect(first.value.summary).toEqual(expectedSummary);
  });

  it('reports a truncated log separately from a mismatched replay', () => {
    const actions = createActions();
    const expectedSummary = createExpectedSummary(actions);

    expect(
      validateReplayIntegrity({
        descriptor,
        actions: actions.slice(0, 1),
        expectedSummary,
      }),
    ).toEqual({
      ok: false,
      error: { code: REPLAY_ERROR_CODES.truncated },
    });
  });

  it('detects a modified but syntactically valid command', () => {
    const actions = createActions();
    const expectedSummary = createExpectedSummary(actions);
    const tamperedActions = actions.map((record) => ({ ...record, action: { ...record.action } }));
    tamperedActions[0].action.column += 1;

    expect(
      validateReplayIntegrity({ descriptor, actions: tamperedActions, expectedSummary }),
    ).toEqual({
      ok: false,
      error: { code: REPLAY_ERROR_CODES.summaryMismatch },
    });
  });
});
