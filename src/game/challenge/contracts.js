import { BOARD_CONFIG } from '../config/game-config';
import {
  CHALLENGE_VERSION,
  DEFAULT_CHALLENGE_MODE,
  RULES_VERSION,
} from '../config/protocol-config';

export const CHALLENGE_ERROR_CODES = Object.freeze({
  malformed: 'challenge_malformed',
  unsupportedRulesVersion: 'challenge_rules_version_unsupported',
  unsupportedChallengeVersion: 'challenge_version_unsupported',
  invalidConfiguration: 'challenge_configuration_invalid',
  invalidSeed: 'challenge_seed_invalid',
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
    seed,
    mode,
  };
}

export function createProtocolError(code, message) {
  return { ok: false, error: { code, message } };
}

export function createProtocolSuccess(value) {
  return { ok: true, value };
}
