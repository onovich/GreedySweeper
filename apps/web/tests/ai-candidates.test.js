import { describe, expect, it } from 'vitest';
import { getHiddenCandidates, selectCertainAction } from '@greedy-sweeper/game-core/ai/candidates';

describe('AI candidates', () => {
  it('preserves the original scan order for certain moves and fallback candidates', () => {
    const view = {
      rows: 2,
      columns: 2,
      totalMines: 1,
      board: [
        [
          { isRevealed: true, isFlagged: false, neighborMines: 1 },
          { isRevealed: false, isFlagged: false, neighborMines: null },
        ],
        [
          { isRevealed: true, isFlagged: false, neighborMines: 0 },
          { isRevealed: true, isFlagged: false, neighborMines: 0 },
        ],
      ],
    };

    expect(selectCertainAction(view)).toMatchObject({ type: 'flag', row: 0, column: 1 });
    expect(getHiddenCandidates(view)).toEqual([{ row: 0, column: 1 }]);
  });
});
