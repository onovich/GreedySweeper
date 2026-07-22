import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../src/app/App';

describe('production Lunar Console composition', () => {
  afterEach(cleanup);

  it('renders the shared Lunar shell as the only production game surface', () => {
    const { container } = render(<App />);
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByRole('grid', { name: /16 行 16 列扫雷棋盘/ })).toBeTruthy();
    expect(container.querySelectorAll('.gs-shell')).toHaveLength(1);
    expect(container.querySelector('.game-shell')).toBeNull();
  });

  it('opens the room utility without replacing the local authoritative board', () => {
    render(<App />);
    const firstCell = screen.getAllByRole('gridcell')[0];
    fireEvent.click(screen.getByRole('button', { name: /房间/ }));
    expect(screen.getByRole('heading', { name: '房间' })).toBeTruthy();
    expect(screen.getByText('联机不可用')).toBeTruthy();
    expect(screen.getAllByRole('gridcell')[0]).toBe(firstCell);
  });
});
