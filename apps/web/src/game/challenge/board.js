import { createBoard } from '../engine/board';
import { createSeededRandom } from '../random/seeded-random';
import { createProtocolSuccess, validateChallengeDescriptor } from './contracts';

export function createChallengeBoard(descriptor) {
  const validation = validateChallengeDescriptor(descriptor);
  if (!validation.ok) return validation;

  return createProtocolSuccess({
    descriptor: validation.value,
    board: createBoard(validation.value.board, createSeededRandom(validation.value.seed)),
  });
}
