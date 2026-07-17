import { estimateCandidateRisk } from './risk-estimator';

const GREEDY_RISK_CAP = 0.75;

export function selectUtilityCandidate(publicView, candidates, style) {
  const scored = candidates.map((candidate) => ({
    candidate,
    ...estimateCandidateRisk(publicView, candidate),
  }));
  if (scored.length === 0) return null;

  const ranked =
    style === 'greedy'
      ? scored.filter(({ risk }) => risk <= GREEDY_RISK_CAP).sort(byGreedyUtility)
      : scored.sort(byConservativeUtility);
  return (ranked[0] ?? scored.sort(byConservativeUtility)[0]).candidate;
}

function byConservativeUtility(left, right) {
  return left.risk - right.risk || right.confidence - left.confidence || byPosition(left, right);
}

function byGreedyUtility(left, right) {
  return right.risk - left.risk || right.confidence - left.confidence || byPosition(left, right);
}

function byPosition(left, right) {
  return left.candidate.row - right.candidate.row || left.candidate.column - right.candidate.column;
}
