import { BOARD_CONFIG } from '../config/game-config';
import {
  CHALLENGE_VERSION,
  DEFAULT_CHALLENGE_MODE,
  RULES_VERSION,
} from '../config/protocol-config';
import { normalizeSeed, serializeSeed } from '../random/seeded-random';

export const CHALLENGE_ERROR_CODES = Object.freeze({
  malformed: 'challenge_malformed',
  unsupportedRulesVersion: 'challenge_rules_version_unsupported',
  unsupportedChallengeVersion: 'challenge_version_unsupported',
  invalidConfiguration: 'challenge_configuration_invalid',
  invalidSeed: 'challenge_seed_invalid',
  invalidCode: 'challenge_code_invalid',
  checksumMismatch: 'challenge_code_checksum_mismatch',
});

export function createChallengeDescriptor({
  seed,
  board = BOARD_CONFIG,
  mode = DEFAULT_CHALLENGE_MODE,
  rulesVersion = RULES_VERSION,
  challengeVersion = CHALLENGE_VERSION,
} = {}) {
  return {
    rulesVersion,
    challengeVersion,
    board: {
      rows: board.rows,
      columns: board.columns,
      totalMines: board.totalMines,
    },
    seed: serializeSeed(seed),
    mode,
  };
}

export function validateChallengeDescriptor(descriptor) {
  if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor)) {
    return createProtocolError(
      CHALLENGE_ERROR_CODES.malformed,
      'Challenge descriptor must be an object.',
    );
  }
  if (descriptor.rulesVersion !== RULES_VERSION) {
    return createProtocolError(
      CHALLENGE_ERROR_CODES.unsupportedRulesVersion,
      `Rules version ${descriptor.rulesVersion} is unsupported.`,
    );
  }
  if (descriptor.challengeVersion !== CHALLENGE_VERSION) {
    return createProtocolError(
      CHALLENGE_ERROR_CODES.unsupportedChallengeVersion,
      `Challenge version ${descriptor.challengeVersion} is unsupported.`,
    );
  }
  if (!isValidBoard(descriptor.board) || descriptor.mode !== DEFAULT_CHALLENGE_MODE) {
    return createProtocolError(
      CHALLENGE_ERROR_CODES.invalidConfiguration,
      'Challenge board configuration or mode is invalid.',
    );
  }
  if (normalizeSeed(descriptor.seed) === null) {
    return createProtocolError(CHALLENGE_ERROR_CODES.invalidSeed, 'Challenge seed is invalid.');
  }

  return createProtocolSuccess({
    ...descriptor,
    seed: serializeSeed(descriptor.seed),
    board: { ...descriptor.board },
  });
}

export function createProtocolError(code, message) {
  return { ok: false, error: { code, message } };
}

export function createProtocolSuccess(value) {
  return { ok: true, value };
}

function isValidBoard(board) {
  return Boolean(
    board &&
    Number.isInteger(board.rows) &&
    board.rows > 0 &&
    Number.isInteger(board.columns) &&
    board.columns > 0 &&
    Number.isInteger(board.totalMines) &&
    board.totalMines >= 0 &&
    board.totalMines < board.rows * board.columns,
  );
}
