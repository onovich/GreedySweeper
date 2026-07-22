import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UtilityDrawer } from '../src/ui/lunar/UtilityDrawer';
import { getGameUiFixture } from '../src/ui/fixtures/game-ui-fixtures';

function withTab(fixtureId, activeTab) {
  const fixture = getGameUiFixture(fixtureId);
  return { ...fixture, utilities: { ...fixture.utilities, activeTab } };
}

describe('fixture-only Lunar Console utility states', () => {
  afterEach(cleanup);

  it('renders the accepted empty record state', () => {
    render(<UtilityDrawer viewModel={withTab('utility-empty-record', 'record')} />);
    expect(screen.getByLabelText('空记录').textContent).toContain('暂无对局记录');
  });

  it('renders room review and emits only a join intent', () => {
    const onIntent = vi.fn();
    render(<UtilityDrawer viewModel={withTab('room-review', 'room')} onIntent={onIntent} />);
    expect(screen.getByText('检查规则')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '接受并加入' }));
    expect(onIntent).toHaveBeenCalledWith({ kind: 'room', action: 'join' });
  });

  it.each([
    ['online-command-pending', '等待确认'],
    ['online-reconnecting', '正在重连'],
    ['online-paused', '对局暂停'],
    ['online-command-rejected', '联机请求失败'],
  ])('renders recoverable online fixture %s', (fixtureId, title) => {
    render(<UtilityDrawer viewModel={withTab(fixtureId, 'room')} />);
    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByLabelText('联机房间状态')).toBeTruthy();
  });

  it.each([
    ['online-replaced', '席位已替换', 'alert'],
    ['online-abandoned', '对局已中止', 'status'],
    ['online-verification-failed', '结果验证失败', 'alert'],
    ['online-verified-terminal', '结果已验证', 'status'],
  ])('keeps terminal state %s semantically distinct', (fixtureId, title, role) => {
    render(<UtilityDrawer viewModel={withTab(fixtureId, 'room')} />);
    expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    expect(screen.getByRole(role)).toBeTruthy();
  });
});
