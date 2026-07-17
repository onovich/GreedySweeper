import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCell, createInitialState } from '../src/game/model/factories';
import { GameScreen } from '../src/ui/screens/GameScreen';

function renderPlayableScreen() {
  const onReveal = vi.fn();
  const onFlag = vi.fn();
  render(
    <GameScreen
      gameState={createInitialState([[createCell()]])}
      isAiThinking={false}
      onReveal={onReveal}
      onFlag={onFlag}
      onRestart={vi.fn()}
    />,
  );
  return { onReveal, onFlag };
}

describe('game interaction smoke', () => {
  afterEach(cleanup);

  it('routes a desktop primary pointer gesture to reveal', () => {
    const { onReveal } = renderPlayableScreen();
    const cell = screen.getByRole('button', { name: 'Row 1, column 1: hidden' });

    fireEvent.pointerDown(cell, { button: 0 });
    fireEvent.pointerUp(cell, { button: 0 });

    expect(onReveal).toHaveBeenCalledWith(0, 0);
  });

  it('routes a desktop context-menu gesture to flag without navigation', () => {
    const { onFlag } = renderPlayableScreen();
    const cell = screen.getByRole('button', { name: 'Row 1, column 1: hidden' });

    fireEvent.contextMenu(cell, { pointerType: 'mouse' });

    expect(onFlag).toHaveBeenCalledWith(0, 0);
  });
});
