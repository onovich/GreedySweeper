import { isGameAction } from '../model/contracts';
import {
  REPLAY_ERROR_CODES,
  createActionRecord,
  getActionRecordVersion,
  isActionRecord,
} from './contracts';

export function appendActionRecord(actionLog, action, rules = null) {
  const validation = validateActionLog(actionLog);
  if (!validation.ok) return validation;

  if (!isGameAction(action)) {
    return createReplayFailure(REPLAY_ERROR_CODES.invalidActionRecord);
  }

  const record = createActionRecord(validation.value.length, action, getActionRecordVersion(rules));
  if (!isActionRecord(record)) return createReplayFailure(REPLAY_ERROR_CODES.invalidActionRecord);
  return createReplaySuccess([...validation.value, record]);
}

export function validateActionLog(actionLog) {
  if (!Array.isArray(actionLog)) {
    return createReplayFailure(REPLAY_ERROR_CODES.invalidActionLog);
  }

  for (let sequence = 0; sequence < actionLog.length; sequence += 1) {
    const record = actionLog[sequence];
    if (!isActionRecord(record) || record.sequence !== sequence) {
      return createReplayFailure(REPLAY_ERROR_CODES.invalidActionLog);
    }
  }

  return createReplaySuccess(
    actionLog.map((record) => createActionRecord(record.sequence, record.action, record.version)),
  );
}

function createReplaySuccess(value) {
  return { ok: true, value };
}

function createReplayFailure(code) {
  return { ok: false, error: { code } };
}
