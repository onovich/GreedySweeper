import { ACTION_RECORD_VERSION } from '../config/protocol-config';
import { isGameAction } from '../model/contracts';
import { REPLAY_ERROR_CODES, createActionRecord, isActionRecord } from './contracts';

export function appendActionRecord(actionLog, action) {
  const validation = validateActionLog(actionLog);
  if (!validation.ok) return validation;

  if (!isGameAction(action)) {
    return createReplayFailure(REPLAY_ERROR_CODES.invalidActionRecord);
  }

  return createReplaySuccess([
    ...validation.value,
    createActionRecord(validation.value.length, action),
  ]);
}

export function validateActionLog(actionLog) {
  if (!Array.isArray(actionLog)) {
    return createReplayFailure(REPLAY_ERROR_CODES.invalidActionLog);
  }

  for (let sequence = 0; sequence < actionLog.length; sequence += 1) {
    const record = actionLog[sequence];
    if (
      !isActionRecord(record) ||
      record.version !== ACTION_RECORD_VERSION ||
      record.sequence !== sequence
    ) {
      return createReplayFailure(REPLAY_ERROR_CODES.invalidActionLog);
    }
  }

  return createReplaySuccess(
    actionLog.map((record) => createActionRecord(record.sequence, record.action)),
  );
}

function createReplaySuccess(value) {
  return { ok: true, value };
}

function createReplayFailure(code) {
  return { ok: false, error: { code } };
}
