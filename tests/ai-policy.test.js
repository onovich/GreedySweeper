import { describe, expect, it } from 'vitest';
import { selectAiAction } from '../src/game/ai/select-action';
import { ACTION_TYPES, PLAYERS } from '../src/game/model/contracts';
import { createCell, createInitialState } from '../src/game/model/factories';

const config = { rows: 2, columns: 2, totalMines: 1 };

describe('AI policy', () => {
  it('flags the first logically certain mine using the original scan order', () => {
    const state = createInitialState([
      [{ ...createCell({ neighborMines: 1 }), isRevealed: true }, createCell()],
      [
        { ...createCell(), isRevealed: true },
        { ...createCell(), isRevealed: true },
      ],
    ]);

    expect(selectAiAction(state, config)).toEqual({
      type: ACTION_TYPES.flag,
      row: 0,
      column: 1,
      player: PLAYERS.ai,
    });
  });

  it('reveals the first logically certain safe cell after adjacent mines are flagged', () => {
    const state = createInitialState([
      [
        { ...createCell({ neighborMines: 1 }), isRevealed: true },
        { ...createCell(), isFlagged: true },
      ],
      [createCell(), { ...createCell(), isRevealed: true }],
    ]);

    expect(selectAiAction(state, config)).toEqual({
      type: ACTION_TYPES.reveal,
      row: 1,
      column: 0,
      player: PLAYERS.ai,
    });
  });

  it('uses injected random choice only when no deterministic move exists', () => {
    const state = createInitialState([
      [createCell(), createCell()],
      [createCell(), createCell()],
    ]);

    expect(selectAiAction(state, config, () => 0.75)).toEqual({
      type: ACTION_TYPES.reveal,
      row: 1,
      column: 1,
      player: PLAYERS.ai,
    });
  });

  it('returns no action when all cells are already unavailable', () => {
    const state = createInitialState([
      [
        { ...createCell(), isRevealed: true },
        { ...createCell(), isFlagged: true },
      ],
      [
        { ...createCell(), isRevealed: true },
        { ...createCell(), isRevealed: true },
      ],
    ]);

    expect(selectAiAction(state, config)).toBeNull();
  });

  it('keeps normal balanced behavior compatible with the original selector call shape', () => {
    const state = createInitialState([
      [createCell(), createCell()],
      [createCell(), createCell()],
    ]);

    expect(selectAiAction(state, config, () => 0.25)).toEqual(
      selectAiAction(state, config, () => 0.25, {
        aiPolicyVersion: '1',
        difficulty: 'normal',
        style: 'balanced',
      }),
    );
  });

  it('uses injected random legal candidates for easy mode before deterministic inference', () => {
    const state = createInitialState([
      [{ ...createCell({ neighborMines: 1 }), isRevealed: true }, createCell(), createCell()],
      [createCell(), { ...createCell(), isRevealed: true }, { ...createCell(), isRevealed: true }],
    ]);
    const threeColumns = { rows: 2, columns: 3, totalMines: 1 };
    const policy = { aiPolicyVersion: '1', difficulty: 'easy', style: 'balanced' };

    expect(selectAiAction(state, threeColumns, () => 0.75, policy)).toEqual({
      type: ACTION_TYPES.reveal,
      row: 1,
      column: 0,
      player: PLAYERS.ai,
    });
  });

  it('chooses the same hard action for public-equivalent hidden layouts', () => {
    const first = createInitialState([
      [{ ...createCell({ neighborMines: 1 }), isRevealed: true }, createCell({ isMine: true })],
      [createCell({ isMine: false }), createCell({ isMine: false })],
    ]);
    const second = createInitialState([
      [{ ...createCell({ neighborMines: 1 }), isRevealed: true }, createCell({ isMine: false })],
      [createCell({ isMine: true }), createCell({ isMine: false })],
    ]);
    const hard = { aiPolicyVersion: '1', difficulty: 'hard', style: 'conservative' };

    expect(selectAiAction(first, config, () => 0, hard)).toEqual(
      selectAiAction(second, config, () => 0, hard),
    );
  });
});
