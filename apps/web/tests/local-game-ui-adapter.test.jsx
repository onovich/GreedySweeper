import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialState, createSeededRng } from '@greedy-sweeper/game-core/model/factories';
import { useGameController } from '../src/application/useGameController';
import {
  createLocalGameUiViewModel,
  createLocalIntentBridge,
} from '../src/application/presentation/local-game-ui-adapter';
import { validateGameUiViewModel } from '../src/application/presentation/game-ui-view-model';

describe('local Game UI presentation adapter', () => {
  it('maps live local authority into ViewModel v1 without exposing mines', () => {
    const config = { rows: 2, columns: 2, totalMines: 1 };
    const { result } = renderHook(() =>
      useGameController({ config, random: createSeededRng([0]), timing: { aiDelayMs: 800 } }),
    );
    const viewModel = createLocalGameUiViewModel(result.current, { config });
    expect(validateGameUiViewModel(viewModel)).toEqual({ ok: true, errors: [] });
    expect(viewModel.board.cells).toHaveLength(4);
    expect(JSON.stringify(viewModel.board.cells)).not.toMatch(/isMine|hasMine|hiddenValue/);
    expect(viewModel.session.authority).toBe('local-engine');
  });

  it('maps applied transition events to one revision-scoped Bank effect', () => {
    const gameState = {
      ...createInitialState([
        [
          {
            isRevealed: false,
            isFlagged: false,
            isWrongFlag: false,
            isExploded: false,
            flagger: null,
            neighborMines: 0,
          },
        ],
      ]),
      mode: 'greed',
      greed: { streak: 0, bonusPot: 0 },
      rulesVersion: '2',
      humanScore: 18,
      currentPlayer: 'ai',
    };
    const controller = {
      gameState,
      actionLog: [{}],
      mode: 'greed',
      aiPolicy: { difficulty: 'normal', style: 'balanced' },
      presentation: { revision: 7, events: [{ type: 'banked', player: 'human', points: 18 }] },
      replay: {},
    };
    const viewModel = createLocalGameUiViewModel(controller, {
      config: { rows: 1, columns: 1, totalMines: 0 },
    });
    expect(viewModel.effects).toEqual([
      {
        id: 'local-7-0-banked',
        kind: 'bank-confirmed',
        sourceRevision: 7,
        side: 'player',
        points: 18,
      },
    ]);
    expect(viewModel.scores[0].settlement).toBe('confirmed');
  });

  it('bridges visual intents to existing controller methods', () => {
    const controller = {
      reveal: vi.fn(),
      flag: vi.fn(),
      bank: vi.fn(),
      restart: vi.fn(),
      replay: { step: vi.fn(), togglePlay: vi.fn() },
      startDailyChallenge: vi.fn(),
    };
    const bridge = createLocalIntentBridge(controller);
    bridge.onCellIntent({ kind: 'reveal', row: 1, column: 2 });
    bridge.onCellIntent({ kind: 'flag', row: 2, column: 3 });
    bridge.onBankIntent();
    bridge.onIntent({ kind: 'replay', action: 'step' });
    expect(controller.reveal).toHaveBeenCalledWith(1, 2);
    expect(controller.flag).toHaveBeenCalledWith(2, 3);
    expect(controller.bank).toHaveBeenCalledOnce();
    expect(controller.replay.step).toHaveBeenCalledOnce();
  });

  it('records authoritative transition events on the existing local controller', () => {
    const config = { rows: 2, columns: 2, totalMines: 1 };
    const { result } = renderHook(() =>
      useGameController({ config, random: createSeededRng([0]), timing: { aiDelayMs: 800 } }),
    );
    const safe = result.current.gameState.board
      .flatMap((row, rowIndex) => row.map((cell, column) => ({ cell, row: rowIndex, column })))
      .find(({ cell }) => !cell.isMine);
    act(() => result.current.reveal(safe.row, safe.column));
    expect(result.current.presentation.revision).toBe(1);
    expect(result.current.presentation.events.length).toBeGreaterThan(0);
  });
});
