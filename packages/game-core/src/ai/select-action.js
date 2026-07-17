import { GREED_CONFIG } from '../config/greed-config';
import { BOARD_CONFIG } from '../config/game-config';
import { PLAYERS, createBankAction, createRevealAction } from '../model/contracts';
import { getHiddenCandidates, selectCertainAction } from './candidates';
import { DEFAULT_AI_POLICY, validateAiPolicy } from './policy-config';
import { createAiPublicView } from './public-view';
import { estimateCandidateRisk } from './risk-estimator';
import { selectUtilityCandidate } from './utility';

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
    if (shouldBank(publicView, null, policyValidation.value, random))
      return createBankAction(PLAYERS.ai);
    const choice = hidden[Math.floor(random() * hidden.length)];
    return createRevealAction(choice.row, choice.column, PLAYERS.ai);
  }

  const certainAction = selectCertainAction(publicView);
  if (certainAction) return certainAction;

  const { difficulty, style } = policyValidation.value;
  if (difficulty === 'hard' || style !== 'balanced') {
    const choice = selectUtilityCandidate(publicView, hidden, style);
    if (shouldBank(publicView, choice, policyValidation.value, random))
      return createBankAction(PLAYERS.ai);
    return createRevealAction(choice.row, choice.column, PLAYERS.ai);
  }
  const choice = hidden[Math.floor(random() * hidden.length)];
  if (shouldBank(publicView, choice, policyValidation.value, random))
    return createBankAction(PLAYERS.ai);
  return createRevealAction(choice.row, choice.column, PLAYERS.ai);
}

function shouldBank(publicView, candidate, policy, random) {
  const pot = publicView.greed?.bonusPot ?? 0;
  if (!publicView.greed || publicView.greed.streak < 1) return false;
  if (policy.difficulty === 'easy') return pot > 0 && random() < 0.25;
  const risk = candidate ? estimateCandidateRisk(publicView, candidate).risk : 0.5;
  if (policy.style === 'conservative') return risk >= GREED_CONFIG.aiBankRiskThreshold;
  if (policy.style === 'greedy') return pot >= GREED_CONFIG.aiGreedyPotThreshold && risk >= 0.5;
  return policy.difficulty === 'hard' && pot > 0 && risk >= 0.5;
}
