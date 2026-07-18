import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScreen } from '../src/ui/screens/GameScreen';
import {
  createCell,
  createGreedInitialState,
  createInitialState,
} from '@greedy-sweeper/game-core/model/factories';

describe('GameScreen', () => {
  afterEach(() => cleanup());

  it('renders keyboard-accessible replay controls when a challenge has moves', () => {
    const state = createInitialState([[createCell({ neighborMines: 1 })]]);

    render(
      <GameScreen
        gameState={state}
        isAiThinking={false}
        onReveal={vi.fn()}
        onFlag={vi.fn()}
        onRestart={vi.fn()}
        replay={{ isAvailable: true, isReplaying: false, total: 2, start: vi.fn() }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Replay moves (2)' })).toBeTruthy();
  });

  it('renders game controls, instructions, score panels, and accessible board cells', () => {
    const state = createInitialState([[createCell({ neighborMines: 1 })]]);

    render(
      <GameScreen
        gameState={state}
        isAiThinking={false}
        onReveal={vi.fn()}
        onFlag={vi.fn()}
        onRestart={vi.fn()}
        aiPolicy={{ aiPolicyVersion: '1', difficulty: 'normal', style: 'balanced' }}
        isAiPolicyLocked={false}
        onAiPolicyChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: '贪婪扫雷：高风险高回报' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '重新开始' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Row 1, column 1: hidden' })).toBeTruthy();
    expect(screen.getByLabelText('Challenge code')).toBeTruthy();
    expect(screen.getByLabelText('AI difficulty')).toBeTruthy();
    expect(screen.getByText('刺激计分规则')).toBeTruthy();
  });

  it('renders a keyboard-accessible Bank control for Greed v2', () => {
    const state = createGreedInitialState([[createCell({ neighborMines: 1 })]]);
    state.greed = { streak: 1, bonusPot: 3 };
    render(
      <GameScreen
        gameState={state}
        isAiThinking={false}
        onReveal={vi.fn()}
        onFlag={vi.fn()}
        onBank={vi.fn()}
        onRestart={vi.fn()}
        mode="greed"
        onModeChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Bank rewards and end turn' })).toBeTruthy();
    expect(screen.getByLabelText('Game mode')).toBeTruthy();
  });

  it('requires confirmation before clearing progression and leaves replay history visible', () => {
    const reset = vi.fn(() => ({ ok: true }));
    render(
      <GameScreen
        gameState={createInitialState([[createCell()]])}
        isAiThinking={false}
        onReveal={vi.fn()}
        onFlag={vi.fn()}
        onRestart={vi.fn()}
        historyEntries={[{}]}
        progression={{ stats: { completedGames: 1, wins: 1, winRate: 1 }, unlocks: [], reset }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear local progression' }));
    expect(reset).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm clear local progression' }));
    expect(reset).toHaveBeenCalledWith(true);
    expect(screen.getByText('Saved replays: 1')).toBeTruthy();
  });
});
