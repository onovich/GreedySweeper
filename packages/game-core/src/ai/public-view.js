export function createAiPublicView(state, config) {
  const view = {
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
  if (state.rulesVersion === '2' && state.greed) {
    view.greed = { streak: state.greed.streak, bonusPot: state.greed.bonusPot };
  }
  return view;
}
