import { BOARD_CONFIG, SCORE_CONFIG } from '../config/game-config';
import {
  ACTION_TYPES,
  PLAYERS,
  RESULT_TYPES,
  createResult,
  isGameAction,
} from '../model/contracts';
import { cloneBoard } from './board';
import { isCoordinateInBounds } from './coordinates';
import { revealFlood } from './flood-reveal';

export function applyAction(state, action, config = BOARD_CONFIG, scoreConfig = SCORE_CONFIG) {
  if (
    state.gameOver ||
    !isGameAction(action) ||
    action.player !== state.currentPlayer ||
    !isCoordinateInBounds(action.row, action.column, config)
  ) {
    return { state, result: createResult(RESULT_TYPES.ignored) };
  }

  const initialCell = state.board[action.row][action.column];
  if (initialCell.isRevealed || initialCell.isFlagged) {
    return { state, result: createResult(RESULT_TYPES.ignored) };
  }

  const next = {
    ...state,
    board: cloneBoard(state.board),
  };
  const cell = next.board[action.row][action.column];
  const events = [];

  if (action.type === ACTION_TYPES.flag) {
    applyFlag(next, cell, action, scoreConfig, events);
  } else {
    applyReveal(next, cell, action, config, scoreConfig, events);
  }

  if (next.minesFound === config.totalMines) {
    next.gameOver = true;
    next.actionMessage = '游戏结束！结算中…';
    events.push({ type: 'game_over', winner: getWinner(next) });
  }

  return { state: next, result: createResult(RESULT_TYPES.applied, events) };
}

function applyFlag(state, cell, action, scoreConfig, events) {
  cell.isRevealed = true;
  state.currentPlayer = otherPlayer(action.player);

  if (cell.isMine) {
    cell.isFlagged = true;
    cell.flagger = action.player;
    state.minesFound += 1;
    addScore(state, action.player, scoreConfig.correctFlag);
    state.actionMessage = `${playerLabel(action.player)} 标记正确！加 ${scoreConfig.correctFlag} 分，回合结束。`;
    events.push({ type: 'correct_flag', player: action.player, points: scoreConfig.correctFlag });
    return;
  }

  cell.isWrongFlag = true;
  addScore(state, action.player, scoreConfig.wrongFlag);
  state.actionMessage = `${playerLabel(action.player)} 标记失误，扣 ${Math.abs(scoreConfig.wrongFlag)} 分，回合结束。`;
  events.push({ type: 'wrong_flag', player: action.player, points: scoreConfig.wrongFlag });
}

function applyReveal(state, cell, action, config, scoreConfig, events) {
  if (cell.isMine) {
    cell.isRevealed = true;
    cell.isExploded = true;
    state.minesFound += 1;
    state.currentPlayer = otherPlayer(action.player);
    addScore(state, action.player, scoreConfig.explodedMine);
    state.actionMessage = `${playerLabel(action.player)} 踩雷了！扣 ${Math.abs(scoreConfig.explodedMine)} 分，回合结束。`;
    events.push({ type: 'exploded_mine', player: action.player, points: scoreConfig.explodedMine });
    return;
  }

  const reveal = revealFlood(state.board, action.row, action.column, config);
  state.board = reveal.board;
  const points = cell.neighborMines + reveal.floodScore;
  addScore(state, action.player, points);
  state.actionMessage = `${playerLabel(action.player)} 翻开安全区，爆赚 ${points} 分！继续行动。`;
  events.push({
    type: 'safe_reveal',
    player: action.player,
    points,
    revealedCells: reveal.revealedCells,
  });
}

function addScore(state, player, points) {
  if (player === PLAYERS.human) {
    state.humanScore += points;
  } else {
    state.aiScore += points;
  }
}

function otherPlayer(player) {
  return player === PLAYERS.human ? PLAYERS.ai : PLAYERS.human;
}

function playerLabel(player) {
  return player === PLAYERS.human ? '玩家' : 'AI';
}

function getWinner(state) {
  if (state.humanScore === state.aiScore) return 'draw';
  return state.humanScore > state.aiScore ? PLAYERS.human : PLAYERS.ai;
}
