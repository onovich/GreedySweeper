import { isGameAction } from '@greedy-sweeper/game-core/model/contracts';

export const ONLINE_PROTOCOL_VERSION = '1';
export const ONLINE_MESSAGE_MAX_BYTES = 16384;
export const ROOM_CODE_PATTERN = /^[A-Z2-9]{6}$/;
export const COMMAND_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
export const CLIENT_MESSAGE_TYPES = Object.freeze(['authenticate', 'submit_command', 'pong']);
export const SERVER_MESSAGE_TYPES = Object.freeze([
  'authenticated',
  'snapshot',
  'command_accepted',
  'command_rejected',
  'match_paused',
  'match_resumed',
  'match_terminal',
  'ping',
  'protocol_error',
]);
export const ONLINE_ERROR_CODES = Object.freeze({
  malformed: 'online_malformed',
  unsupportedVersion: 'online_version_unsupported',
  unknownType: 'online_unknown_type',
  unknownField: 'online_unknown_field',
  oversize: 'online_oversize',
  staleSequence: 'online_stale_sequence',
  duplicateId: 'online_duplicate_id',
  incompatibleRules: 'online_rules_incompatible',
  hiddenState: 'online_hidden_state',
});

const REQUIRED = Object.freeze({
  authenticate: ['seatToken'],
  submit_command: ['commandId', 'sequence', 'action'],
  pong: ['nonce'],
  authenticated: ['seat'],
  snapshot: ['snapshot'],
  command_accepted: ['commandId', 'sequence'],
  command_rejected: ['commandId', 'sequence', 'error'],
  match_paused: [],
  match_resumed: [],
  match_terminal: ['result'],
  ping: ['nonce'],
  protocol_error: ['error'],
});

export function validateEnvelope(value, allowedTypes) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('online_malformed');
  const serialized = safelySerialize(value);
  if (serialized === null) return fail('online_malformed');
  if (serialized.length > ONLINE_MESSAGE_MAX_BYTES) return fail('online_oversize');
  if (Object.keys(value).some((key) => !['version', 'type', 'payload'].includes(key)))
    return fail('online_unknown_field');
  if (value.version !== ONLINE_PROTOCOL_VERSION) return fail('online_version_unsupported');
  if (!allowedTypes.includes(value.type)) return fail('online_unknown_type');

  const payload = value.payload ?? {};
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    return fail('online_malformed');
  const required = REQUIRED[value.type] ?? [];
  if (required.some((key) => !(key in payload))) return fail('online_malformed');
  if (Object.keys(payload).some((key) => !required.includes(key)))
    return fail('online_unknown_field');
  if (allowedTypes === CLIENT_MESSAGE_TYPES && !isValidClientPayload(value.type, payload))
    return fail('online_malformed');
  if (allowedTypes === SERVER_MESSAGE_TYPES && !isValidServerPayload(value.type, payload))
    return fail('online_malformed');
  return ok({ version: value.version, type: value.type, payload });
}

export function validateClientMessage(value) {
  return validateEnvelope(value, CLIENT_MESSAGE_TYPES);
}

export function validateServerMessage(value) {
  return validateEnvelope(value, SERVER_MESSAGE_TYPES);
}

export function validatePublicSnapshot(snapshot) {
  const serialized = safelySerialize(snapshot);
  if (!snapshot || typeof snapshot !== 'object' || serialized === null)
    return fail('online_malformed');
  if (containsHiddenBoardField(snapshot)) return fail('online_hidden_state');
  return ok(JSON.parse(serialized));
}

export function validatePublicBoardProjection(projection) {
  const snapshot = validatePublicSnapshot(projection);
  if (!snapshot.ok) return snapshot;
  if (!Array.isArray(projection.cells)) return fail('online_malformed');
  const invalidCell = projection.cells.some((cell) => {
    if (!cell || typeof cell !== 'object' || Array.isArray(cell)) return true;
    if (Object.keys(cell).some((key) => !['row', 'column', 'state', 'neighborMines'].includes(key)))
      return true;
    if (!Number.isInteger(cell.row) || !Number.isInteger(cell.column)) return true;
    if (!['hidden', 'revealed', 'flagged'].includes(cell.state)) return true;
    return cell.state === 'hidden' && 'neighborMines' in cell;
  });
  return invalidCell ? fail('online_malformed') : snapshot;
}

function isValidCommand(payload) {
  return (
    Number.isInteger(payload.sequence) &&
    payload.sequence >= 0 &&
    typeof payload.commandId === 'string' &&
    COMMAND_ID_PATTERN.test(payload.commandId) &&
    isGameAction(payload.action)
  );
}

function isValidClientPayload(type, payload) {
  if (type === 'authenticate') return isNonEmptyString(payload.seatToken, 256);
  if (type === 'pong') return isNonEmptyString(payload.nonce, 128);
  return type !== 'submit_command' || isValidCommand(payload);
}

function isValidServerPayload(type, payload) {
  if (type === 'authenticated') return isNonEmptyString(payload.seat, 32);
  if (type === 'snapshot') return validatePublicSnapshot(payload.snapshot).ok;
  if (type === 'command_accepted')
    return COMMAND_ID_PATTERN.test(payload.commandId) && Number.isInteger(payload.sequence);
  if (type === 'command_rejected')
    return (
      COMMAND_ID_PATTERN.test(payload.commandId) &&
      Number.isInteger(payload.sequence) &&
      isNonEmptyString(payload.error, 128)
    );
  if (type === 'match_terminal') return isNonEmptyString(payload.result, 32);
  if (type === 'ping') return isNonEmptyString(payload.nonce, 128);
  if (type === 'protocol_error') return isNonEmptyString(payload.error, 128);
  return type === 'match_paused' || type === 'match_resumed';
}

function isNonEmptyString(value, maxLength) {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

function safelySerialize(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function containsHiddenBoardField(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, nested]) => {
    if (['isMine', 'mine', 'seed', 'boardSeed'].includes(key)) return true;
    return Array.isArray(nested)
      ? nested.some((item) => containsHiddenBoardField(item))
      : containsHiddenBoardField(nested);
  });
}

function ok(value) {
  return { ok: true, value };
}

function fail(code) {
  return { ok: false, error: { code } };
}
