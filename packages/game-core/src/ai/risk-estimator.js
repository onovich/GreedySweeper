import { getNeighborCoordinates } from '../engine/coordinates';

export function estimateCandidateRisk(publicView, candidate) {
  const constraints = getNeighborCoordinates(candidate.row, candidate.column, publicView)
    .map(({ row, column }) => ({ row, column, cell: publicView.board[row][column] }))
    .filter(({ cell }) => cell.isRevealed && cell.neighborMines > 0)
    .map(({ row, column, cell }) => {
      const neighbors = getNeighborCoordinates(row, column, publicView);
      const hidden = neighbors.filter(({ row: nextRow, column: nextColumn }) => {
        const next = publicView.board[nextRow][nextColumn];
        return !next.isRevealed && !next.isFlagged;
      });
      const flagged = neighbors.filter(
        ({ row: nextRow, column: nextColumn }) => publicView.board[nextRow][nextColumn].isFlagged,
      );
      return hidden.length === 0 ? null : (cell.neighborMines - flagged.length) / hidden.length;
    })
    .filter((risk) => risk !== null);

  if (constraints.length === 0) return { risk: 0.5, confidence: 0 };
  const risk = constraints.reduce((sum, value) => sum + value, 0) / constraints.length;
  return { risk: Math.max(0, Math.min(1, risk)), confidence: constraints.length };
}
