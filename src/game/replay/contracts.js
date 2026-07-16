import { ACTION_RECORD_VERSION, REPLAY_VERSION } from '../config/protocol-config';
import { isGameAction } from '../model/contracts';

export const REPLAY_ERROR_CODES = Object.freeze({
  malformed: 'replay_malformed',
  unsupportedVersion: 'replay_version_unsupported',
  invalidActionRecord: 'replay_action_record_invalid',
  truncated: 'replay_truncated',
  summaryMismatch: 'replay_summary_mismatch',
});

export function createActionRecord(sequence, action, version = ACTION_RECORD_VERSION) {
  return { version, sequence, action };
}

export function isActionRecord(value) {
  return Boolean(
    value &&
    value.version === ACTION_RECORD_VERSION &&
    Number.isInteger(value.sequence) &&
    value.sequence >= 0 &&
    isGameAction(value.action),
  );
}

export function createReplay({
  descriptor,
  actions = [],
  expectedSummary = null,
  version = REPLAY_VERSION,
}) {
  return { version, descriptor, actions, expectedSummary };
}
