import {
  ACTION_RECORD_VERSION,
  GREED_ACTION_RECORD_VERSION,
  GREED_REPLAY_VERSION,
  REPLAY_VERSION,
} from '../config/protocol-config';
import { isGameAction } from '../model/contracts';

export const REPLAY_ERROR_CODES = Object.freeze({
  malformed: 'replay_malformed',
  unsupportedVersion: 'replay_version_unsupported',
  invalidActionRecord: 'replay_action_record_invalid',
  invalidActionLog: 'replay_action_log_invalid',
  truncated: 'replay_truncated',
  summaryMismatch: 'replay_summary_mismatch',
});

export function createActionRecord(sequence, action, version = ACTION_RECORD_VERSION) {
  const actionRecord = { type: action.type, player: action.player };
  if ('row' in action) actionRecord.row = action.row;
  if ('column' in action) actionRecord.column = action.column;
  return {
    version,
    sequence,
    action: actionRecord,
  };
}

export function isActionRecord(value) {
  return Boolean(
    value &&
      (value.version === ACTION_RECORD_VERSION || value.version === GREED_ACTION_RECORD_VERSION) &&
      Number.isInteger(value.sequence) &&
      value.sequence >= 0 &&
      isGameAction(value.action),
    !(value.version === ACTION_RECORD_VERSION && value.action.type === 'bank'),
  );
}

export function getActionRecordVersion(rules) {
  return rules?.rulesVersion === '2' ? GREED_ACTION_RECORD_VERSION : ACTION_RECORD_VERSION;
}

export function getReplayVersion(rules) {
  return rules?.rulesVersion === '2' ? GREED_REPLAY_VERSION : REPLAY_VERSION;
}

export function createReplay({
  descriptor,
  actions = [],
  expectedSummary = null,
  version = REPLAY_VERSION,
}) {
  return { version, descriptor, actions, expectedSummary };
}
