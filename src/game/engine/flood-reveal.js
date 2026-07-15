import { BOARD_CONFIG } from '../config/game-config';
import { cloneBoard } from './board';
import { getNeighborCoordinates, isCoordinateInBounds } from './coordinates';

export function revealFlood(board, startRow, startColumn, config = BOARD_CONFIG) {
  if (!isCoordinateInBounds(startRow, startColumn, config)) {
    return { board, revealedCells: [], floodScore: 0 };
  }

  const nextBoard = cloneBoard(board);
  const revealedCells = [];
  let floodScore = 0;
  const pending = [{ row: startRow, column: startColumn }];

  while (pending.length > 0) {
    const { row, column } = pending.pop();
    const cell = nextBoard[row][column];

    if (cell.isRevealed || cell.isFlagged || cell.isMine) continue;

    cell.isRevealed = true;
    revealedCells.push({ row, column });

    if ((row !== startRow || column !== startColumn) && cell.neighborMines > 0) {
      floodScore += cell.neighborMines;
    }

    if (cell.neighborMines === 0) {
      pending.push(...getNeighborCoordinates(row, column, config));
    }
  }

  return { board: nextBoard, revealedCells, floodScore };
}
