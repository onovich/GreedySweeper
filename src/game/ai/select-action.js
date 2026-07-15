import { BOARD_CONFIG } from '../config/game-config';
import { createFlagAction, createRevealAction, PLAYERS } from '../model/contracts';
import { getNeighborCoordinates } from '../engine/coordinates';

export function selectAiAction(state, config = BOARD_CONFIG, random = Math.random) {
  for (let row = 0; row < config.rows; row += 1) {
    for (let column = 0; column < config.columns; column += 1) {
      const cell = state.board[row][column];
      if (!cell.isRevealed || cell.isMine || cell.neighborMines <= 0) continue;

      const neighbors = getNeighborCoordinates(row, column, config);
      const hidden = neighbors.filter(({ row: neighborRow, column: neighborColumn }) => {
        const neighbor = state.board[neighborRow][neighborColumn];
        return !neighbor.isRevealed && !neighbor.isFlagged;
      });
      const flagged = neighbors.filter(
        ({ row: neighborRow, column: neighborColumn }) =>
          state.board[neighborRow][neighborColumn].isFlagged,
      );

      if (hidden.length > 0 && hidden.length + flagged.length === cell.neighborMines) {
        return createFlagAction(hidden[0].row, hidden[0].column, PLAYERS.ai);
      }

      if (hidden.length > 0 && flagged.length === cell.neighborMines) {
        return createRevealAction(hidden[0].row, hidden[0].column, PLAYERS.ai);
      }
    }
  }

  const hidden = state.board.flatMap((row, rowIndex) =>
    row.flatMap((cell, columnIndex) =>
      !cell.isRevealed && !cell.isFlagged ? [{ row: rowIndex, column: columnIndex }] : [],
    ),
  );

  if (hidden.length === 0) return null;
  const choice = hidden[Math.floor(random() * hidden.length)];
  return createRevealAction(choice.row, choice.column, PLAYERS.ai);
}
