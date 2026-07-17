export const ONLINE_PROTOCOL_VERSION = '1';
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
});
const REQUIRED = Object.freeze({
  authenticate: ['seatToken'],
  submit_command: ['commandId', 'sequence', 'action'],
  pong: ['nonce'],
});
export function validateEnvelope(value, allowedTypes) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return fail(ONLINE_ERROR_CODES.malformed);
  if (JSON.stringify(value).length > 16384) return fail(ONLINE_ERROR_CODES.oversize);
  const fields = Object.keys(value);
  if (fields.some((key) => !['version', 'type', 'payload'].includes(key)))
    return fail(ONLINE_ERROR_CODES.unknownField);
  if (value.version !== ONLINE_PROTOCOL_VERSION) return fail(ONLINE_ERROR_CODES.unsupportedVersion);
  if (!allowedTypes.includes(value.type)) return fail(ONLINE_ERROR_CODES.unknownType);
  const payload = value.payload ?? {};
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    return fail(ONLINE_ERROR_CODES.malformed);
  if (allowedTypes === CLIENT_MESSAGE_TYPES) {
    const required = REQUIRED[value.type];
    if (required?.some((key) => !(key in payload))) return fail(ONLINE_ERROR_CODES.malformed);
    if (
      value.type === 'submit_command' &&
      (!Number.isInteger(payload.sequence) ||
        payload.sequence < 0 ||
        typeof payload.commandId !== 'string')
    )
      return fail(ONLINE_ERROR_CODES.malformed);
  }
  return ok({ version: value.version, type: value.type, payload });
}
export function validateClientMessage(value) {
  return validateEnvelope(value, CLIENT_MESSAGE_TYPES);
}
export function validateServerMessage(value) {
  return validateEnvelope(value, SERVER_MESSAGE_TYPES);
}
export function validatePublicSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || JSON.stringify(snapshot).includes('isMine'))
    return fail(ONLINE_ERROR_CODES.malformed);
  return ok(snapshot);
}
function ok(value) {
  return { ok: true, value };
}
function fail(code) {
  return { ok: false, error: { code } };
}
