export function createAiPublicView(state, config) {
  return {
    rows: config.rows,
    columns: config.columns,
    totalMines: config.totalMines,
    board: state.board.map((row) =>
      row.map((cell) => ({
        isRevealed: cell.isRevealed,
        isFlagged: cell.isFlagged,
        neighborMines: cell.isRevealed ? cell.neighborMines : null,
      })),
    ),
  };
}
