import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGameController } from '../src/application/useGameController';
import { encodeChallengeCode } from '../src/game/challenge/code';
import { createSeededRng } from '../src/game/model/factories';

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
});
