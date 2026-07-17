import { BOARD_CONFIG } from '../config/game-config';
import { createCell } from '../model/factories';
import { getNeighborCoordinates } from './coordinates';

export function createBoard(config = BOARD_CONFIG, random = Math.random) {
  const board = Array.from({ length: config.rows }, () =>
    Array.from({ length: config.columns }, () => createCell()),
  );
  const totalCells = config.rows * config.columns;

  if (config.totalMines > totalCells) {
    throw new RangeError('The board cannot contain more mines than cells.');
  }

  let minesPlaced = 0;
  while (minesPlaced < config.totalMines) {
    const index = Math.floor(random() * totalCells);
    const row = Math.floor(index / config.columns);
    const column = index % config.columns;

    if (!board[row][column].isMine) {
      board[row][column] = createCell({ isMine: true });
      minesPlaced += 1;
    }
  }

  return board.map((row, rowIndex) =>
    row.map((cell, columnIndex) => {
      if (cell.isMine) return cell;
      const neighborMines = getNeighborCoordinates(rowIndex, columnIndex, config).filter(
        ({ row: neighborRow, column: neighborColumn }) => board[neighborRow][neighborColumn].isMine,
      ).length;
      return createCell({ neighborMines });
    }),
  );
}

export function cloneBoard(board) {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}
