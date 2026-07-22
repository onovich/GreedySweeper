import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '../src/ui/lunar/AppShell';
import { getGameUiFixture } from '../src/ui/fixtures/game-ui-fixtures';

describe('fixture-only Lunar Console AppShell', () => {
  afterEach(cleanup);

  it('renders the approved desktop regions from one View Model', () => {
    render(<AppShell viewModel={getGameUiFixture('local-greed-player-x3-pot18')} />);
    expect(screen.getByRole('heading', { name: '贪婪扫雷' })).toBeTruthy();
    expect(screen.getByLabelText('对局比分')).toBeTruthy();
    expect(screen.getByLabelText('对局配置')).toBeTruthy();
    expect(screen.getByLabelText('棋盘主区域')).toBeTruthy();
    expect(screen.getByLabelText('贪婪奖励')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: '工具栏' })).toBeTruthy();
  });

  it('keeps LOCKED neutral and inactive AI text present', () => {
    const { container } = render(
      <AppShell viewModel={getGameUiFixture('local-greed-player-x3-pot18')} />,
    );
    expect(screen.getByText('LOCKED')).toBeTruthy();
    expect(screen.getByLabelText('AI比分').textContent).toContain('等待中');
    expect(container.querySelector('.gs-lock-state').className).not.toContain('gs-status--danger');
    expect(container.querySelector('[style]')).toBeNull();
  });

  it('emits utility intents without knowing controllers', () => {
    const onIntent = vi.fn();
    render(
      <AppShell viewModel={getGameUiFixture('local-greed-player-x3-pot18')} onIntent={onIntent} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /房间/ }));
    expect(onIntent).toHaveBeenCalledWith({ kind: 'utility', tab: 'room' });
  });
});
