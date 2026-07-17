import { GREED_CONFIG } from '../../config/greed-config';
import { ACTION_TYPES, PLAYERS, RESULT_TYPES, createResult } from '../../model/contracts';
import { applyClassicAction } from '../transition';

export function applyGreedAction(state, action, config, scoreConfig) {
  if (!isGreedState(state)) return ignored(state);
  if (action?.type === ACTION_TYPES.bank) return applyBank(state, action);

  const beforePot = state.greed.bonusPot;
  const transition = applyClassicAction(state, action, config, scoreConfig);
  if (transition.result.type !== RESULT_TYPES.applied) return transition;

  const next = transition.state;
  const primary = transition.result.events[0];
  if (primary?.type === 'safe_reveal') {
    const streak = state.greed.streak + 1;
    const multiplier = Math.min(Math.max(streak - 1, 0), GREED_CONFIG.maxStreakMultiplier);
    const added = Math.max(0, primary.points) * multiplier;
    next.greed = { streak, bonusPot: beforePot + added };
    transition.result.events.push({
      type: 'greed_pot_added',
      player: action.player,
      points: added,
      multiplier,
    });
    return transition;
  }

  if (primary?.type === 'correct_flag') {
    addScore(next, action.player, beforePot);
    transition.result.events.push({
      type: 'greed_pot_cashed',
      player: action.player,
      points: beforePot,
    });
  } else if (primary?.type === 'wrong_flag' || primary?.type === 'exploded_mine') {
    transition.result.events.push({
      type: 'greed_pot_lost',
      player: action.player,
      points: beforePot,
    });
  }
  next.greed = { streak: 0, bonusPot: 0 };
  refreshWinner(transition.result.events, next);
  return transition;
}

function applyBank(state, action) {
  if (
    state.gameOver ||
    action.player !== state.currentPlayer ||
    state.greed.streak < GREED_CONFIG.minimumBankStreak
  ) {
    return ignored(state);
  }
  const pot = state.greed.bonusPot;
  const next = {
    ...state,
    greed: { streak: 0, bonusPot: 0 },
    currentPlayer: otherPlayer(action.player),
  };
  addScore(next, action.player, pot);
  return {
    state: next,
    result: createResult(RESULT_TYPES.applied, [
      { type: 'banked', player: action.player, points: pot },
    ]),
  };
}

function isGreedState(state) {
  return Boolean(state?.rulesVersion === '2' && state.mode === 'greed' && state.greed);
}

function ignored(state) {
  return { state, result: createResult(RESULT_TYPES.ignored) };
}

function addScore(state, player, points) {
  if (player === PLAYERS.human) state.humanScore += points;
  else state.aiScore += points;
}

function otherPlayer(player) {
  return player === PLAYERS.human ? PLAYERS.ai : PLAYERS.human;
}

function refreshWinner(events, state) {
  const gameOver = events.find((event) => event.type === 'game_over');
  if (!gameOver) return;
  gameOver.winner =
    state.humanScore === state.aiScore
      ? 'draw'
      : state.humanScore > state.aiScore
        ? PLAYERS.human
        : PLAYERS.ai;
}
