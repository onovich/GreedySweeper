import { getNeighborCoordinates } from '../engine/coordinates';
import { PLAYERS, createFlagAction, createRevealAction } from '../model/contracts';

export function selectCertainAction(publicView) {
  const config = publicView;
  for (let row = 0; row < config.rows; row += 1) {
    for (let column = 0; column < config.columns; column += 1) {
      const cell = publicView.board[row][column];
      if (!cell.isRevealed || cell.neighborMines <= 0) continue;

      const neighbors = getNeighborCoordinates(row, column, config);
      const hidden = neighbors.filter(({ row: nextRow, column: nextColumn }) => {
        const neighbor = publicView.board[nextRow][nextColumn];
        return !neighbor.isRevealed && !neighbor.isFlagged;
      });
      const flagged = neighbors.filter(
        ({ row: nextRow, column: nextColumn }) => publicView.board[nextRow][nextColumn].isFlagged,
      );

      if (hidden.length > 0 && hidden.length + flagged.length === cell.neighborMines) {
        return createFlagAction(hidden[0].row, hidden[0].column, PLAYERS.ai);
      }
      if (hidden.length > 0 && flagged.length === cell.neighborMines) {
        return createRevealAction(hidden[0].row, hidden[0].column, PLAYERS.ai);
      }
    }
  }
  return null;
}

export function getHiddenCandidates(publicView) {
  return publicView.board.flatMap((row, rowIndex) =>
    row.flatMap((cell, column) =>
      !cell.isRevealed && !cell.isFlagged ? [{ row: rowIndex, column }] : [],
    ),
  );
}
