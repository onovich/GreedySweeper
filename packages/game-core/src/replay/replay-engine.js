import { GREED_REPLAY_VERSION, REPLAY_VERSION } from '../config/protocol-config';
import { createChallengeBoard } from '../challenge/board';
import { validateChallengeDescriptor } from '../challenge/contracts';
import { applyAction } from '../engine/transition';
import { createGreedInitialState, createInitialState } from '../model/factories';
import { validateActionLog } from './action-log';
import { REPLAY_ERROR_CODES } from './contracts';

export function replayGame({ version, descriptor, actions = [] } = {}) {
  const replayVersion =
    version ?? (descriptor?.rulesVersion === '2' ? GREED_REPLAY_VERSION : REPLAY_VERSION);
  if (replayVersion !== REPLAY_VERSION && replayVersion !== GREED_REPLAY_VERSION) {
    return createReplayFailure(REPLAY_ERROR_CODES.unsupportedVersion);
  }

  const descriptorValidation = validateChallengeDescriptor(descriptor);
  if (!descriptorValidation.ok) return descriptorValidation;

  const actionLogValidation = validateActionLog(actions);
  if (!actionLogValidation.ok) return actionLogValidation;

  const expectedActionRecordVersion = descriptorValidation.value.rulesVersion === '2' ? '2' : '1';
  if (actionLogValidation.value.some((record) => record.version !== expectedActionRecordVersion)) {
    return createReplayFailure(REPLAY_ERROR_CODES.invalidActionLog);
  }

  const boardResult = createChallengeBoard(descriptorValidation.value);
  if (!boardResult.ok) return boardResult;

  if (
    (descriptorValidation.value.rulesVersion === '2' && replayVersion !== GREED_REPLAY_VERSION) ||
    (descriptorValidation.value.rulesVersion === '1' && replayVersion !== REPLAY_VERSION)
  ) {
    return createReplayFailure(REPLAY_ERROR_CODES.unsupportedVersion);
  }
  let state =
    descriptorValidation.value.rulesVersion === '2'
      ? createGreedInitialState(boardResult.value.board)
      : createInitialState(boardResult.value.board);
  const results = [];

  for (const record of actionLogValidation.value) {
    const transition = applyAction(
      state,
      record.action,
      descriptorValidation.value.board,
      undefined,
      descriptorValidation.value,
    );
    state = transition.state;
    results.push({ sequence: record.sequence, result: transition.result });
  }

  return createReplaySuccess({
    descriptor: descriptorValidation.value,
    state,
    results,
  });
}

export function replayGameAt(replay, actionCount) {
  if (!Number.isInteger(actionCount) || actionCount < 0) {
    return createReplayFailure(REPLAY_ERROR_CODES.invalidActionLog);
  }

  return replayGame({
    ...replay,
    actions: Array.isArray(replay?.actions) ? replay.actions.slice(0, actionCount) : [],
  });
}

function createReplaySuccess(value) {
  return { ok: true, value };
}

function createReplayFailure(code) {
  return { ok: false, error: { code } };
}
