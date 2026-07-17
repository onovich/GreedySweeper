import { BOARD_CONFIG } from '../config/game-config';
import {
  GREED_CHALLENGE_MODE,
  GREED_DAILY_CHALLENGE_NAMESPACE,
  GREED_RULES_VERSION,
} from '../config/protocol-config';
import { createChallengeDescriptor } from './contracts';

export function createDailyChallenge(date = new Date(), board = BOARD_CONFIG) {
  const day = getUtcDay(date);
  if (day === null) return null;

  return createChallengeDescriptor({
    seed: hashSeed(`${GREED_DAILY_CHALLENGE_NAMESPACE}:${day}`),
    board,
    mode: GREED_CHALLENGE_MODE,
    rulesVersion: GREED_RULES_VERSION,
  });
}

export function getUtcDay(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function hashSeed(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193);
  }
  return hash >>> 0;
}
