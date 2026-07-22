import { describe, expect, it } from 'vitest';
import {
  GAME_UI_FIXTURE_IDS,
  GAME_UI_FIXTURES,
  getGameUiFixture,
} from '../src/ui/fixtures/game-ui-fixtures';
import { validateGameUiViewModel } from '../src/application/presentation/game-ui-view-model';
import { VISUAL_TEST_ENVIRONMENT, VISUAL_VIEWPORTS } from '../src/ui/fixtures/visual-test-manifest';

describe('Game UI View Model v1 fixture contract', () => {
  it('provides every frozen contract fixture as a valid deterministic projection', () => {
    expect(GAME_UI_FIXTURE_IDS).toHaveLength(22);
    for (const id of GAME_UI_FIXTURE_IDS) {
      const fixture = getGameUiFixture(id);
      expect(validateGameUiViewModel(fixture)).toEqual({ ok: true, errors: [] });
      expect(Object.isFrozen(fixture)).toBe(true);
      expect(GAME_UI_FIXTURES[id]).toBe(fixture);
    }
  });

  it('keeps online fixtures free of hidden mine data and credentials', () => {
    for (const id of GAME_UI_FIXTURE_IDS.filter((value) => value.startsWith('online-'))) {
      const serialized = JSON.stringify(getGameUiFixture(id));
      expect(serialized).not.toMatch(
        /seatToken|tokenDigest|hasMine|isMine|hiddenValue|"seed"|"salt"/,
      );
    }
  });

  it('preserves the last authoritative values while an online command is pending', () => {
    const active = getGameUiFixture('local-greed-player-x3-pot18');
    const pending = getGameUiFixture('online-command-pending');
    expect(pending.scores.map(({ value }) => value)).toEqual(
      active.scores.map(({ value }) => value),
    );
    expect(pending.greed.bonusPot).toBe(active.greed.bonusPot);
    expect(pending.board.cells).toEqual(active.board.cells);
    expect(pending.session.lockReason).toBe('command-pending');
  });

  it('freezes the approved screenshot environment and viewport matrix', () => {
    expect(VISUAL_TEST_ENVIRONMENT).toMatchObject({
      locale: 'zh-CN',
      timezone: 'Asia/Shanghai',
      reducedMotion: 'reduce',
      referenceViewport: 'desktop-1920',
    });
    expect(VISUAL_VIEWPORTS.map(({ id }) => id)).toEqual([
      'desktop-1920',
      'desktop-1440',
      'tablet-landscape',
      'tablet-portrait',
      'mobile-primary',
      'mobile-narrow',
    ]);
  });
});
