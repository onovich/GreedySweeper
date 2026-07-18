import { describe, expect, it } from 'vitest';
import { createChallengeBoard } from '@greedy-sweeper/game-core/challenge/board';
import { PLAYERS, createFlagAction } from '@greedy-sweeper/game-core/model/contracts';
import { appendActionRecord } from '@greedy-sweeper/game-core/replay/action-log';
import { REPLAY_ERROR_CODES } from '@greedy-sweeper/game-core/replay/contracts';
import { replayGame, replayGameAt } from '@greedy-sweeper/game-core/replay/replay-engine';

const descriptor = {
  rulesVersion: '1',
  challengeVersion: '1',
  board: { rows: 5, columns: 5, totalMines: 3 },
  seed: '57',
  mode: 'standard',
};

function createRecordedGame() {
  const boardResult = createChallengeBoard(descriptor);
  const safeCells = boardResult.value.board.flatMap((row, rowIndex) =>
    row.map((cell, column) => ({ cell, row: rowIndex, column })).filter(({ cell }) => !cell.isMine),
  );
  const humanRecord = appendActionRecord(
    [],
    createFlagAction(safeCells[0].row, safeCells[0].column, PLAYERS.human),
  );
  return appendActionRecord(
    humanRecord.value,
    createFlagAction(safeCells[1].row, safeCells[1].column, PLAYERS.ai),
  ).value;
}

describe('pure replay engine', () => {
  it('rebuilds the same final state from a descriptor and action log', () => {
    const actions = createRecordedGame();

    const first = replayGame({ descriptor, actions });
    const second = replayGame({ descriptor, actions });

    expect(first).toEqual(second);
    expect(first.value.results.map(({ result }) => result.type)).toEqual(['applied', 'applied']);
    expect(first.value.state.currentPlayer).toBe(PLAYERS.human);
  });

  it('replays an action-log prefix without reading a snapshot', () => {
    const actions = createRecordedGame();
    const result = replayGameAt({ descriptor, actions }, 1);

    expect(result.value.results).toHaveLength(1);
    expect(result.value.state.currentPlayer).toBe(PLAYERS.ai);
  });

  it('rejects unsupported replay versions', () => {
    expect(replayGame({ version: '99', descriptor })).toEqual({
      ok: false,
      error: { code: REPLAY_ERROR_CODES.unsupportedVersion },
    });
  });
});
