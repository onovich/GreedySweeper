import { PLAYERS } from './contracts';

export function createCell({ isMine = false, neighborMines = 0 } = {}) {
  return {
    isMine,
    isRevealed: false,
    isFlagged: false,
    isWrongFlag: false,
    flagger: null,
    neighborMines,
    isExploded: false,
  };
}

export function createInitialState(board = []) {
  return {
    board,
    humanScore: 0,
    aiScore: 0,
    gameOver: false,
    minesFound: 0,
    currentPlayer: PLAYERS.human,
    actionMessage: '游戏开始，请玩家操作。',
  };
}

export function createGreedInitialState(board = []) {
  return {
    ...createInitialState(board),
    rulesVersion: '2',
    mode: 'greed',
    greed: { streak: 0, bonusPot: 0 },
  };
}

export function createSeededRng(sequence) {
  let index = 0;
  return () => {
    const value = sequence[index % sequence.length];
    index += 1;
    return value;
  };
}
