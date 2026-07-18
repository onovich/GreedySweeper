import { FACTS_VERSION } from './config.js';

export function deriveVerifiedOnlineFact({ commitment, ruleset, snapshot, completedAt }) {
  if (
    typeof commitment !== 'string' ||
    !/^[a-f0-9]{64}$/.test(commitment) ||
    !snapshot?.gameOver ||
    !Number.isFinite(snapshot.humanScore) ||
    !Number.isFinite(snapshot.aiScore) ||
    typeof completedAt !== 'string' ||
    Number.isNaN(Date.parse(completedAt))
  )
    return { ok: false, error: { code: 'online_progression_unverified' } };
  const winner =
    snapshot.humanScore === snapshot.aiScore
      ? 'draw'
      : snapshot.humanScore > snapshot.aiScore
        ? 'human'
        : 'ai';
  return {
    ok: true,
    value: {
      factsVersion: FACTS_VERSION,
      id: `online:${commitment}`,
      completedAt,
      sessionSource: 'online',
      rulesVersion: ruleset === 'greed-v2' ? '2' : '1',
      mode: ruleset === 'greed-v2' ? 'greed' : 'standard',
      replayVersion: ruleset === 'greed-v2' ? '2' : '1',
      aiPolicyVersion: 'online-authority-v1',
      aiDifficulty: 'online',
      aiStyle: 'online',
      winner,
      humanScore: snapshot.humanScore,
      aiScore: snapshot.aiScore,
      actionCount: snapshot.sequence,
      correctFlags: 0,
      wrongFlags: 0,
      explosions: 0,
      banks: 0,
      maxStreak: 0,
      maxBankedPot: 0,
      maxLostPot: 0,
    },
  };
}
