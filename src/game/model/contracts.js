export const PLAYERS = Object.freeze({
  human: 'human',
  ai: 'ai',
});

export const ACTION_TYPES = Object.freeze({
  reveal: 'reveal',
  flag: 'flag',
});

export const RESULT_TYPES = Object.freeze({
  applied: 'applied',
  ignored: 'ignored',
  invalid: 'invalid',
});

export function createRevealAction(row, column, player) {
  return createAction(ACTION_TYPES.reveal, row, column, player);
}

export function createFlagAction(row, column, player) {
  return createAction(ACTION_TYPES.flag, row, column, player);
}

export function createAction(type, row, column, player) {
  return { type, row, column, player };
}

export function createResult(type, events = []) {
  return { type, events };
}

export function isPlayer(value) {
  return Object.values(PLAYERS).includes(value);
}

export function isGameAction(value) {
  return Boolean(
    value &&
    Object.values(ACTION_TYPES).includes(value.type) &&
    Number.isInteger(value.row) &&
    Number.isInteger(value.column) &&
    isPlayer(value.player),
  );
}
