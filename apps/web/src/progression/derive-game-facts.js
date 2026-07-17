import { FACTS_VERSION } from './config.js';
import { validateReplayIntegrity } from '../game/replay/integrity.js';

export function deriveCompletedGameFacts(replay, { completedAt, sessionSource = 'unknown' } = {}) {
  if (typeof completedAt !== 'string' || Number.isNaN(Date.parse(completedAt)))
    return fail('progression_completed_at_invalid');
  const verified = validateReplayIntegrity(replay);
  if (!verified.ok || !verified.value.state.gameOver)
    return fail('progression_replay_not_completed');
  const { state, descriptor, results } = verified.value;
  const events = results.flatMap((item) => item.result.events);
  const count = (type) => events.filter((event) => event.type === type).length;
  const max = (type) =>
    Math.max(0, ...events.filter((event) => event.type === type).map((event) => event.points ?? 0));
  const lost = Math.max(
    0,
    ...events.filter((event) => event.type === 'greed_pot_lost').map((event) => event.points ?? 0),
  );
  const streak = events
    .filter((event) => event.type === 'greed_pot_added')
    .reduce((value, event) => Math.max(value, event.multiplier + 1), 0);
  const summary = verified.value.summary ?? replay.expectedSummary;
  return ok({
    factsVersion: FACTS_VERSION,
    id: `${summary?.replayVersion ?? descriptor.rulesVersion}:${replay.actions.length}:${summary?.hash ?? 'verified'}`,
    completedAt,
    sessionSource,
    rulesVersion: descriptor.rulesVersion,
    mode: descriptor.mode,
    replayVersion: summary?.replayVersion ?? (descriptor.rulesVersion === '2' ? '2' : '1'),
    aiPolicyVersion: replay.aiPolicy?.aiPolicyVersion ?? 'unknown',
    aiDifficulty: replay.aiPolicy?.difficulty ?? 'unknown',
    aiStyle: replay.aiPolicy?.style ?? 'unknown',
    winner:
      state.humanScore === state.aiScore
        ? 'draw'
        : state.humanScore > state.aiScore
          ? 'human'
          : 'ai',
    humanScore: state.humanScore,
    aiScore: state.aiScore,
    actionCount: replay.actions.length,
    correctFlags: count('correct_flag'),
    wrongFlags: count('wrong_flag'),
    explosions: count('exploded_mine'),
    banks: count('banked'),
    maxStreak: streak,
    maxBankedPot: Math.max(max('banked'), max('greed_pot_cashed')),
    maxLostPot: lost,
  });
}
function ok(value) {
  return { ok: true, value };
}
function fail(code) {
  return { ok: false, error: { code } };
}
