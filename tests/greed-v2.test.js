import { describe, expect, it } from 'vitest';
import { SCORE_CONFIG } from '../src/game/config/game-config';
import { applyAction } from '../src/game/engine/transition';
import {
  PLAYERS,
  createBankAction,
  createFlagAction,
  createRevealAction,
} from '../src/game/model/contracts';
import { createCell, createGreedInitialState } from '../src/game/model/factories';

const config = { rows: 2, columns: 2, totalMines: 1 };
const rules = { rulesVersion: '2', mode: 'greed' };

function state() {
  return createGreedInitialState([
    [createCell({ neighborMines: 1 }), createCell({ isMine: true })],
    [createCell({ neighborMines: 1 }), createCell({ neighborMines: 1 })],
  ]);
}

describe('Greed v2 rules', () => {
  it('keeps base points immediate and accumulates capped streak bonus before Bank', () => {
    const first = applyAction(
      state(),
      createRevealAction(0, 0, PLAYERS.human),
      config,
      SCORE_CONFIG,
      rules,
    );
    const second = applyAction(
      first.state,
      createRevealAction(1, 0, PLAYERS.human),
      config,
      SCORE_CONFIG,
      rules,
    );
    const banked = applyAction(
      second.state,
      createBankAction(PLAYERS.human),
      config,
      SCORE_CONFIG,
      rules,
    );

    expect(first.state).toMatchObject({ humanScore: 1, greed: { streak: 1, bonusPot: 0 } });
    expect(second.state).toMatchObject({ humanScore: 2, greed: { streak: 2, bonusPot: 1 } });
    expect(banked.state).toMatchObject({
      humanScore: 3,
      currentPlayer: PLAYERS.ai,
      greed: { streak: 0, bonusPot: 0 },
    });
    expect(banked.result.events).toEqual([expect.objectContaining({ type: 'banked', points: 1 })]);
  });

  it('rejects Bank before a safe reveal and keeps v1 Bank ignored', () => {
    expect(
      applyAction(state(), createBankAction(PLAYERS.human), config, SCORE_CONFIG, rules).result
        .type,
    ).toBe('ignored');
    const classic = { ...state(), rulesVersion: undefined, mode: undefined, greed: undefined };
    expect(applyAction(classic, createBankAction(PLAYERS.human), config).result.type).toBe(
      'ignored',
    );
  });

  it('cashes on a correct flag and loses the pot on a mine explosion', () => {
    const flagState = { ...state(), greed: { streak: 2, bonusPot: 7 } };
    const flagged = applyAction(
      flagState,
      createFlagAction(0, 1, PLAYERS.human),
      config,
      SCORE_CONFIG,
      rules,
    );
    expect(flagged.state).toMatchObject({
      humanScore: 12,
      greed: { streak: 0, bonusPot: 0 },
      gameOver: true,
    });
    expect(flagged.result.events).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'greed_pot_cashed', points: 7 })]),
    );

    const exploded = applyAction(
      { ...state(), greed: { streak: 2, bonusPot: 7 } },
      createRevealAction(0, 1, PLAYERS.human),
      config,
      SCORE_CONFIG,
      rules,
    );
    expect(exploded.state).toMatchObject({ humanScore: -5, greed: { streak: 0, bonusPot: 0 } });
    expect(exploded.result.events).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'greed_pot_lost', points: 7 })]),
    );
  });
});
