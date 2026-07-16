import { REPLAY_VERSION } from '../config/protocol-config';
import { REPLAY_ERROR_CODES } from './contracts';
import { replayGame } from './replay-engine';

export function createReplaySummary({ descriptor, state, actionCount }) {
  const payload = {
    descriptor: {
      rulesVersion: descriptor.rulesVersion,
      challengeVersion: descriptor.challengeVersion,
      board: descriptor.board,
      seed: descriptor.seed,
      mode: descriptor.mode,
    },
    actionCount,
    finalState: serializeState(state),
  };

  return {
    replayVersion: REPLAY_VERSION,
    actionCount,
    hash: hashText(stableStringify(payload)),
  };
}

export function validateReplayIntegrity(replay) {
  const replayResult = replayGame(replay);
  if (!replayResult.ok) return replayResult;

  const actualSummary = createReplaySummary({
    descriptor: replayResult.value.descriptor,
    state: replayResult.value.state,
    actionCount: replay?.actions?.length ?? 0,
  });
  const expectedSummary = replay?.expectedSummary;

  if (expectedSummary == null) {
    return createReplaySuccess({ ...replayResult.value, summary: actualSummary });
  }

  if (
    expectedSummary.replayVersion !== REPLAY_VERSION ||
    !Number.isInteger(expectedSummary.actionCount) ||
    typeof expectedSummary.hash !== 'string'
  ) {
    return createReplayFailure(REPLAY_ERROR_CODES.summaryMismatch);
  }

  if (expectedSummary.actionCount > actualSummary.actionCount) {
    return createReplayFailure(REPLAY_ERROR_CODES.truncated);
  }

  if (
    expectedSummary.actionCount !== actualSummary.actionCount ||
    expectedSummary.hash !== actualSummary.hash
  ) {
    return createReplayFailure(REPLAY_ERROR_CODES.summaryMismatch);
  }

  return createReplaySuccess({ ...replayResult.value, summary: actualSummary });
}

function serializeState(state) {
  return {
    humanScore: state.humanScore,
    aiScore: state.aiScore,
    minesFound: state.minesFound,
    gameOver: state.gameOver,
    currentPlayer: state.currentPlayer,
    board: state.board.map((row) =>
      row.map((cell) => [
        cell.isMine ? 1 : 0,
        cell.isRevealed ? 1 : 0,
        cell.isFlagged ? 1 : 0,
        cell.isWrongFlag ? 1 : 0,
        cell.flagger ?? '',
        cell.isExploded ? 1 : 0,
      ]),
    ),
  };
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function hashText(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function createReplaySuccess(value) {
  return { ok: true, value };
}

function createReplayFailure(code) {
  return { ok: false, error: { code } };
}
