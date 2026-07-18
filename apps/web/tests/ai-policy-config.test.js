import { describe, expect, it } from 'vitest';
import {
  AI_POLICY_ERROR_CODES,
  AI_POLICY_VERSION,
  DEFAULT_AI_POLICY,
  createAiPolicy,
  validateAiPolicy,
} from '@greedy-sweeper/game-core/ai/policy-config';

describe('AI policy configuration', () => {
  it('defaults to the compatible normal balanced policy', () => {
    expect(createAiPolicy()).toEqual(DEFAULT_AI_POLICY);
    expect(validateAiPolicy(DEFAULT_AI_POLICY)).toEqual({ ok: true, value: DEFAULT_AI_POLICY });
  });

  it('validates explicit difficulty and style choices', () => {
    expect(
      validateAiPolicy({ aiPolicyVersion: AI_POLICY_VERSION, difficulty: 'hard', style: 'greedy' }),
    ).toEqual({
      ok: true,
      value: { aiPolicyVersion: '1', difficulty: 'hard', style: 'greedy' },
    });
  });

  it('returns structured policy errors without guessing compatibility', () => {
    expect(validateAiPolicy({ ...DEFAULT_AI_POLICY, difficulty: 'expert' })).toEqual({
      ok: false,
      error: { code: AI_POLICY_ERROR_CODES.invalidDifficulty },
    });
    expect(validateAiPolicy({ ...DEFAULT_AI_POLICY, aiPolicyVersion: '99' })).toEqual({
      ok: false,
      error: { code: AI_POLICY_ERROR_CODES.unsupportedVersion },
    });
  });
});
