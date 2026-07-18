import { describe, expect, it } from 'vitest';
import { createBoard } from '@greedy-sweeper/game-core/engine/board';
import { getNeighborCoordinates } from '@greedy-sweeper/game-core/engine/coordinates';
import { revealFlood } from '@greedy-sweeper/game-core/engine/flood-reveal';
import { createCell } from '@greedy-sweeper/game-core/model/factories';

const smallBoard = { rows: 3, columns: 3, totalMines: 1 };

describe('board engine', () => {
  it('places a deterministic mine and calculates adjacent mine counts', () => {
    const board = createBoard(smallBoard, () => 0);

    expect(board[0][0].isMine).toBe(true);
    expect(board[0][1].neighborMines).toBe(1);
    expect(board[1][1].neighborMines).toBe(1);
    expect(board[2][2].neighborMines).toBe(0);
    expect(getNeighborCoordinates(0, 0, smallBoard)).toHaveLength(3);
  });

  it('rejects impossible mine configurations instead of producing an invalid board', () => {
    expect(() => createBoard({ rows: 1, columns: 1, totalMines: 2 }, () => 0)).toThrow(RangeError);
  });

  it('reveals zero regions without mutating the supplied board and scores numbered flood cells', () => {
    const board = [
      [createCell({ neighborMines: 0 }), createCell({ neighborMines: 1 })],
      [createCell({ neighborMines: 0 }), createCell({ isMine: true })],
    ];

    const result = revealFlood(board, 0, 0, { rows: 2, columns: 2, totalMines: 1 });

    expect(board[0][0].isRevealed).toBe(false);
    expect(result.revealedCells).toEqual(
      expect.arrayContaining([
        { row: 0, column: 0 },
        { row: 0, column: 1 },
        { row: 1, column: 0 },
      ]),
    );
    expect(result.board[1][1].isRevealed).toBe(false);
    expect(result.floodScore).toBe(1);
  });

  it('does not reveal flagged or mined cells during flood traversal', () => {
    const board = [
      [createCell({ neighborMines: 0 }), { ...createCell({ neighborMines: 0 }), isFlagged: true }],
      [createCell({ neighborMines: 0 }), createCell({ isMine: true })],
    ];

    const result = revealFlood(board, 0, 0, { rows: 2, columns: 2, totalMines: 1 });

    expect(result.board[0][1].isRevealed).toBe(false);
    expect(result.board[1][1].isRevealed).toBe(false);
  });
});
