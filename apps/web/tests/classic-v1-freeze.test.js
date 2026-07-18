import { describe, expect, it } from 'vitest';
import { BOARD_CONFIG, SCORE_CONFIG } from '@greedy-sweeper/game-core/config/game-config';
import { applyAction } from '@greedy-sweeper/game-core/engine/transition';
import { createRevealAction, PLAYERS } from '@greedy-sweeper/game-core/model/contracts';
import { createCell, createInitialState } from '@greedy-sweeper/game-core/model/factories';

describe('Classic v1 freeze', () => {
  it('retains the published state shape and safe-reveal settlement', () => {
    const board = [[createCell({ neighborMines: 2 })]];
    const state = createInitialState(board);
    const { state: next, result } = applyAction(
      state,
      createRevealAction(0, 0, PLAYERS.human),
      { ...BOARD_CONFIG, rows: 1, columns: 1, totalMines: 0 },
      SCORE_CONFIG,
    );

    expect(Object.keys(next).sort()).toEqual([
      'actionMessage',
      'aiScore',
      'board',
      'currentPlayer',
      'gameOver',
      'humanScore',
      'minesFound',
    ]);
    expect(next.humanScore).toBe(2);
    expect(result.events[0]).toMatchObject({ type: 'safe_reveal', points: 2 });
  });
});
