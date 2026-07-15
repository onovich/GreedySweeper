import { BOARD_CONFIG } from '../config/game-config';

export function getNeighborCoordinates(row, column, config = BOARD_CONFIG) {
  const coordinates = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (rowOffset === 0 && columnOffset === 0) continue;

      const nextRow = row + rowOffset;
      const nextColumn = column + columnOffset;
      if (nextRow >= 0 && nextRow < config.rows && nextColumn >= 0 && nextColumn < config.columns) {
        coordinates.push({ row: nextRow, column: nextColumn });
      }
    }
  }

  return coordinates;
}

export function isCoordinateInBounds(row, column, config = BOARD_CONFIG) {
  return row >= 0 && row < config.rows && column >= 0 && column < config.columns;
}
