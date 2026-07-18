import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGameController } from '../src/application/useGameController';
import { encodeChallengeCode } from '@greedy-sweeper/game-core/challenge/code';
import { createSeededRng } from '@greedy-sweeper/game-core/model/factories';
import { createProfile } from '../src/progression/profile';

const config = { rows: 2, columns: 2, totalMines: 2 };
const timing = { aiDelayMs: 800, longPressMs: 400 };

describe('useGameController', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules one AI move after a turn-ending player action', () => {
    vi.useFakeTimers();
    const random = createSeededRng([0, 0.25]);
    const { result } = renderHook(() => useGameController({ config, timing, random }));

    act(() => result.current.flag(0, 0));
    expect(result.current.isAiThinking).toBe(true);

    act(() => vi.advanceTimersByTime(800));
    expect(result.current.gameState.gameOver).toBe(true);
    expect(result.current.gameState.minesFound).toBe(2);
  });

  it('cancels a pending AI callback when a new game starts', () => {
    vi.useFakeTimers();
    const random = createSeededRng([0, 0.25, 0.5, 0.75]);
    const { result } = renderHook(() => useGameController({ config, timing, random }));

    act(() => result.current.flag(0, 0));
    act(() => result.current.restart());
    act(() => vi.advanceTimersByTime(800));

    expect(result.current.gameState.currentPlayer).toBe('human');
    expect(result.current.gameState.minesFound).toBe(0);
  });

  it('starts a seeded challenge and replays its recorded commands', () => {
    const encoded = encodeChallengeCode({
      rulesVersion: '1',
      challengeVersion: '1',
      board: { rows: 3, columns: 3, totalMines: 1 },
      seed: '71',
      mode: 'standard',
    });
    const { result } = renderHook(() => useGameController({ timing }));

    act(() => result.current.startChallenge(encoded.value));
    act(() => result.current.flag(0, 0));

    expect(result.current.challengeDescriptor.seed).toBe('71');
    expect(result.current.actionLog).toHaveLength(1);

    act(() => result.current.replay.start());
    expect(result.current.replay.isReplaying).toBe(true);
    expect(result.current.replay.position).toBe(0);

    act(() => result.current.replay.step());
    expect(result.current.replay.position).toBe(1);

    act(() => result.current.replay.exit());
    expect(result.current.replay.isReplaying).toBe(false);
  });

  it.each([
    ['random', (controller) => controller],
    [
      'daily',
      (controller) => {
        controller.startDailyChallenge();
        return controller;
      },
    ],
    [
      'challenge',
      (controller) => {
        const encoded = encodeChallengeCode({
          rulesVersion: '1',
          challengeVersion: '1',
          board: { rows: 2, columns: 2, totalMines: 1 },
          seed: '7',
          mode: 'standard',
        });
        controller.startChallenge(encoded.value);
        return controller;
      },
    ],
  ])('registers a completed %s session once with its source', (_source, prepare) => {
    const saved = [];
    const progressionStorage = {
      load: () => ({ ok: true, value: createProfile() }),
      save: (profile) => {
        saved.push(profile);
        return { ok: true, value: profile };
      },
      reset: vi.fn(),
    };
    const { result, rerender } = renderHook(() =>
      useGameController({
        config: { rows: 2, columns: 2, totalMines: 1 },
        timing,
        random: createSeededRng([0]),
        now: () => new Date('2026-07-17T00:00:00.000Z'),
        progressionStorage,
      }),
    );
    act(() => prepare(result.current));
    const mine = result.current.gameState.board
      .flatMap((row, rowIndex) => row.map((cell, column) => ({ cell, row: rowIndex, column })))
      .find(({ cell }) => cell.isMine);
    act(() => result.current.flag(mine.row, mine.column));
    rerender();
    expect(saved).toHaveLength(1);
    expect(saved[0].facts[0].sessionSource).toBe(_source);
    rerender();
    expect(saved).toHaveLength(1);
  });
});
