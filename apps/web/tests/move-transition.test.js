import { describe, expect, it } from 'vitest';
import { SCORE_CONFIG } from '@greedy-sweeper/game-core/config/game-config';
import { applyAction } from '@greedy-sweeper/game-core/engine/transition';
import {
  PLAYERS,
  createFlagAction,
  createRevealAction,
} from '@greedy-sweeper/game-core/model/contracts';
import { createCell, createInitialState } from '@greedy-sweeper/game-core/model/factories';

const config = { rows: 2, columns: 2, totalMines: 1 };

function createState(board) {
  return createInitialState(board);
}

describe('move transition', () => {
  it('awards a correct flag, ends the turn, and settles the final mine', () => {
    const state = createState([
      [createCell({ isMine: true }), createCell({ neighborMines: 1 })],
      [createCell({ neighborMines: 1 }), createCell({ neighborMines: 1 })],
    ]);

    const { state: next, result } = applyAction(
      state,
      createFlagAction(0, 0, PLAYERS.human),
      config,
    );

    expect(next.humanScore).toBe(SCORE_CONFIG.correctFlag);
    expect(next.currentPlayer).toBe(PLAYERS.ai);
    expect(next.minesFound).toBe(1);
    expect(next.gameOver).toBe(true);
    expect(next.board[0][0]).toMatchObject({
      isFlagged: true,
      isRevealed: true,
      flagger: PLAYERS.human,
    });
    expect(result.events).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'game_over' })]),
    );
  });

  it('penalizes wrong flags and mine reveals while preserving the original state', () => {
    const state = createState([
      [createCell({ neighborMines: 1 }), createCell({ isMine: true })],
      [createCell({ neighborMines: 1 }), createCell({ neighborMines: 1 })],
    ]);
    const wrongFlag = applyAction(state, createFlagAction(0, 0, PLAYERS.human), config).state;
    const exploded = applyAction(state, createRevealAction(0, 1, PLAYERS.human), config).state;

    expect(state.board[0][0].isRevealed).toBe(false);
    expect(wrongFlag.humanScore).toBe(SCORE_CONFIG.wrongFlag);
    expect(wrongFlag.board[0][0]).toMatchObject({ isWrongFlag: true, isRevealed: true });
    expect(exploded.humanScore).toBe(SCORE_CONFIG.explodedMine);
    expect(exploded.board[0][1]).toMatchObject({ isExploded: true, isRevealed: true });
    expect(exploded.currentPlayer).toBe(PLAYERS.ai);
  });

  it('keeps a safe reveal on the same turn and adds its displayed numbers to the score', () => {
    const state = createState([
      [createCell({ neighborMines: 0 }), createCell({ neighborMines: 1 })],
      [createCell({ neighborMines: 0 }), createCell({ isMine: true })],
    ]);

    const { state: next } = applyAction(state, createRevealAction(0, 0, PLAYERS.human), config);

    expect(next.humanScore).toBe(1);
    expect(next.currentPlayer).toBe(PLAYERS.human);
    expect(next.board[0][1].isRevealed).toBe(true);
  });

  it('ignores commands from the wrong turn, repeated cells, and completed games', () => {
    const state = createState([
      [createCell({ neighborMines: 0 }), createCell({ isMine: true })],
      [createCell(), createCell()],
    ]);
    const wrongTurn = applyAction(state, createRevealAction(0, 0, PLAYERS.ai), config);
    const completed = applyAction(
      { ...state, gameOver: true },
      createRevealAction(0, 0, PLAYERS.human),
      config,
    );

    expect(wrongTurn.state).toBe(state);
    expect(wrongTurn.result.type).toBe('ignored');
    expect(completed.state.gameOver).toBe(true);
  });
});
