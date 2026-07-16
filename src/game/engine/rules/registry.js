import {
  GREED_CHALLENGE_MODE,
  GREED_RULES_VERSION,
  RULES_VERSION,
} from '../../config/protocol-config';

export function isClassicRules(rules) {
  return !rules || (rules.rulesVersion === RULES_VERSION && rules.mode === 'standard');
}

export function isGreedRules(rules) {
  return Boolean(
    rules && rules.rulesVersion === GREED_RULES_VERSION && rules.mode === GREED_CHALLENGE_MODE,
  );
}

export function isSupportedRules(rules) {
  return isClassicRules(rules) || isGreedRules(rules);
}
