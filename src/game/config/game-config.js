export const BOARD_CONFIG = Object.freeze({
  rows: 16,
  columns: 16,
  totalMines: 40,
});

export const SCORE_CONFIG = Object.freeze({
  correctFlag: 5,
  wrongFlag: -5,
  explodedMine: -5,
});

export const TIMING_CONFIG = Object.freeze({
  aiDelayMs: 800,
  longPressMs: 400,
});
