import { BOARD_CONFIG } from '../config/game-config';
import { PLAYERS, createRevealAction } from '../model/contracts';
import { getHiddenCandidates, selectCertainAction } from './candidates';
import { DEFAULT_AI_POLICY, validateAiPolicy } from './policy-config';
import { createAiPublicView } from './public-view';

export function selectAiAction(
  state,
  config = BOARD_CONFIG,
  random = Math.random,
  policy = DEFAULT_AI_POLICY,
) {
  const policyValidation = validateAiPolicy(policy);
  if (!policyValidation.ok) return null;
  const publicView = createAiPublicView(state, config);
  const hidden = getHiddenCandidates(publicView);
  if (hidden.length === 0) return null;

  if (policyValidation.value.difficulty === 'easy') {
    const choice = hidden[Math.floor(random() * hidden.length)];
    return createRevealAction(choice.row, choice.column, PLAYERS.ai);
  }

  const certainAction = selectCertainAction(publicView);
  if (certainAction) return certainAction;
  const choice = hidden[Math.floor(random() * hidden.length)];
  return createRevealAction(choice.row, choice.column, PLAYERS.ai);
}
