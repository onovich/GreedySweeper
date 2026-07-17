import { BOARD_CONFIG } from '../config/game-config';
import { PLAYERS } from '../model/contracts';

const NUMBER_COLOR_CLASSES = [
  '',
  'text-blue-400',
  'text-green-400',
  'text-red-400',
  'text-purple-400',
  'text-amber-500',
  'text-teal-400',
  'text-gray-900',
  'text-gray-600',
];

export function getNumberColorClass(neighborMines) {
  return NUMBER_COLOR_CLASSES[neighborMines] ?? '';
}

export function getRemainingMines(state, config = BOARD_CONFIG) {
  return config.totalMines - state.minesFound;
}

export function getWinner(state) {
  if (state.humanScore === state.aiScore) return 'draw';
  return state.humanScore > state.aiScore ? PLAYERS.human : PLAYERS.ai;
}
