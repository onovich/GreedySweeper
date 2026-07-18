import { describe, expect, it } from 'vitest';
import { createAiPublicView } from '@greedy-sweeper/game-core/ai/public-view';
import { createCell, createInitialState } from '@greedy-sweeper/game-core/model/factories';

const config = { rows: 2, columns: 2, totalMines: 1 };

describe('AI public view', () => {
  it('exposes only revealed numbers, flags, hidden coordinates, and board configuration', () => {
    const state = createInitialState([
      [{ ...createCell({ isMine: true }), isFlagged: true }, createCell({ isMine: false })],
      [
        { ...createCell({ isMine: false, neighborMines: 1 }), isRevealed: true },
        createCell({ isMine: true }),
      ],
    ]);

    expect(createAiPublicView(state, config)).toEqual({
      rows: 2,
      columns: 2,
      totalMines: 1,
      board: [
        [
          { isRevealed: false, isFlagged: true, neighborMines: null },
          { isRevealed: false, isFlagged: false, neighborMines: null },
        ],
        [
          { isRevealed: true, isFlagged: false, neighborMines: 1 },
          { isRevealed: false, isFlagged: false, neighborMines: null },
        ],
      ],
    });
  });

  it('makes different hidden mine layouts indistinguishable to the AI', () => {
    const first = createInitialState([
      [{ ...createCell({ isMine: true }), isFlagged: true }, createCell()],
      [{ ...createCell({ neighborMines: 1 }), isRevealed: true }, createCell({ isMine: true })],
    ]);
    const second = createInitialState([
      [{ ...createCell({ isMine: false }), isFlagged: true }, createCell({ isMine: true })],
      [{ ...createCell({ neighborMines: 1 }), isRevealed: true }, createCell({ isMine: false })],
    ]);

    expect(createAiPublicView(first, config)).toEqual(createAiPublicView(second, config));
  });
});
