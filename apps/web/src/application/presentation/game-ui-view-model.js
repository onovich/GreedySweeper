export const GAME_UI_SCHEMA_VERSION = 1;

export const GAME_UI_VALUES = Object.freeze({
  sessionKinds: Object.freeze(['local', 'online', 'replay']),
  lifecycles: Object.freeze([
    'setup',
    'active',
    'waiting',
    'paused',
    'reconnecting',
    'terminal',
    'error',
  ]),
  authorities: Object.freeze(['local-engine', 'server']),
  lockReasons: Object.freeze([
    null,
    'ai-turn',
    'opponent-turn',
    'command-pending',
    'replay',
    'paused',
    'reconnecting',
    'terminal',
    'error',
  ]),
  boardStates: Object.freeze([
    'ready',
    'locked',
    'pending',
    'paused',
    'reconnecting',
    'replay',
    'empty',
    'error',
    'terminal',
  ]),
  cellStates: Object.freeze([
    'hidden',
    'revealed-empty',
    'revealed-number',
    'flagged-player',
    'flagged-opponent',
    'wrong-flag',
    'exploded',
  ]),
  connectionStates: Object.freeze([
    'unavailable',
    'idle',
    'creating',
    'waiting',
    'inspecting',
    'review',
    'joining',
    'ready',
    'authenticating',
    'connected',
    'command-pending',
    'reconnecting',
    'paused',
    'replaced',
    'abandoned',
    'verification-failed',
    'verified',
    'error',
  ]),
});

export function validateGameUiViewModel(value) {
  const errors = [];
  const requireValue = (actual, allowed, path) => {
    if (!allowed.includes(actual)) errors.push(`${path} has unsupported value ${String(actual)}`);
  };
  const requireInteger = (actual, path, { nullable = false, minimum = null } = {}) => {
    if (nullable && actual === null) return;
    if (!Number.isInteger(actual) || (minimum !== null && actual < minimum)) {
      errors.push(
        `${path} must be ${nullable ? 'null or ' : ''}an integer${minimum === null ? '' : ` >= ${minimum}`}`,
      );
    }
  };

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: ['view model must be an object'] };
  }
  if (value.schemaVersion !== GAME_UI_SCHEMA_VERSION) errors.push('schemaVersion must be 1');
  requireValue(value.session?.kind, GAME_UI_VALUES.sessionKinds, 'session.kind');
  requireValue(value.session?.lifecycle, GAME_UI_VALUES.lifecycles, 'session.lifecycle');
  requireValue(value.session?.authority, GAME_UI_VALUES.authorities, 'session.authority');
  requireValue(value.session?.lockReason, GAME_UI_VALUES.lockReasons, 'session.lockReason');

  if (!Array.isArray(value.scores) || value.scores.length !== 2) {
    errors.push('scores must contain exactly two entries');
  } else {
    for (const [index, score] of value.scores.entries()) {
      requireValue(score.side, ['player', 'opponent'], `scores[${index}].side`);
      requireValue(score.identity, ['player', 'ai'], `scores[${index}].identity`);
      requireInteger(score.value, `scores[${index}].value`, { nullable: true });
      requireValue(
        score.activity,
        ['active', 'inactive', 'winner', 'loser', 'draw', 'unknown'],
        `scores[${index}].activity`,
      );
      requireValue(
        score.settlement,
        ['idle', 'pending', 'confirmed'],
        `scores[${index}].settlement`,
      );
    }
  }

  requireInteger(value.mines?.remaining, 'mines.remaining', { nullable: true, minimum: 0 });
  requireValue(value.mines?.state, ['ready', 'syncing', 'unknown'], 'mines.state');
  requireValue(value.turn?.announcement, ['polite', 'assertive', 'off'], 'turn.announcement');
  requireValue(
    value.matchConfig?.state,
    ['editable', 'review', 'locked', 'invalid'],
    'matchConfig.state',
  );

  const board = value.board;
  requireValue(board?.state, GAME_UI_VALUES.boardStates, 'board.state');
  requireValue(board?.lockReason, GAME_UI_VALUES.lockReasons, 'board.lockReason');
  requireInteger(board?.rows, 'board.rows', { minimum: 1 });
  requireInteger(board?.columns, 'board.columns', { minimum: 1 });
  if (!Array.isArray(board?.cells) || board.cells.length !== board?.rows * board?.columns) {
    errors.push('board.cells must match rows × columns');
  } else {
    const ids = new Set();
    for (const [index, cell] of board.cells.entries()) {
      const path = `board.cells[${index}]`;
      requireValue(cell.state, GAME_UI_VALUES.cellStates, `${path}.state`);
      requireInteger(cell.row, `${path}.row`, { minimum: 0 });
      requireInteger(cell.column, `${path}.column`, { minimum: 0 });
      requireInteger(cell.neighborMines, `${path}.neighborMines`, { nullable: true, minimum: 0 });
      if (typeof cell.id !== 'string' || ids.has(cell.id)) errors.push(`${path}.id must be unique`);
      ids.add(cell.id);
      if (typeof cell.accessibleLabel !== 'string' || !cell.accessibleLabel) {
        errors.push(`${path}.accessibleLabel must be non-empty`);
      }
      if (typeof cell.canReveal !== 'boolean' || typeof cell.canFlag !== 'boolean') {
        errors.push(`${path} capabilities must be boolean`);
      }
      for (const forbidden of ['isMine', 'mine', 'hasMine', 'hiddenValue']) {
        if (Object.hasOwn(cell, forbidden))
          errors.push(`${path} exposes forbidden hidden field ${forbidden}`);
      }
    }
  }

  if (value.greed !== null) {
    requireInteger(value.greed?.streak, 'greed.streak', { minimum: 0 });
    requireValue(value.greed?.multiplier, [0, 1, 2, 3], 'greed.multiplier');
    requireInteger(value.greed?.bonusPot, 'greed.bonusPot', { minimum: 0 });
    requireValue(
      value.greed?.bank?.availability,
      ['disabled', 'enabled', 'pending'],
      'greed.bank.availability',
    );
  }
  if (value.connection !== null) {
    requireValue(value.connection?.state, GAME_UI_VALUES.connectionStates, 'connection.state');
    for (const forbidden of ['seatToken', 'tokenDigest', 'seed', 'salt', 'socket']) {
      if (Object.hasOwn(value.connection ?? {}, forbidden)) {
        errors.push(`connection exposes forbidden secret field ${forbidden}`);
      }
    }
  }
  if (!value.capabilities || typeof value.capabilities !== 'object') {
    errors.push('capabilities must be an object');
  }

  return { ok: errors.length === 0, errors };
}

export function assertGameUiViewModel(value) {
  const result = validateGameUiViewModel(value);
  if (!result.ok)
    throw new TypeError(`Invalid GameUiViewModel v1:\n- ${result.errors.join('\n- ')}`);
  return value;
}
