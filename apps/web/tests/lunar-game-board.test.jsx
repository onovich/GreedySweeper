import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameBoard, GameCell } from '../src/ui/lunar/GameBoard';
import { getGameUiFixture } from '../src/ui/fixtures/game-ui-fixtures';

describe('shared Lunar Console GameBoard', () => {
  afterEach(cleanup);

  it('renders one semantic 16×16 grid from public cell projections', () => {
    const board = getGameUiFixture('local-greed-player-x3-pot18').board;
    render(<GameBoard board={board} />);
    const grid = screen.getByRole('grid', { name: '16 行 16 列扫雷棋盘' });
    expect(grid.querySelectorAll('[role="gridcell"]')).toHaveLength(256);
    expect(grid.getAttribute('aria-disabled')).toBe('false');
  });

  it('emits reveal, context flag, and keyboard flag intents only from capabilities', () => {
    const onIntent = vi.fn();
    const cell = getGameUiFixture('local-greed-player-x3-pot18').board.cells[30];
    render(<GameCell cell={cell} locked={false} onIntent={onIntent} />);
    const button = screen.getByRole('gridcell');
    fireEvent.click(button);
    fireEvent.contextMenu(button);
    fireEvent.keyDown(button, { key: 'f' });
    expect(onIntent.mock.calls).toEqual([
      [{ kind: 'reveal', row: cell.row, column: cell.column }],
      [{ kind: 'flag', row: cell.row, column: cell.column }],
      [{ kind: 'flag', row: cell.row, column: cell.column }],
    ]);
  });

  it('retains the authoritative cells and focusability during a transient pending lock', () => {
    const onIntent = vi.fn();
    const board = getGameUiFixture('online-command-pending').board;
    render(<GameBoard board={board} onCellIntent={onIntent} />);
    const grid = screen.getByRole('grid');
    const cell = screen.getAllByRole('gridcell')[30];
    expect(grid.getAttribute('aria-disabled')).toBe('true');
    expect(cell.hasAttribute('disabled')).toBe(false);
    fireEvent.click(cell);
    fireEvent.keyDown(cell, { key: 'f' });
    expect(onIntent).not.toHaveBeenCalled();
    expect(screen.getByText('命令已发送 · 等待服务器确认')).toBeTruthy();
  });

  it.each([
    ['flagged-player', 'gs-cell--flagged-player'],
    ['flagged-opponent', 'gs-cell--flagged-opponent'],
    ['wrong-flag', 'gs-cell--wrong-flag'],
    ['exploded', 'gs-cell--exploded'],
  ])('renders the %s visual state without domain imports', (state, className) => {
    const base = getGameUiFixture('local-greed-player-x3-pot18').board.cells[30];
    render(<GameCell cell={{ ...base, state }} locked={false} onIntent={vi.fn()} />);
    expect(screen.getByRole('gridcell').className).toContain(className);
  });
});
