import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScreen } from '../src/ui/screens/GameScreen';
import { createCell, createInitialState } from '../src/game/model/factories';

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
      />,
    );

    expect(screen.getByRole('heading', { name: '贪婪扫雷：高风险高回报' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '重新开始' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Row 1, column 1: hidden' })).toBeTruthy();
    expect(screen.getByLabelText('Challenge code')).toBeTruthy();
    expect(screen.getByText('刺激计分规则')).toBeTruthy();
  });
});
