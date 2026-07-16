export const AI_POLICY_VERSION = '1';

export const AI_DIFFICULTIES = Object.freeze({
  easy: 'easy',
  normal: 'normal',
  hard: 'hard',
});

export const AI_STYLES = Object.freeze({
  balanced: 'balanced',
  conservative: 'conservative',
  greedy: 'greedy',
});

export const DEFAULT_AI_POLICY = Object.freeze({
  aiPolicyVersion: AI_POLICY_VERSION,
  difficulty: AI_DIFFICULTIES.normal,
  style: AI_STYLES.balanced,
});

export const AI_POLICY_ERROR_CODES = Object.freeze({
  malformed: 'ai_policy_malformed',
  unsupportedVersion: 'ai_policy_version_unsupported',
  invalidDifficulty: 'ai_policy_difficulty_invalid',
  invalidStyle: 'ai_policy_style_invalid',
  locked: 'ai_policy_locked',
});

export function createAiPolicy(policy = {}) {
  return {
    aiPolicyVersion: policy.aiPolicyVersion ?? AI_POLICY_VERSION,
    difficulty: policy.difficulty ?? AI_DIFFICULTIES.normal,
    style: policy.style ?? AI_STYLES.balanced,
  };
}

export function validateAiPolicy(policy) {
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
    return failure(AI_POLICY_ERROR_CODES.malformed);
  }
  if (policy.aiPolicyVersion !== AI_POLICY_VERSION) {
    return failure(AI_POLICY_ERROR_CODES.unsupportedVersion);
  }
  if (!Object.values(AI_DIFFICULTIES).includes(policy.difficulty)) {
    return failure(AI_POLICY_ERROR_CODES.invalidDifficulty);
  }
  if (!Object.values(AI_STYLES).includes(policy.style)) {
    return failure(AI_POLICY_ERROR_CODES.invalidStyle);
  }

  return success(createAiPolicy(policy));
}

function success(value) {
  return { ok: true, value };
}

function failure(code) {
  return { ok: false, error: { code } };
}
