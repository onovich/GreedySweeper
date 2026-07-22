import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GameBoard } from '../src/ui/lunar/GameBoard';
import {
  CELL_LONG_PRESS_MS,
  CELL_PAN_THRESHOLD_PX,
} from '../src/ui/lunar/useLunarCellPointerIntent';
import { getGameUiFixture } from '../src/ui/fixtures/game-ui-fixtures';

const lunarPath = (file) => resolve(process.cwd(), 'apps', 'web', 'src', 'ui', 'lunar', file);
const responsiveSource = readFileSync(lunarPath('app-shell.css'), 'utf8');
const boardSource = readFileSync(lunarPath('game-board.css'), 'utf8');

describe('Lunar Console responsive contract and touch intent', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('freezes explicit medium and compact reflow bands with a 44px scroll board', () => {
    expect(responsiveSource).toContain('@media (max-width: 1279px) and (min-width: 960px)');
    expect(responsiveSource).toContain('@media (max-width: 959px)');
    expect(responsiveSource).toContain('@media (max-width: 767px)');
    expect(boardSource).toContain('overflow: auto');
    expect(boardSource).toContain('var(--gs-cell-touch)');
  });

  it('maps a short touch to one reveal and suppresses the synthetic click', () => {
    const onIntent = vi.fn();
    render(
      <GameBoard
        board={getGameUiFixture('local-greed-player-x3-pot18').board}
        onCellIntent={onIntent}
      />,
    );
    const cell = screen.getAllByRole('gridcell')[30];
    fireEvent.pointerDown(cell, { pointerType: 'touch', button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(cell, { pointerType: 'touch', button: 0, clientX: 10, clientY: 10 });
    fireEvent.click(cell);
    expect(onIntent).toHaveBeenCalledTimes(1);
    expect(onIntent.mock.calls[0][0].kind).toBe('reveal');
  });

  it('maps a 400ms stationary touch to one flag', () => {
    vi.useFakeTimers();
    const onIntent = vi.fn();
    render(
      <GameBoard
        board={getGameUiFixture('local-greed-player-x3-pot18').board}
        onCellIntent={onIntent}
      />,
    );
    const cell = screen.getAllByRole('gridcell')[30];
    fireEvent.pointerDown(cell, { pointerType: 'touch', button: 0, clientX: 10, clientY: 10 });
    act(() => vi.advanceTimersByTime(CELL_LONG_PRESS_MS));
    fireEvent.pointerUp(cell, { pointerType: 'touch', button: 0, clientX: 10, clientY: 10 });
    fireEvent.click(cell);
    expect(onIntent).toHaveBeenCalledOnce();
    expect(onIntent).toHaveBeenCalledWith({ kind: 'flag', row: 1, column: 14 });
  });

  it('cancels cell intent when touch movement reaches the panning threshold', () => {
    vi.useFakeTimers();
    const onIntent = vi.fn();
    render(
      <GameBoard
        board={getGameUiFixture('local-greed-player-x3-pot18').board}
        onCellIntent={onIntent}
      />,
    );
    const cell = screen.getAllByRole('gridcell')[30];
    fireEvent.pointerDown(cell, { pointerType: 'touch', button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(cell, {
      pointerType: 'touch',
      clientX: 10 + CELL_PAN_THRESHOLD_PX,
      clientY: 10,
    });
    act(() => vi.advanceTimersByTime(CELL_LONG_PRESS_MS));
    fireEvent.pointerUp(cell, { pointerType: 'touch', button: 0, clientX: 18, clientY: 10 });
    fireEvent.click(cell);
    expect(onIntent).not.toHaveBeenCalled();
  });
});
