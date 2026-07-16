import { describe, expect, it } from 'vitest';
import { selectUtilityCandidate } from '../src/game/ai/utility';

const view = {
  rows: 2,
  columns: 3,
  totalMines: 1,
  board: [
    [
      { isRevealed: true, isFlagged: false, neighborMines: 1 },
      { isRevealed: false, isFlagged: false, neighborMines: null },
      { isRevealed: true, isFlagged: false, neighborMines: 0 },
    ],
    [
      { isRevealed: false, isFlagged: true, neighborMines: null },
      { isRevealed: false, isFlagged: false, neighborMines: null },
      { isRevealed: false, isFlagged: false, neighborMines: null },
    ],
  ],
};

describe('AI style utility', () => {
  it('uses stable conservative and greedy rankings with a greedy risk cap', () => {
    const candidates = [
      { row: 0, column: 1 },
      { row: 1, column: 1 },
      { row: 1, column: 2 },
    ];

    expect(selectUtilityCandidate(view, candidates, 'conservative')).toEqual({ row: 0, column: 1 });
    expect(selectUtilityCandidate(view, candidates, 'greedy')).toEqual({ row: 1, column: 2 });
  });
});
