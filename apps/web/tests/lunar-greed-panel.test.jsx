import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GreedPanel } from '../src/ui/lunar/GreedPanel';
import { getGameUiFixture } from '../src/ui/fixtures/game-ui-fixtures';

describe('Lunar Console GreedPanel', () => {
  afterEach(cleanup);

  it('renders three seven-segment multipliers, POT, and approved Bank copy', () => {
    const fixture = getGameUiFixture('local-greed-player-x3-pot18');
    const { container } = render(<GreedPanel greed={fixture.greed} />);
    expect(screen.getByLabelText('当前倍率 3')).toBeTruthy();
    expect(container.querySelectorAll('.gs-multiplier')).toHaveLength(3);
    expect(container.querySelectorAll('.gs-multiplier__segments span')).toHaveLength(21);
    expect(screen.getByLabelText('未入账奖励 18')).toBeTruthy();
    expect(screen.getByRole('button', { name: /收手.*入账 \+18 · 结束回合/ })).toBeTruthy();
  });

  it('emits a Bank intent only from the enabled button', () => {
    const onBankIntent = vi.fn();
    const fixture = getGameUiFixture('local-greed-player-x3-pot18');
    render(<GreedPanel greed={fixture.greed} onBankIntent={onBankIntent} />);
    fireEvent.click(screen.getByRole('button', { name: /收手/ }));
    expect(onBankIntent).toHaveBeenCalledTimes(1);
  });

  it('keeps pending authoritative POT and circuit at rest', () => {
    const fixture = getGameUiFixture('online-command-pending');
    const { container } = render(<GreedPanel greed={fixture.greed} effects={fixture.effects} />);
    expect(screen.getByLabelText('未入账奖励 18')).toBeTruthy();
    expect(screen.getByRole('button', { name: /等待确认.*服务器正在处理/ }).disabled).toBe(true);
    expect(container.querySelector('.gs-reward-circuit--rest')).toBeTruthy();
    expect(container.querySelector('.gs-reward-circuit--bank-confirmed')).toBeNull();
  });

  it.each([
    ['local-greed-bank-confirmed-start', 'start'],
    ['local-greed-bank-confirmed-mid', 'mid'],
    ['local-greed-bank-confirmed-end', 'end'],
  ])('renders deterministic confirmed Bank frame %s', (fixtureId, phase) => {
    const fixture = getGameUiFixture(fixtureId);
    const { container } = render(
      <GreedPanel
        greed={fixture.greed}
        effects={fixture.effects}
        effectProgress={fixture.fixture.effectProgress}
      />,
    );
    expect(container.querySelector('.gs-greed-panel').dataset.effectPhase).toBe(phase);
    expect(container.querySelector('.gs-reward-circuit--bank-confirmed')).toBeTruthy();
    expect(screen.getByText('已入账 18 分 · 回合结束')).toBeTruthy();
  });
});
