import { describe, expect, it } from 'vitest';
import {
  ACTION_TYPES,
  PLAYERS,
  RESULT_TYPES,
  createFlagAction,
  createResult,
  isGameAction,
} from '../src/game/model/contracts';
import { createCell, createInitialState, createSeededRng } from '../src/game/model/factories';

describe('game model contracts', () => {
  it('creates serializable cells and initial state with the human first', () => {
    const state = createInitialState([[createCell({ isMine: true })]]);

    expect(state.currentPlayer).toBe(PLAYERS.human);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it('expresses player commands and result contracts without UI values', () => {
    const action = createFlagAction(2, 3, PLAYERS.ai);

    expect(action).toEqual({ type: ACTION_TYPES.flag, row: 2, column: 3, player: PLAYERS.ai });
    expect(isGameAction(action)).toBe(true);
    expect(isGameAction({ ...action, row: 2.5 })).toBe(false);
    expect(createResult(RESULT_TYPES.applied, [{ type: 'flagged' }])).toEqual({
      type: RESULT_TYPES.applied,
      events: [{ type: 'flagged' }],
    });
  });

  it('provides deterministic injected randomness for later engine tests', () => {
    const random = createSeededRng([0.1, 0.9]);

    expect([random(), random(), random()]).toEqual([0.1, 0.9, 0.1]);
  });
});
