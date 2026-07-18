import { describe, expect, it } from 'vitest';
import { estimateCandidateRisk } from '@greedy-sweeper/game-core/ai/risk-estimator';

describe('AI public risk estimator', () => {
  it('derives risk from revealed numbers and flags only', () => {
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
          { isRevealed: false, isFlagged: true, neighborMines: null },
          { isRevealed: false, isFlagged: false, neighborMines: null },
        ],
      ],
    };
    expect(estimateCandidateRisk(view, { row: 0, column: 1 })).toEqual({ risk: 0, confidence: 1 });
  });

  it('falls back predictably when a candidate has no public constraints', () => {
    const view = {
      rows: 1,
      columns: 1,
      totalMines: 0,
      board: [[{ isRevealed: false, isFlagged: false, neighborMines: null }]],
    };
    expect(estimateCandidateRisk(view, { row: 0, column: 0 })).toEqual({
      risk: 0.5,
      confidence: 0,
    });
  });
});
